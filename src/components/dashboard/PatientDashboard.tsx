import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { MedicationList } from '../medications/MedicationList';
import { AddMedicationForm } from '../medications/AddMedicationForm';
import SpeechToTextMedication from '../medications/SpeechToTextMedication';
import { MoodTracker } from '../health/MoodTracker';
import { PillGame } from '../game/PillGame';
import { EmergencyInfo } from '../emergency/EmergencyInfo';
import { Messages } from '../messaging/Messages';
import { MessageSidebar } from '../messaging/MessageSidebar';
import { Pill as Pills, Plus, Heart, Gamepad2, Phone, Calendar, Mail } from 'lucide-react';
import { createReminder, updateReminder, deleteReminder } from '../../utils/remindersApi';
import { notificationManager } from '../../utils/notifications';
import { apiClient } from '../../lib/api';

const API_BASE = 'http://localhost:3000';

export function PatientDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('medications');
  const [medications, setMedications] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [editingReminder, setEditingReminder] = useState<any>(null);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [reminderForm, setReminderForm] = useState({
    medication_id: '',
    patient_id: user?._id || '',
    reminder_time: '',
    acknowledged: false,
    escalated: false,
  });
  
  // Request deduplication flags
  const [isFetchingMedications, setIsFetchingMedications] = useState(false);
  const [isFetchingReminders, setIsFetchingReminders] = useState(false);
  const [isFetchingMessages, setIsFetchingMessages] = useState(false);
  
  // Cache timestamps to prevent unnecessary API calls
  const [lastFetchTime, setLastFetchTime] = useState({
    medications: 0,
    reminders: 0,
    messages: 0
  });
  
  const CACHE_DURATION = 30000; // 30 seconds cache duration

  useEffect(() => {
    if (user) {
      fetchMedications();
      fetchTodayReminders(); // Enable fetching today's reminders
      fetchUnreadMessageCount(); // Fetch unread message count
      
      // Request notification permissions
      requestNotificationPermissions();
      
      // Set up periodic refresh for unread message count (every 2 minutes instead of 30 seconds)
      const messageCountInterval = setInterval(() => {
        fetchUnreadMessageCount();
      }, 120000); // 2 minutes
      
      return () => clearInterval(messageCountInterval);
    }
  }, [user]);
  
  // Schedule reminders when medications are updated
  useEffect(() => {
    if (medications.length > 0) {
      notificationManager.scheduleReminders(medications);
    }
  }, [medications]);
  
  const requestNotificationPermissions = async () => {
    try {
      const granted = await notificationManager.requestPermission();
      if (granted) {
        console.log('Notification permissions granted');
      } else {
        console.warn('Notification permissions denied');
      }
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
    }
  };

  const fetchUnreadMessageCount = async () => {
    if (isFetchingMessages) return; // Prevent duplicate requests
    
    const now = Date.now();
    if (now - lastFetchTime.messages < CACHE_DURATION) {
      return; // Use cached data
    }
    
    try {
      if (!user) return;
      setIsFetchingMessages(true);
      const messages = await apiClient.messages.getByUserId(user._id, true); // Get only unread messages
      setUnreadMessageCount(messages.length);
      setLastFetchTime(prev => ({ ...prev, messages: now }));
    } catch (error) {
      console.error('Error fetching unread message count:', error);
    } finally {
      setIsFetchingMessages(false);
    }
  };

  const fetchMedications = async () => {
    if (isFetchingMedications) return; // Prevent duplicate requests
    
    const now = Date.now();
    if (now - lastFetchTime.medications < CACHE_DURATION) {
      return; // Use cached data
    }
    
    try {
      setIsFetchingMedications(true);
      const res = await fetch(`${API_BASE}/medications?patient_id=${user._id}`);
      const data = await res.json();
      setMedications(data || []);
      setLastFetchTime(prev => ({ ...prev, medications: now }));
    } catch (error) {
      console.error('Error fetching medications:', error);
    } finally {
      setLoading(false);
      setIsFetchingMedications(false);
    }
  };

  const fetchTodayReminders = async () => {
    if (isFetchingReminders) return; // Prevent duplicate requests
    
    const now = Date.now();
    if (now - lastFetchTime.reminders < CACHE_DURATION) {
      return; // Use cached data
    }
    
    try {
      setIsFetchingReminders(true);
      const today = new Date().toISOString().split('T')[0];
      const res = await fetch(`${API_BASE}/reminders?patient_id=${user._id}&date=${today}`);
      const data = await res.json();
      setReminders(data || []);
      setLastFetchTime(prev => ({ ...prev, reminders: now }));
    } catch (error) {
      console.error('Error fetching reminders:', error);
    } finally {
      setLoading(false);
      setIsFetchingReminders(false);
    }
  };

  const openAddReminder = () => {
    setEditingReminder(null);
    setReminderForm({ medication_id: '', patient_id: user._id, reminder_time: '', acknowledged: false, escalated: false });
    setShowReminderModal(true);
  };
  const openEditReminder = (reminder: any) => {
    setEditingReminder(reminder);
    setReminderForm({ ...reminder });
    setShowReminderModal(true);
  };
  const handleReminderFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setReminderForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };
  const handleReminderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingReminder) {
        await updateReminder(editingReminder._id, reminderForm);
      } else {
        await createReminder(reminderForm);
      }
      setShowReminderModal(false);
      fetchTodayReminders();
    } catch (err) {
      alert('Failed to save reminder');
    }
  };
  const handleDeleteReminder = async (id: string) => {
    if (!window.confirm('Delete this reminder?')) return;
    try {
      await deleteReminder(id);
      fetchTodayReminders();
    } catch (err) {
      alert('Failed to delete reminder');
    }
  };

  const handleMedicationTaken = async (timeOfDay: "morning" | "afternoon" | "night") => {
    try {
      if (!user) return;
      
      console.log(`📱 Voice logging: Attempting to mark ${timeOfDay} medication as taken`);
      console.log(`👤 User ID: ${user._id}`);
      
      const response = await fetch(`${API_BASE}/medications/mark-taken`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patient_id: user._id,
          timeOfDay
        }),
      });
      
      const data = await response.json();
      
      console.log(`🔥 API Response Status: ${response.status}`);
      console.log(`🔥 API Response Data:`, data);
      
      if (response.ok) {
        // Show success message with details
        const medicationNames = data.medications_marked?.join(', ') || 'medication(s)';
        console.log(`✅ SUCCESS: Marked ${medicationNames} as taken for ${timeOfDay}`);
        alert(`✅ Successfully marked ${medicationNames} as taken for ${timeOfDay}!`);
        
        // Refresh medications and reminders to reflect updated counts
        fetchMedications();
        fetchTodayReminders();
      } else {
        console.log(`❌ API ERROR: ${data.error}`);
        throw new Error(data.error || 'Failed to mark medication as taken');
      }
    } catch (error) {
      console.error('Error marking medication as taken:', error);
      alert(`❌ Failed to mark medication as taken: ${error.message}`);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      if (!user) return;
      
      // Show loading state
      const button = document.querySelector('button[onclick="handleDownloadPDF"]');
      if (button) {
        button.disabled = true;
        button.innerHTML = '<div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white mx-auto"></div><span class="ml-2">Generating...</span>';
      }
      
      // Download PDF using the API client
      const response = await fetch(`${API_BASE}/pdf-reports/patient/${user._id}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/pdf, text/html',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const contentType = response.headers.get('content-type');
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      if (contentType && contentType.includes('application/pdf')) {
        // PDF file
        a.download = `health-report-${user.full_name.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;
        console.log('PDF downloaded successfully');
      } else if (contentType && contentType.includes('text/html')) {
        // HTML file (fallback)
        a.download = `health-report-${user.full_name.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.html`;
        console.log('HTML report downloaded (PDF generation failed)');
        alert('PDF generation failed, but HTML report was downloaded. You can open this in your browser and print it as PDF.');
      } else {
        // Unknown type
        a.download = `health-report-${user.full_name.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.file`;
        console.log('Unknown file type downloaded');
      }
      
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      // Reset button state
      if (button) {
        button.disabled = false;
        button.innerHTML = '<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg><span class="ml-2">Download Report</span>';
      }
      
    } catch (error) {
      console.error('Error downloading report:', error);
      
      // Try to get more detailed error information
      try {
        const errorResponse = await fetch(`${API_BASE}/pdf-reports/patient/${user._id}`);
        if (errorResponse.status === 500) {
          const errorData = await errorResponse.json();
          console.error('Server error details:', errorData);
          alert(`Failed to generate report: ${errorData.error || 'Unknown error'}. Please try again later.`);
        } else {
          alert(`Failed to download report: ${error.message}. Please try again.`);
        }
      } catch (fetchError) {
        alert(`Failed to download report: ${error.message}. Please try again.`);
      }
      
      // Reset button state on error
      const button = document.querySelector('button[onclick="handleDownloadPDF"]');
      if (button) {
        button.disabled = false;
        button.innerHTML = '<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg><span class="ml-2">Download Report</span>';
      }
    }
  };

  const tabs = [
    { id: 'medications', label: 'My Medications', icon: Pills },
    { id: 'add-medication', label: 'Add Medication', icon: Plus },
    { id: 'mood', label: 'Daily Check-in', icon: Heart },
    { id: 'game', label: 'Pill Game', icon: Gamepad2 },
    { id: 'emergency', label: 'Emergency', icon: Phone },
    { id: 'reminders', label: 'Reminders', icon: Calendar },
    { id: 'messages', label: 'Messages', icon: Mail },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 bg-gray-50 dark:bg-slate-900 min-h-screen space-y-6 lg:space-y-8">
      {/* Notification Banner */}
      <div className="bg-blue-50 dark:bg-blue-900/50 border border-blue-200 dark:border-blue-500/30 rounded-2xl p-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400 dark:text-blue-300" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
              Audio Medication Reminders Active
            </h3>
            <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
              <p>
                You'll receive audio notifications at your scheduled medication times. 
                Make sure your browser notifications are enabled for the best experience.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Welcome Section with Message Sidebar */}
      <div className="flex space-x-6">
        {/* Welcome Box */}
        <div className="flex-1 bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                Welcome back, {user?.full_name}!
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400 mt-1">
                Today is {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {/* PDF Download Button */}
              <button
                onClick={handleDownloadPDF}
                className="bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-400 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors duration-200"
                title="Download your health report as PDF"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Download Report</span>
              </button>
              
              <div className="text-right">
                <div className="bg-blue-50 dark:bg-blue-900/50 rounded-xl p-4">
                  <p className="text-sm text-blue-600 dark:text-blue-300 font-medium">Today's Reminders</p>
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-200">{reminders.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-green-50 dark:bg-green-900/50 rounded-xl p-4">
              <div className="flex items-center">
                <Pills className="h-8 w-8 text-green-600 dark:text-green-400 mr-3" />
                <div>
                  <p className="text-sm text-green-600 dark:text-green-300 font-medium">Active Medications</p>
                  <p className="text-xl font-bold text-green-700 dark:text-green-200">{medications.length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-yellow-50 dark:bg-yellow-900/50 rounded-xl p-4">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-yellow-600 dark:text-yellow-400 mr-3" />
                <div>
                  <p className="text-sm text-yellow-600 dark:text-yellow-300 font-medium">Low Stock Items</p>
                  <p className="text-xl font-bold text-yellow-700 dark:text-yellow-200">
                    {medications.filter(med => med.current_count <= med.low_stock_threshold).length}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-purple-50 dark:bg-purple-900/50 rounded-xl p-4">
              <div className="flex items-center">
                <Heart className="h-8 w-8 text-purple-600 dark:text-purple-400 mr-3" />
                <div>
                  <p className="text-sm text-purple-600 dark:text-purple-300 font-medium">Mood Today</p>
                  <p className="text-xl font-bold text-purple-700 dark:text-purple-200">Track Now</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Message Sidebar - Same height as welcome box */}
        <div className="hidden lg:block w-80 xl:w-80 flex-shrink-0">
          <MessageSidebar onUnreadCountChange={fetchUnreadMessageCount} />
        </div>
      </div>

      {/* Navigation Tabs - Full width */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg overflow-hidden">
        <div className="border-b border-gray-200 dark:border-slate-700">
          <nav className="flex overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    // Refresh unread count when switching to messages tab
                    if (tab.id === 'messages') {
                      fetchUnreadMessageCount();
                    }
                  }}
                  className={`flex items-center space-x-3 px-6 py-4 text-lg font-medium whitespace-nowrap transition-colors duration-200 relative ${
                    activeTab === tab.id
                      ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-900/50 dark:text-blue-400'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <Icon className="h-6 w-6" />
                  <span>{tab.label}</span>
                  {tab.id === 'messages' && unreadMessageCount > 0 && (
                    <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center min-w-[20px]">
                      {unreadMessageCount > 99 ? '99+' : unreadMessageCount}
                    </div>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'medications' && (
            <div className="space-y-6">
              {/* Voice Medication Logging */}
              <SpeechToTextMedication onMedicationTaken={handleMedicationTaken} />
              
              {/* Regular Medication List */}
              <MedicationList 
                medications={medications} 
                onMedicationUpdate={fetchMedications}
              />
            </div>
          )}
          {activeTab === 'add-medication' && (
            <AddMedicationForm onMedicationAdded={fetchMedications} />
          )}
          {activeTab === 'mood' && <MoodTracker />}
          {activeTab === 'game' && <PillGame medications={medications} />}
          {activeTab === 'emergency' && <EmergencyInfo />}
          {activeTab === 'messages' && <Messages onUnreadCountChange={fetchUnreadMessageCount} />}
          {activeTab === 'reminders' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold dark:text-gray-100">Reminders</h2>
                <button onClick={openAddReminder} className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400 text-white px-4 py-2 rounded-lg">Add Reminder</button>
              </div>
              <ul className="space-y-2">
                {reminders.map((reminder: any) => (
                  <li key={reminder._id} className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4 flex justify-between items-center">
                    <div className="dark:text-gray-300">
                      <div><span className="font-semibold dark:text-gray-200">Time:</span> {reminder.reminder_time}</div>
                      <div><span className="font-semibold dark:text-gray-200">Acknowledged:</span> {reminder.acknowledged ? 'Yes' : 'No'}</div>
                      <div><span className="font-semibold dark:text-gray-200">Escalated:</span> {reminder.escalated ? 'Yes' : 'No'}</div>
                    </div>
                    <div className="flex space-x-2">
                      <button onClick={() => openEditReminder(reminder)} className="px-3 py-1 bg-gray-200 dark:bg-slate-600 dark:text-gray-200 dark:hover:bg-slate-500 rounded">Edit</button>
                      <button onClick={() => handleDeleteReminder(reminder._id)} className="px-3 py-1 bg-red-200 text-red-700 dark:bg-red-500/30 dark:text-red-200 dark:hover:bg-red-500/50 rounded">Delete</button>
                    </div>
                  </li>
                ))}
              </ul>
              {showReminderModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                  <div className="bg-white dark:bg-slate-800 rounded-xl p-8 w-full max-w-md shadow-xl relative">
                    <button className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" onClick={() => setShowReminderModal(false)}>&times;</button>
                    <h2 className="text-xl font-bold mb-4 dark:text-gray-100">{editingReminder ? 'Edit' : 'Add'} Reminder</h2>
                    <form onSubmit={handleReminderSubmit} className="space-y-4">
                      <div>
                        <label className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-1">Reminder Time</label>
                        <input type="datetime-local" name="reminder_time" value={reminderForm.reminder_time} onChange={handleReminderFormChange} className="w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-gray-200" required />
                      </div>
                      <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400 text-white font-semibold py-3 rounded-lg transition-colors duration-200">
                        Save
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}