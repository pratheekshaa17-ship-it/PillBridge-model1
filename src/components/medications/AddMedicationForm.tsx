import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Upload, Camera, Pill } from 'lucide-react';
import { apiClient } from '../../lib/api';

interface AddMedicationFormProps {
  onMedicationAdded: () => void;
}

const API_BASE = 'http://localhost:3000';

// File upload function - now supports both GridFS (images) and filesystem (audio)
const uploadFile = async (file: File, type: 'image' | 'audio'): Promise<string> => {
  const formData = new FormData();
  
  if (type === 'image') {
    // Use new MongoDB GridFS endpoint for images
    formData.append('image', file);
    formData.append('category', 'medication');
    
    console.log(`🖼️ Uploading image to MongoDB GridFS:`, {
      filename: file.name,
      size: file.size,
      type: file.type,
      endpoint: `${API_BASE}/images`
    });
    
    try {
      const response = await fetch(`${API_BASE}/images`, {
        method: 'POST',
        body: formData,
      });
      
      console.log('📡 Response status:', response.status, response.statusText);
      
      if (!response.ok) {
        let errorData;
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
          errorData = await response.json();
        } else {
          const errorText = await response.text();
          errorData = { error: errorText || `HTTP ${response.status}` };
        }
        
        console.error('❌ Image upload to MongoDB failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        throw new Error(errorData.error || `Failed to upload image (${response.status})`);
      }
      
      const data = await response.json();
      console.log('✅ Image uploaded successfully to MongoDB:', data);
      return data.url;
    } catch (fetchError) {
      console.error('🔥 Network error during image upload:', fetchError);
      if (fetchError.message.includes('Failed to fetch')) {
        throw new Error('Cannot connect to server. Make sure the backend is running on port 3000.');
      }
      throw fetchError;
    }
  } else {
    // Use existing filesystem endpoint for audio files
    formData.append('file', file);
    formData.append('type', type);
    
    console.log(`Uploading ${type} file:`, file.name, file.size, file.type);
    
    const response = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Upload failed:', errorData);
      throw new Error(errorData.error || `Failed to upload ${type}`);
    }
    
    const data = await response.json();
    console.log('Upload successful:', data);
    return data.url;
  }
};

