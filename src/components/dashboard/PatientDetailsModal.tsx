import React, { useState, useEffect } from 'react';
import { apiClient, User, Medication, MoodEntry, Reminder } from '../../lib/api';
import { 
  X, 
  Heart, 
  Pill, 
  Calendar, 
  Phone, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp,
  TrendingDown,
  Minus,
  Download
} from 'lucide-react';

interface PatientDetailsModalProps {
  patient: User;
  isOpen: boolean;
  onClose: () => void;
}

export function PatientDetailsModal({ patient, isOpen, onClose }: PatientDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'medications' | 'mood' | 'reminders' | 'emergency'>('overview');
  const [medications, setMedications] = useState<Medication[]>([]);
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingPDF, setDownloadingPDF] = useState(false);

  useEffect(() => {
    if (isOpen && patient._id) {
      fetchPatientDetails();
    }
  }, [isOpen, patient._id]);

  const fetchPatientDetails = async () => {
    setLoading(true);
    try {
      // Fetch all patient data in parallel
      const [medicationsData, moodData, remindersData] = await Promise.all([
        apiClient.medications.getByPatientId(patient._id),
        apiClient.moodEntries.getByPatientId(patient._id, 30), // Last 30 entries
        apiClient.reminders.getByPatientId(patient._id)
      ]);

      setMedications(medicationsData || []);
      setMoodEntries(moodData || []);
      setReminders(remindersData || []);
    } catch (error) {
      console.error('Error fetching patient details:', error);
      // Set empty arrays on error to prevent crashes
      setMedications([]);
      setMoodEntries([]);
      setReminders([]);
    } finally {
      setLoading(false);
    }
  };

  const getMoodEmoji = (score: number) => {
    const moodMap = {
      1: '😢',
      2: '😟',
      3: '😐',
      4: '😊',
      5: '😄'
    };
    return moodMap[score as keyof typeof moodMap] || '😐';
  };

  const getMoodLabel = (score: number) => {
    const labelMap = {
      1: 'Very Sad',
      2: 'Sad',
      3: 'Okay',
      4: 'Good',
      5: 'Great'
    };
    return labelMap[score as keyof typeof labelMap] || 'Unknown';
  };

  const getMoodTrend = () => {
    if (moodEntries.length < 2) return null;
    
    const recent = moodEntries.slice(0, 7); // Last 7 entries
    const older = moodEntries.slice(7, 14); // Previous 7 entries
    
    if (recent.length === 0 || older.length === 0) return null;
    
    const recentAvg = recent.reduce((sum, entry) => sum + entry.mood_score, 0) / recent.length;
    const olderAvg = older.reduce((sum, entry) => sum + entry.mood_score, 0) / older.length;
    
    const diff = recentAvg - olderAvg;
    
    if (Math.abs(diff) < 0.3) return { type: 'stable', icon: Minus };
    return diff > 0 ? { type: 'improving', icon: TrendingUp } : { type: 'declining', icon: TrendingDown };
  };

  const getTodayReminders = () => {
    const today = new Date().toISOString().split('T')[0];
    
    const todayFiltered = reminders.filter(reminder => {
      const reminderDate = new Date(reminder.reminder_time).toISOString().split('T')[0];
      return reminderDate === today;
    });
    
    return todayFiltered;
  };

  const handleDownloadPDF = async () => {
    setDownloadingPDF(true);
    try {
      // Download report using the same approach as PatientDashboard (HTML format)
      const response = await fetch(`http://localhost:3000/pdf-reports/patient/${patient._id}`, {
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
        a.download = `patient-report-${patient.full_name.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;
        console.log('PDF downloaded successfully');
      } else if (contentType && contentType.includes('text/html')) {
        // HTML file (fallback)
        a.download = `patient-report-${patient.full_name.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.html`;
        console.log('HTML report downloaded (PDF generation failed)');
        alert('PDF generation failed, but HTML report was downloaded. You can open this in your browser and print it as PDF.');
      } else {
        // Unknown type
        a.download = `patient-report-${patient.full_name.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.file`;
        console.log('Unknown file type downloaded');
      }
      
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
    } catch (error) {
      console.error('Error downloading report:', error);
      
      // Try to get more detailed error information
      try {
        const errorResponse = await fetch(`http://localhost:3000/pdf-reports/patient/${patient._id}`);
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
    } finally {
      setDownloadingPDF(false);
    }
  };

  const getRecentReminders = () => {
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);
    
    return reminders.filter(reminder => 
      new Date(reminder.reminder_time) >= last7Days
    ).slice(0, 10);
  };

  const lowStockMedications = medications.filter(med => med.current_count <= med.low_stock_threshold);
  const todayReminders = getTodayReminders();
  const acknowledgedToday = todayReminders.filter(r => r.acknowledged).length;
  const moodTrend = getMoodTrend();
  const latestMood = moodEntries[0];

  if (!isOpen) return null;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Heart },
    { id: 'medications', label: 'Medications', icon: Pill },
    { id: 'mood', label: 'Mood History', icon: Heart },
    { id: 'reminders', label: 'Reminders', icon: Calendar },
    { id: 'emergency', label: 'Emergency Info', icon: Phone }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-4">
                <Heart className="h-8 w-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">{patient.full_name}</h2>
                <p className="text-blue-100">{patient.email}</p>
                <p className="text-blue-100 text-sm">Patient ID: {patient._id.slice(-8)}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleDownloadPDF}
                disabled={downloadingPDF}
                className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="h-5 w-5" />
                <span>{downloadingPDF ? 'Generating...' : 'Download PDF'}</span>
              </button>
              <button
                onClick={onClose}
                className="text-white hover:text-blue-200 transition-colors"
              >
                <X className="h-8 w-8" />
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 dark:border-slate-700">
          <nav className="flex overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors duration-200 ${
                    activeTab === tab.id
                      ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-900/50 dark:text-blue-300'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Quick Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-green-50 dark:bg-green-900/50 rounded-lg p-4">
                      <div className="flex items-center">
                        <Pill className="h-8 w-8 text-green-600 dark:text-green-400 mr-3" />
                        <div>
                          <p className="text-sm text-green-600 dark:text-green-300 font-medium">Active Medications</p>
                          <p className="text-xl font-bold text-green-700 dark:text-green-200">{medications.length}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-blue-50 dark:bg-blue-900/50 rounded-lg p-4">
                      <div className="flex items-center">
                        <CheckCircle className="h-8 w-8 text-blue-600 dark:text-blue-400 mr-3" />
                        <div>
                          <p className="text-sm text-blue-600 dark:text-blue-300 font-medium">Today's Progress</p>
                          <p className="text-xl font-bold text-blue-700 dark:text-blue-200">
                            {acknowledgedToday}/{todayReminders.length}
                          </p>
                          {todayReminders.length === 0 && (
                            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                              No reminders scheduled for today
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-red-50 dark:bg-red-900/50 rounded-lg p-4">
                      <div className="flex items-center">
                        <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400 mr-3" />
                        <div>
                          <p className="text-sm text-red-600 dark:text-red-300 font-medium">Low Stock Items</p>
                          <p className="text-xl font-bold text-red-700 dark:text-red-200">{lowStockMedications.length}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-purple-50 dark:bg-purple-900/50 rounded-lg p-4">
                      <div className="flex items-center">
                        <Heart className="h-8 w-8 text-purple-600 dark:text-purple-400 mr-3" />
                        <div>
                          <p className="text-sm text-purple-600 dark:text-purple-300 font-medium">Latest Mood</p>
                          <p className="text-xl font-bold text-purple-700 dark:text-purple-200">
                            {latestMood ? `${getMoodEmoji(latestMood.mood_score)} ${latestMood.mood_score}/5` : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Mood Trend */}
                  {moodTrend && (
                    <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4">
                      <div className="flex items-center">
                        <moodTrend.icon className={`h-6 w-6 mr-2 ${
                          moodTrend.type === 'improving' ? 'text-green-600' :
                          moodTrend.type === 'declining' ? 'text-red-600' : 'text-gray-600'
                        }`} />
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">Mood Trend (Last 7 days)</p>
                          <p className={`text-sm ${
                            moodTrend.type === 'improving' ? 'text-green-600' :
                            moodTrend.type === 'declining' ? 'text-red-600' : 'text-gray-600'
                          }`}>
                            {moodTrend.type === 'improving' ? 'Mood is improving' :
                             moodTrend.type === 'declining' ? 'Mood needs attention' : 'Mood is stable'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Recent Activities */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Recent Activities</h3>
                    <div className="space-y-2">
                      {moodEntries.slice(0, 3).map((entry) => (
                        <div key={entry._id} className="flex items-center justify-between bg-gray-50 dark:bg-slate-700/50 rounded-lg p-3">
                          <div className="flex items-center">
                            <div className="text-2xl mr-3">{getMoodEmoji(entry.mood_score)}</div>
                            <div>
                              <p className="font-medium dark:text-gray-200">Mood Check-in</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {getMoodLabel(entry.mood_score)} ({entry.mood_score}/5)
                              </p>
                            </div>
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {new Date(entry.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Medications Tab */}
              {activeTab === 'medications' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Active Medications ({medications.length})</h3>
                  {medications.length === 0 ? (
                    <div className="text-center py-8">
                      <Pill className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                      <p className="text-gray-600 dark:text-gray-400">No medications found</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {medications.map((medication) => (
                        <div key={medication._id} className="border border-gray-200 dark:border-slate-700 rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold text-gray-900 dark:text-gray-100">{medication.name}</h4>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              medication.current_count <= medication.low_stock_threshold
                                ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200'
                                : 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200'
                            }`}>
                              {medication.current_count <= medication.low_stock_threshold ? 'Low Stock' : 'In Stock'}
                            </span>
                          </div>
                          <p className="text-gray-600 dark:text-gray-400 mb-2">{medication.dosage}</p>
                          <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                            <p>Stock: {medication.current_count}/{medication.total_count} pills</p>
                            <div className="flex space-x-2">
                              {medication.morning_dose && <span className="px-2 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200 rounded-full text-xs">Morning</span>}
                              {medication.afternoon_dose && <span className="px-2 py-1 bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200 rounded-full text-xs">Afternoon</span>}
                              {medication.night_dose && <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200 rounded-full text-xs">Night</span>}
                            </div>
                          </div>
                          {medication.instructions && (
                            <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                              <span className="font-medium">Instructions:</span> {medication.instructions}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Mood History Tab */}
              {activeTab === 'mood' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Mood History (Last 30 entries)</h3>
                  {moodEntries.length === 0 ? (
                    <div className="text-center py-8">
                      <Heart className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                      <p className="text-gray-600 dark:text-gray-400">No mood entries found</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {moodEntries.map((entry) => (
                        <div key={entry._id} className="border border-gray-200 dark:border-slate-700 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center">
                              <div className="text-2xl mr-3">{getMoodEmoji(entry.mood_score)}</div>
                              <div>
                                <p className="font-medium dark:text-gray-100">{getMoodLabel(entry.mood_score)} ({entry.mood_score}/5)</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {new Date(entry.created_at).toLocaleDateString()} at {new Date(entry.created_at).toLocaleTimeString()}
                                </p>
                              </div>
                            </div>
                          </div>
                          {entry.notes && (
                            <div className="mt-2 p-2 bg-gray-50 dark:bg-slate-700/50 rounded">
                              <p className="text-sm text-gray-700 dark:text-gray-300">
                                <span className="font-medium">Notes:</span> {entry.notes}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Reminders Tab */}
              {activeTab === 'reminders' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Recent Reminders</h3>
                  {getRecentReminders().length === 0 ? (
                    <div className="text-center py-8">
                      <Clock className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                      <p className="text-gray-600 dark:text-gray-400">No recent reminders found</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {getRecentReminders().map((reminder) => (
                        <div key={reminder._id} className="border border-gray-200 dark:border-slate-700 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium dark:text-gray-100">
                                {new Date(reminder.reminder_time).toLocaleDateString()} at {new Date(reminder.reminder_time).toLocaleTimeString()}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">Medication ID: {reminder.medication_id}</p>
                            </div>
                            <div className="flex space-x-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                reminder.acknowledged
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200'
                                  : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200'
                              }`}>
                                {reminder.acknowledged ? 'Acknowledged' : 'Pending'}
                              </span>
                              {reminder.escalated && (
                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200">
                                  Escalated
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Emergency Tab */}
              {activeTab === 'emergency' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Emergency Information</h3>
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 rounded-lg p-6">
                    <div className="flex items-center mb-4">
                      <Phone className="h-6 w-6 text-red-600 dark:text-red-400 mr-2" />
                      <h4 className="font-semibold text-red-900 dark:text-red-200">Emergency Contact</h4>
                    </div>
                    <div className="space-y-2">
                      {patient.emergency_contact ? (
                        <div>
                          <p className="text-sm text-red-700 dark:text-red-300 font-medium">Contact Name:</p>
                          <p className="text-red-900 dark:text-red-200">{patient.emergency_contact}</p>
                        </div>
                      ) : (
                        <p className="text-red-700 dark:text-red-300">No emergency contact name provided</p>
                      )}
                      
                      {patient.emergency_phone ? (
                        <div>
                          <p className="text-sm text-red-700 dark:text-red-300 font-medium">Phone Number:</p>
                          <p className="text-red-900 dark:text-red-200 font-mono">{patient.emergency_phone}</p>
                        </div>
                      ) : (
                        <p className="text-red-700 dark:text-red-300">No emergency phone number provided</p>
                      )}
                    </div>
                    
                    {(!patient.emergency_contact || !patient.emergency_phone) && (
                      <div className="mt-4 p-3 bg-yellow-100 dark:bg-yellow-900/50 rounded-lg">
                        <p className="text-sm text-yellow-800 dark:text-yellow-200">
                          <AlertTriangle className="h-4 w-4 inline mr-1" />
                          Encourage the patient to update their emergency contact information.
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="bg-blue-50 dark:bg-blue-900/50 border border-blue-200 dark:border-blue-500/30 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">Patient Contact Information</h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300">Email: {patient.email}</p>
                    <p className="text-sm text-blue-700 dark:text-blue-300">Registered: {new Date(patient.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
