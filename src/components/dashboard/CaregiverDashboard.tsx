import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient, User, Reminder, MoodNotification } from '../../lib/api';
import { PatientCard } from './PatientCard';
import { AIChatPanel } from '../ai/AIChatPanel';
import { Users, AlertTriangle, CheckCircle, Clock, Heart, Bell } from 'lucide-react';

export function CaregiverDashboard() {
  const { userProfile } = useAuth();
  const [patients, setPatients] = useState<User[]>([]);
  const [alerts, setAlerts] = useState<Reminder[]>([]);
  const [moodNotifications, setMoodNotifications] = useState<MoodNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState<User | null>(null);

  useEffect(() => {
    if (userProfile) {
      fetchPatients();
      fetchAlerts();
      fetchMoodNotifications();
    }
    // Set up automatic refresh every 5 minutes
    const intervalId = setInterval(() => {
      if (userProfile) {
        fetchPatients();
        fetchAlerts();
        fetchMoodNotifications();
      }
    }, 300000); // Fetch every 5 minutes
    return () => clearInterval(intervalId); // Cleanup on unmount
  }, [userProfile]);

  const fetchPatients = async () => {
    try {
      if (!userProfile?._id) return;
      
      console.log('Fetching patients for caregiver:', userProfile._id);
      const patients = await apiClient.users.getPatientsByCaregiver(userProfile._id);
      console.log('Fetched patients:', patients);
      setPatients(patients);
    } catch (error) {
      console.error('Error fetching patients:', error);
      setPatients([]); // Set to empty array on error
    }
  };

  const fetchAlerts = async () => {
    try {
      // Placeholder for alerts - will be implemented when backend API supports this
      console.log('Fetching alerts for caregiver:', userProfile?._id);
      setAlerts([]); // Placeholder - will be implemented when backend API is ready
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMoodNotifications = async () => {
    try {
      if (!userProfile?._id) return;
      
      console.log('Fetching mood notifications for caregiver:', userProfile._id);
      const notifications = await apiClient.moodNotifications.getByCaregiverId(userProfile._id);
      console.log('Fetched mood notifications:', notifications);
      setMoodNotifications(notifications);
    } catch (error) {
      console.error('Error fetching mood notifications:', error);
      setMoodNotifications([]);
    }
  };

  const handleMarkNotificationAsRead = async (id: string) => {
    try {
      await apiClient.moodNotifications.markAsRead(id);
      // Update local state
      setMoodNotifications(prev => 
        prev.map(notification => 
          notification._id === id 
            ? { ...notification, read: true, read_at: new Date().toISOString() }
            : notification
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Caregiver Dashboard
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 mt-1">
              Managing care for {patients.length} patient{patients.length !== 1 ? 's' : ''}
            </p>
          </div>

          {userProfile?.caregiver_code && (
            <div className="bg-blue-50 dark:bg-blue-900/50 rounded-xl p-4 text-center">
              <p className="text-sm text-blue-600 dark:text-blue-300 font-medium">Your Caregiver Code</p>
              <p className="text-2xl font-mono font-bold text-blue-700 dark:text-blue-400">
                {userProfile.caregiver_code}
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">Share with patients</p>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/50 rounded-xl p-4">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600 dark:text-blue-400 mr-3" />
              <div>
                <p className="text-sm text-blue-600 dark:text-blue-300 font-medium">Active Patients</p>
                <p className="text-xl font-bold text-blue-700 dark:text-blue-200">{patients.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-red-50 dark:bg-red-900/50 rounded-xl p-4">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400 mr-3" />
              <div>
                <p className="text-sm text-red-600 dark:text-red-300 font-medium">Active Alerts</p>
                <p className="text-xl font-bold text-red-700 dark:text-red-200">{alerts.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 dark:bg-green-900/50 rounded-xl p-4">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400 mr-3" />
              <div>
                <p className="text-sm text-green-600 dark:text-green-300 font-medium">On Track Today</p>
                <p className="text-xl font-bold text-green-700 dark:text-green-200">{patients.length - alerts.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/50 rounded-xl p-4">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600 dark:text-yellow-400 mr-3" />
              <div>
                <p className="text-sm text-yellow-600 dark:text-yellow-300 font-medium">Pending Actions</p>
                <p className="text-xl font-bold text-yellow-700 dark:text-yellow-200">{alerts.filter(a => !a.escalated).length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Active Alerts */}
      {alerts.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
            <AlertTriangle className="h-6 w-6 text-red-500 mr-2" />
            Active Alerts
          </h2>
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div key={alert._id} className="bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-500/30 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-red-800 dark:text-red-200">
                      {alert.users?.full_name} - Missed Medication
                    </p>
                    <p className="text-red-700 dark:text-red-300">
                      {alert.medications?.name} ({alert.medications?.dosage})
                    </p>
                    <p className="text-sm text-red-600 dark:text-red-400">
                      Scheduled: {new Date(alert.reminder_time).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      alert.escalated ? 'bg-red-100 text-red-800 dark:bg-red-500/30 dark:text-red-200' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/30 dark:text-yellow-200'
                    }`}>
                      {alert.escalated ? 'Escalated' : 'Pending'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mood Notifications */}
      {moodNotifications.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
            <Heart className="h-6 w-6 text-purple-500 mr-2" />
            Recent Mood Updates
            {moodNotifications.filter(n => !n.read).length > 0 && (
              <span className="ml-2 bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300 text-sm font-medium px-2 py-1 rounded-full">
                {moodNotifications.filter(n => !n.read).length} new
              </span>
            )}
          </h2>
          <div className="space-y-3">
            {moodNotifications.slice(0, 10).map((notification) => (
              <div
                key={notification._id}
                className={`border rounded-lg p-4 transition-all duration-200 ${
                  notification.read
                    ? 'bg-gray-50 border-gray-200 dark:bg-slate-800/50 dark:border-slate-700'
                    : 'bg-purple-50 border-purple-200 shadow-sm dark:bg-purple-900/50 dark:border-purple-500/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="text-3xl">{getMoodEmoji(notification.mood_score)}</div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">
                        {notification.patient_name}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Mood: {getMoodLabel(notification.mood_score)} ({notification.mood_score}/5)
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        {new Date(notification.created_at).toLocaleDateString()} at {new Date(notification.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {!notification.read && (
                      <button
                        onClick={() => handleMarkNotificationAsRead(notification._id)}
                        className="px-3 py-1 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition-colors dark:bg-purple-500 dark:hover:bg-purple-400"
                      >
                        Mark Read
                      </button>
                    )}
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        notification.read
                          ? 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-gray-300'
                          : 'bg-purple-100 text-purple-800 dark:bg-purple-500/30 dark:text-purple-200'
                      }`}>
                        {notification.read ? 'Read' : 'New'}
                      </span>
                    </div>
                  </div>
                </div>
                {notification.notes && (
                  <div className="mt-3 p-3 bg-white dark:bg-slate-700 rounded-lg">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      <span className="font-medium">Notes:</span> {notification.notes}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
          {moodNotifications.length > 10 && (
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Showing 10 of {moodNotifications.length} notifications
              </p>
            </div>
          )}
        </div>
      )}

      {/* Patients List */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Your Patients</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">Click on a patient to interact with the AI assistant below.</p>

        {patients.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">No Patients Yet</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Share your caregiver code with patients to get started
            </p>
            {userProfile?.caregiver_code && (
              <div className="bg-blue-50 dark:bg-blue-900/50 rounded-lg p-4 inline-block">
                <p className="text-sm text-blue-600 dark:text-blue-300 font-medium mb-1">Your Code:</p>
                <p className="text-2xl font-mono font-bold text-blue-700 dark:text-blue-400">
                  {userProfile.caregiver_code}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {patients.map((patient) => (
              <PatientCard
                key={patient._id}
                patient={patient}
                onClick={() => setSelectedPatient(patient)}
                isSelected={selectedPatient?._id === patient._id}
              />
            ))}
          </div>
        )}
      </div>

      {/* AI Chat Panel */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 mt-8">
        <AIChatPanel
          patientId={selectedPatient?._id || null}
          patientName={selectedPatient?.full_name || null}
        />
      </div>
    </div>
  );
}