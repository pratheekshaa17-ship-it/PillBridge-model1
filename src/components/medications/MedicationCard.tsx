import React, { useState } from 'react';
import { Pill, Clock, AlertTriangle, Volume2, Edit3, Trash2 } from 'lucide-react';

interface MedicationCardProps {
  medication: any;
  onUpdate: () => void;
}

const API_BASE = 'http://localhost:3000';

export function MedicationCard({ medication, onUpdate }: MedicationCardProps) {
  const [loading, setLoading] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState({
    name: medication.name,
    dosage: medication.dosage,
    total_count: medication.total_count,
    current_count: medication.current_count,
    low_stock_threshold: medication.low_stock_threshold,
    morning_dose: medication.morning_dose,
    afternoon_dose: medication.afternoon_dose,
    night_dose: medication.night_dose,
    instructions: medication.instructions || '',
  });

  const getDoseSchedule = () => {
    const schedule = [];
    if (medication.morning_dose) schedule.push('Morning');
    if (medication.afternoon_dose) schedule.push('Afternoon');
    if (medication.night_dose) schedule.push('Night');
    return schedule.join(', ');
  };

  const isLowStock = medication.current_count <= medication.low_stock_threshold;

  const handleTakeMedication = async () => {
    if (medication.current_count <= 0) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/medications/${medication._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_count: medication.current_count - 1,
          updated_at: new Date().toISOString(),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update medication');
      }
      onUpdate();
    } catch (error) {
      console.error('Error updating medication count:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMedication = async () => {
    if (!window.confirm('Are you sure you want to delete this medication?')) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/medications/${medication._id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete medication');
      }
      onUpdate();
    } catch (error) {
      console.error('Error deleting medication:', error);
    } finally {
      setLoading(false);
    }
  };

  const playAudioReminder = () => {
    if (medication.audio_url) {
      const audio = new Audio(medication.audio_url);
      audio.play().catch(console.error);
    }
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/medications/${medication._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editForm,
          total_count: parseInt(editForm.total_count),
          current_count: parseInt(editForm.current_count),
          low_stock_threshold: parseInt(editForm.low_stock_threshold),
          updated_at: new Date().toISOString(),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update medication');
      }
      setShowEdit(false);
      onUpdate();
    } catch (error) {
      console.error('Error updating medication:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`bg-white rounded-xl border-2 p-6 transition-all duration-200 hover:shadow-lg ${
      isLowStock ? 'border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-500/30' : 'border-gray-200 dark:bg-slate-800 dark:border-slate-700'
    }`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center">
          {medication.image_url ? (
            <img
              src={medication.image_url}
              alt={medication.name}
              className="w-16 h-16 rounded-lg object-cover mr-4"
            />
          ) : (
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center mr-4">
              <Pill className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
          )}
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">{medication.name}</h3>
            <p className="text-lg text-gray-600 dark:text-gray-400">{medication.dosage}</p>
          </div>
        </div>
        
        <div className="flex space-x-2">
          {medication.audio_url && (
            <button
              onClick={playAudioReminder}
              className="p-2 bg-green-100 hover:bg-green-200 text-green-600 dark:bg-green-900/50 dark:hover:bg-green-900/80 dark:text-green-300 rounded-lg transition-colors duration-200"
              title="Play audio reminder"
            >
              <Volume2 className="h-5 w-5" />
            </button>
          )}
          <button className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-gray-300 rounded-lg transition-colors duration-200" onClick={() => setShowEdit(true)}>
            <Edit3 className="h-5 w-5" />
          </button>
          <button className="p-2 bg-red-100 hover:bg-red-200 text-red-600 dark:bg-red-900/50 dark:hover:bg-red-900/80 dark:text-red-300 rounded-lg transition-colors duration-200" onClick={handleDeleteMedication} disabled={loading}>
            <Trash2 className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Stock Status */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-700 dark:text-gray-300 font-medium">Stock Level</span>
          <span className={`font-bold ${isLowStock ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
            {medication.current_count} / {medication.total_count}
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all duration-300 ${
              isLowStock ? 'bg-red-500' : 'bg-green-500'
            }`}
            style={{
              width: `${Math.max(5, (medication.current_count / medication.total_count) * 100)}%`
            }}
          ></div>
        </div>
        {isLowStock && (
          <div className="flex items-center mt-2 text-red-600 dark:text-red-400">
            <AlertTriangle className="h-4 w-4 mr-1" />
            <span className="text-sm font-medium">Low stock - time to refill!</span>
          </div>
        )}
      </div>

      {/* Schedule */}
      <div className="mb-4">
        <div className="flex items-center mb-2">
          <Clock className="h-5 w-5 text-gray-600 dark:text-gray-400 mr-2" />
          <span className="text-gray-700 dark:text-gray-300 font-medium">Schedule</span>
        </div>
        <p className="text-gray-600 dark:text-gray-400 ml-7">{getDoseSchedule()}</p>
      </div>

      {/* Instructions */}
      {medication.instructions && (
        <div className="mb-4">
          <p className="text-sm text-gray-600 bg-gray-50 dark:bg-slate-700/50 dark:text-gray-300 rounded-lg p-3">
            <span className="font-medium">Instructions:</span> {medication.instructions}
          </p>
        </div>
      )}

      {/* Take Medication Button */}
      <button
        onClick={handleTakeMedication}
        disabled={loading || medication.current_count <= 0}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 dark:disabled:bg-slate-600 text-white font-semibold py-3 rounded-lg transition-colors duration-200"
      >
        {loading ? 'Updating...' : 
         medication.current_count <= 0 ? 'Out of Stock' : 
         'Mark as Taken'}
      </button>

      {/* Edit Modal */}
      {showEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-8 w-full max-w-lg shadow-xl relative">
            <button className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" onClick={() => setShowEdit(false)}>&times;</button>
            <h2 className="text-2xl font-bold mb-4 dark:text-gray-100">Edit Medication</h2>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                <input type="text" name="name" value={editForm.name} onChange={handleEditInputChange} className="w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-gray-200" required />
              </div>
              <div>
                <label className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-1">Dosage</label>
                <input type="text" name="dosage" value={editForm.dosage} onChange={handleEditInputChange} className="w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-gray-200" required />
              </div>
              <div className="flex space-x-2">
                <div className="flex-1">
                  <label className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-1">Total Count</label>
                  <input type="number" name="total_count" value={editForm.total_count} onChange={handleEditInputChange} className="w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-gray-200" required />
                </div>
                <div className="flex-1">
                  <label className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-1">Current Count</label>
                  <input type="number" name="current_count" value={editForm.current_count} onChange={handleEditInputChange} className="w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-gray-200" required />
                </div>
              </div>
              <div>
                <label className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-1">Low Stock Threshold</label>
                <input type="number" name="low_stock_threshold" value={editForm.low_stock_threshold} onChange={handleEditInputChange} className="w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-gray-200" required />
              </div>
              <div className="flex space-x-2 dark:text-gray-300">
                <label className="flex items-center space-x-2">
                  <input type="checkbox" name="morning_dose" checked={editForm.morning_dose} onChange={handleEditInputChange} className="dark:bg-slate-700 dark:border-slate-600" />
                  <span>Morning</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" name="afternoon_dose" checked={editForm.afternoon_dose} onChange={handleEditInputChange} className="dark:bg-slate-700 dark:border-slate-600" />
                  <span>Afternoon</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" name="night_dose" checked={editForm.night_dose} onChange={handleEditInputChange} className="dark:bg-slate-700 dark:border-slate-600" />
                  <span>Night</span>
                </label>
              </div>
              <div>
                <label className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-1">Instructions</label>
                <textarea name="instructions" value={editForm.instructions} onChange={handleEditInputChange} className="w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-gray-200" rows={2} />
              </div>
              <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors duration-200 dark:disabled:bg-slate-600">
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}