export function AddMedicationForm({ onMedicationAdded }: AddMedicationFormProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    dosage: '',
    totalCount: '',
    currentCount: '',
    lowStockThreshold: '',
    morningDose: false,
    afternoonDose: false,
    nightDose: false,
    morningTime: '08:00',
    afternoonTime: '14:00',
    nightTime: '20:00',
    instructions: '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'audio') => {
    const file = e.target.files?.[0];
    if (file) {
      if (type === 'image') {
        setImageFile(file);
      } else {
        setAudioFile(file);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate at least one dose time is selected
      if (!formData.morningDose && !formData.afternoonDose && !formData.nightDose) {
        setError('Please select at least one dose time');
        setLoading(false);
        return;
      }

      // Upload files if provided
      let imageUrl = null;
      let audioUrl = null;

      if (imageFile) {
        try {
          console.log('Uploading image file:', imageFile.name);
          imageUrl = await uploadFile(imageFile, 'image');
          console.log('Image uploaded successfully:', imageUrl);
        } catch (error) {
          console.error('Image upload failed:', error);
          setError('Failed to upload image. Please try again.');
          setLoading(false);
          return;
        }
      }
      
      if (audioFile) {
        try {
          console.log('Uploading audio file:', audioFile.name);
          audioUrl = await uploadFile(audioFile, 'audio');
          console.log('Audio uploaded successfully:', audioUrl);
        } catch (error) {
          console.error('Audio upload failed:', error);
          // Continue without audio if upload fails
        }
      }

      // Only set imageUrl if an actual image was uploaded
      // Don't create placeholder URLs automatically

      console.log('💊 Creating medication with data:', {
        patient_id: user._id,
        name: formData.name,
        dosage: formData.dosage,
        image_url: imageUrl,
        audio_url: audioUrl
      });

      // Insert medication via backend
      const medicationData = {
        patient_id: user._id,
        name: formData.name,
        dosage: formData.dosage,
        total_count: parseInt(formData.totalCount),
        current_count: parseInt(formData.currentCount),
        low_stock_threshold: parseInt(formData.lowStockThreshold) || 5,
        morning_dose: formData.morningDose,
        afternoon_dose: formData.afternoonDose,
        night_dose: formData.nightDose,
        morning_time: formData.morningTime,
        afternoon_time: formData.afternoonTime,
        night_time: formData.nightTime,
        instructions: formData.instructions,
        image_url: imageUrl,
        audio_url: audioUrl,
      };

      console.log('📤 Sending medication data to backend:', medicationData);

      const res = await fetch(`${API_BASE}/medications`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(medicationData),
      });
      
      console.log('📡 Medication creation response status:', res.status, res.statusText);
      
      if (!res.ok) {
        let errorData;
        const contentType = res.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
          errorData = await res.json();
        } else {
          const errorText = await res.text();
          errorData = { error: errorText || `HTTP ${res.status}` };
        }
        
        console.error('❌ Medication creation failed:', {
          status: res.status,
          statusText: res.statusText,
          error: errorData
        });
        throw new Error(errorData.error || `Failed to add medication (${res.status})`);
      }
      
      const medication = await res.json();
      console.log('✅ Medication created successfully:', medication);
      
      // Create daily reminders for this medication (non-blocking)
      createDailyReminders(medication).catch(error => {
        console.warn('Failed to create reminders, but medication was saved successfully:', error);
      });

      // Reset form
      setFormData({
        name: '',
        dosage: '',
        totalCount: '',
        currentCount: '',
        lowStockThreshold: '',
        morningDose: false,
        afternoonDose: false,
        nightDose: false,
        morningTime: '08:00',
        afternoonTime: '14:00',
        nightTime: '20:00',
        instructions: '',
      });
      setImageFile(null);
      setAudioFile(null);
      onMedicationAdded();
    } catch (err: any) {
      console.error('Error adding medication:', err);
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
          <Pill className="h-8 w-8 text-blue-600 dark:text-blue-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Add New Medication</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Fill in the details for your medication</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 rounded-lg">
          <p className="text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-gray-50 dark:bg-slate-800/50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-200 mb-4">Basic Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                Medication Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:border-slate-600 dark:text-gray-200 dark:placeholder-gray-400"
                placeholder="e.g., Lisinopril"
              />
            </div>

            <div>
              <label htmlFor="dosage" className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                Dosage *
              </label>
              <input
                type="text"
                id="dosage"
                name="dosage"
                value={formData.dosage}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:border-slate-600 dark:text-gray-200 dark:placeholder-gray-400"
                placeholder="e.g., 10mg"
              />
            </div>
          </div>
        </div>

        {/* Stock Information */}
        <div className="bg-gray-50 dark:bg-slate-800/50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-200 mb-4">Stock Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="totalCount" className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                Total Pills *
              </label>
              <input
                type="number"
                id="totalCount"
                name="totalCount"
                value={formData.totalCount}
                onChange={handleInputChange}
                required
                min="1"
                className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:border-slate-600 dark:text-gray-200 dark:placeholder-gray-400"
                placeholder="30"
              />
            </div>

            <div>
              <label htmlFor="currentCount" className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                Current Pills *
              </label>
              <input
                type="number"
                id="currentCount"
                name="currentCount"
                value={formData.currentCount}
                onChange={handleInputChange}
                required
                min="0"
                className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:border-slate-600 dark:text-gray-200 dark:placeholder-gray-400"
                placeholder="30"
              />
            </div>

            <div>
              <label htmlFor="lowStockThreshold" className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                Low Stock Alert
              </label>
              <input
                type="number"
                id="lowStockThreshold"
                name="lowStockThreshold"
                value={formData.lowStockThreshold}
                onChange={handleInputChange}
                min="1"
                className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:border-slate-600 dark:text-gray-200 dark:placeholder-gray-400"
                placeholder="5"
              />
            </div>
          </div>
        </div>

        {/* Schedule */}
        <div className="bg-gray-50 dark:bg-slate-800/50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-200 mb-4">Dose Schedule & Reminder Times *</h3>
          
          <div className="space-y-4">
            {/* Morning */}
            <div className="border border-gray-300 dark:border-slate-600 rounded-lg p-4">
              <label className="flex items-center mb-3">
                <input
                  type="checkbox"
                  name="morningDose"
                  checked={formData.morningDose}
                  onChange={handleInputChange}
                  className="h-5 w-5 text-blue-600 rounded mr-3 dark:bg-slate-700 dark:border-slate-500"
                />
                <span className="text-lg font-medium dark:text-gray-300">Morning Dose</span>
              </label>
              {formData.morningDose && (
                <div className="ml-8">
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Reminder Time:</label>
                  <input
                    type="time"
                    name="morningTime"
                    value={formData.morningTime}
                    onChange={handleInputChange}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:border-slate-600 dark:text-gray-200"
                  />
                </div>
              )}
            </div>
            
            {/* Afternoon */}
            <div className="border border-gray-300 dark:border-slate-600 rounded-lg p-4">
              <label className="flex items-center mb-3">
                <input
                  type="checkbox"
                  name="afternoonDose"
                  checked={formData.afternoonDose}
                  onChange={handleInputChange}
                  className="h-5 w-5 text-blue-600 rounded mr-3 dark:bg-slate-700 dark:border-slate-500"
                />
                <span className="text-lg font-medium dark:text-gray-300">Afternoon Dose</span>
              </label>
              {formData.afternoonDose && (
                <div className="ml-8">
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Reminder Time:</label>
                  <input
                    type="time"
                    name="afternoonTime"
                    value={formData.afternoonTime}
                    onChange={handleInputChange}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:border-slate-600 dark:text-gray-200"
                  />
                </div>
              )}
            </div>
            
            {/* Night */}
            <div className="border border-gray-300 dark:border-slate-600 rounded-lg p-4">
              <label className="flex items-center mb-3">
                <input
                  type="checkbox"
                  name="nightDose"
                  checked={formData.nightDose}
                  onChange={handleInputChange}
                  className="h-5 w-5 text-blue-600 rounded mr-3 dark:bg-slate-700 dark:border-slate-500"
                />
                <span className="text-lg font-medium dark:text-gray-300">Night Dose</span>
              </label>
              {formData.nightDose && (
                <div className="ml-8">
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Reminder Time:</label>
                  <input
                    type="time"
                    name="nightTime"
                    value={formData.nightTime}
                    onChange={handleInputChange}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:border-slate-600 dark:text-gray-200"
                  />
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/50 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <strong>Note:</strong> You will receive audio notifications at the specified times. 
              Make sure to allow browser notifications for this website.
            </p>
          </div>
        </div>

        {/* Files */}
        <div className="bg-gray-50 dark:bg-slate-800/50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-200 mb-4">Photos & Audio</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                Medication Photo
              </label>
              <div className="border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg p-6 text-center">
                <Camera className="h-8 w-8 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, 'image')}
                  className="hidden"
                  id="image-upload"
                />
                <label htmlFor="image-upload" className="cursor-pointer">
                  <span className="text-blue-600 dark:text-blue-400 font-medium">Upload photo</span>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">PNG, JPG up to 10MB</p>
                </label>
                {imageFile && (
                  <p className="text-sm text-green-600 dark:text-green-400 mt-2">{imageFile.name}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                Audio Reminder
              </label>
              <div className="border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg p-6 text-center">
                <Upload className="h-8 w-8 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
                <input
                  type="file"
                  accept="audio/*"
                  onChange={(e) => handleFileChange(e, 'audio')}
                  className="hidden"
                  id="audio-upload"
                />
                <label htmlFor="audio-upload" className="cursor-pointer">
                  <span className="text-blue-600 dark:text-blue-400 font-medium">Upload audio</span>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">MP3, WAV up to 10MB</p>
                </label>
                {audioFile && (
                  <p className="text-sm text-green-600 dark:text-green-400 mt-2">{audioFile.name}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div>
          <label htmlFor="instructions" className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
            Special Instructions
          </label>
          <textarea
            id="instructions"
            name="instructions"
            value={formData.instructions}
            onChange={handleInputChange}
            rows={3}
            className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:border-slate-600 dark:text-gray-200 dark:placeholder-gray-400"
            placeholder="Take with food, avoid dairy, etc."
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-lg font-semibold py-4 rounded-lg transition-colors duration-200 dark:disabled:bg-slate-600"
        >
          {loading ? 'Adding Medication...' : 'Add Medication'}
        </button>
      </form>
    </div>
  );
}

const createDailyReminders = async (medication: any) => {
  // Function to create reminders for each dose time
  const reminderPromises = [];

  if (medication.morning_dose) {
    reminderPromises.push(apiClient.reminders.create({
      medication_id: medication._id,
      patient_id: medication.patient_id,
      reminder_time: getReminderTime(medication.morning_time),
      acknowledged: false,
      escalated: false,
    }));
  }

  if (medication.afternoon_dose) {
    reminderPromises.push(apiClient.reminders.create({
      medication_id: medication._id,
      patient_id: medication.patient_id,
      reminder_time: getReminderTime(medication.afternoon_time),
      acknowledged: false,
      escalated: false,
    }));
  }

  if (medication.night_dose) {
    reminderPromises.push(apiClient.reminders.create({
      medication_id: medication._id,
      patient_id: medication.patient_id,
      reminder_time: getReminderTime(medication.night_time),
      acknowledged: false,
      escalated: false,
    }));
  }

  // Wait for all reminders to be created
  await Promise.all(reminderPromises);
};

const getReminderTime = (time: string) => {
  const today = new Date();
  const [hours, minutes] = time.split(':').map(Number);
  today.setHours(hours, minutes, 0, 0);
  return today.toISOString();
};
