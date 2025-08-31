import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient, User, Reminder, MoodNotification } from '../../lib/api';
import { PatientCard } from './PatientCard';
import { AIChatPanel } from '../ai/AIChatPanel';
import { Users, AlertTriangle, CheckCircle, Clock, Heart, Bell } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function CaregiverDashboard() {
  const { t } = useTranslation();
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
    const intervalId = setInterval(() => {
      if (userProfile) {
        fetchPatients();
        fetchAlerts();
        fetchMoodNotifications();
      }
    }, 300000);
    return () => clearInterval(intervalId);
  }, [userProfile]);

  const fetchPatients = async () => {
    try {
      if (!userProfile?._id) return;
      const patientsData = await apiClient.users.getPatientsByCaregiver(userProfile._id);
      setPatients(patientsData);
    } catch (error) {
      console.error('Error fetching patients:', error);
      setPatients([]);
    }
  };

  const fetchAlerts = async () => {
    try {
      console.log('Fetching alerts for caregiver:', userProfile?._id);
      setAlerts([]);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMoodNotifications = async () => {
    try {
      if (!userProfile?._id) return;
      const notifications = await apiClient.moodNotifications.getByCaregiverId(userProfile._id);
      setMoodNotifications(notifications);
    } catch (error) {
      console.error('Error fetching mood notifications:', error);
      setMoodNotifications([]);
    }
  };

  const handleMarkNotificationAsRead = async (id: string) => {
    try {
      await apiClient.moodNotifications.markAsRead(id);
      setMoodNotifications(prev => 
        prev.map(n => n._id === id ? { ...n, read: true, read_at: new Date().toISOString() } : n)
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const getMoodEmoji = (score: number) => {
    const moodMap: { [key: number]: string } = { 1: '😢', 2: '😟', 3: '😐', 4: '😊', 5: '😄' };
    return moodMap[score] || '😐';
  };

  const getMoodLabel = (score: number) => {
    const labelMap: { [key: number]: string } = {
      1: t('moods.verySad'), 2: t('moods.sad'), 3: t('moods.okay'), 4: t('moods.good'), 5: t('moods.great')
    };
    return labelMap[score] || t('moods.unknown');
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
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('caregiverDashboard.title')}</h1>
            <p className="text-lg text-gray-600 mt-1">
              {t('caregiverDashboard.managingCare', { count: patients.length })}
            </p>
          </div>

          {userProfile?.caregiver_code && (
            <div className="bg-blue-50 rounded-xl p-4 text-center">
              <p className="text-sm text-blue-600 font-medium">{t('caregiverDashboard.yourCode')}</p>
              <p className="text-2xl font-mono font-bold text-blue-700">{userProfile.caregiver_code}</p>
              <p className="text-xs text-blue-600 mt-1">{t('caregiverDashboard.shareWithPatients')}</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-xl p-4">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm text-blue-600 font-medium">{t('caregiverDashboard.stats.activePatients')}</p>
                <p className="text-xl font-bold text-blue-700">{patients.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-red-50 rounded-xl p-4">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-600 mr-3" />
              <div>
                <p className="text-sm text-red-600 font-medium">{t('caregiverDashboard.stats.activeAlerts')}</p>
                <p className="text-xl font-bold text-red-700">{alerts.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-green-50 rounded-xl p-4">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm text-green-600 font-medium">{t('caregiverDashboard.stats.onTrackToday')}</p>
                <p className="text-xl font-bold text-green-700">{patients.length - alerts.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-yellow-50 rounded-xl p-4">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600 mr-3" />
              <div>
                <p className="text-sm text-yellow-600 font-medium">{t('caregiverDashboard.stats.pendingActions')}</p>
                <p className="text-xl font-bold text-yellow-700">{alerts.filter(a => !a.escalated).length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {alerts.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
            <AlertTriangle className="h-6 w-6 text-red-500 mr-2" />
            {t('caregiverDashboard.alerts.title')}
          </h2>
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div key={alert._id} className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-red-800">
                      {t('caregiverDashboard.alerts.missedMedication', { name: alert.users?.full_name })}
                    </p>
                    <p className="text-red-700">{alert.medications?.name} ({alert.medications?.dosage})</p>
                    <p className="text-sm text-red-600">
                      {t('caregiverDashboard.alerts.scheduled', { date: new Date(alert.reminder_time).toLocaleString() })}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      alert.escalated ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {alert.escalated ? t('caregiverDashboard.alerts.escalated') : t('caregiverDashboard.alerts.pending')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {moodNotifications.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
            <Heart className="h-6 w-6 text-purple-500 mr-2" />
            {t('caregiverDashboard.mood.title')}
            {moodNotifications.filter(n => !n.read).length > 0 && (
              <span className="ml-2 bg-purple-100 text-purple-800 text-sm font-medium px-2 py-1 rounded-full">
                {t('caregiverDashboard.mood.new', { count: moodNotifications.filter(n => !n.read).length })}
              </span>
            )}
          </h2>
          <div className="space-y-3">
            {moodNotifications.slice(0, 10).map((notification) => (
              <div key={notification._id} className={`border rounded-lg p-4 transition-all duration-200 ${notification.read ? 'bg-gray-50 border-gray-200' : 'bg-purple-50 border-purple-200 shadow-sm'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="text-3xl">{getMoodEmoji(notification.mood_score)}</div>
                    <div>
                      <p className="font-semibold text-gray-900">{notification.patient_name}</p>
                      <p className="text-sm text-gray-600">
                        {t('caregiverDashboard.mood.moodLabel', { mood: getMoodLabel(notification.mood_score), score: notification.mood_score })}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(notification.created_at).toLocaleDateString()} at {new Date(notification.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {!notification.read && (
                      <button onClick={() => handleMarkNotificationAsRead(notification._id)} className="px-3 py-1 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition-colors">
                        {t('caregiverDashboard.mood.markRead')}
                      </button>
                    )}
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${notification.read ? 'bg-gray-100 text-gray-600' : 'bg-purple-100 text-purple-800'}`}>
                        {notification.read ? t('caregiverDashboard.mood.read') : t('caregiverDashboard.mood.newStatus')}
                      </span>
                    </div>
                  </div>
                </div>
                {notification.notes && (
                  <div className="mt-3 p-3 bg-white rounded-lg">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">{t('caregiverDashboard.mood.notes')}:</span> {notification.notes}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
          {moodNotifications.length > 10 && (
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-500">
                {t('caregiverDashboard.mood.showing', { count: 10, total: moodNotifications.length })}
              </p>
            </div>
          )}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('caregiverDashboard.patients.title')}</h2>
        <p className="text-gray-600 mb-4">{t('caregiverDashboard.patients.description')}</p>

        {patients.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('caregiverDashboard.patients.noPatientsTitle')}</h3>
            <p className="text-gray-600 mb-4">{t('caregiverDashboard.patients.noPatientsDescription')}</p>
            {userProfile?.caregiver_code && (
              <div className="bg-blue-50 rounded-lg p-4 inline-block">
                <p className="text-sm text-blue-600 font-medium mb-1">{t('caregiverDashboard.patients.yourCode')}:</p>
                <p className="text-2xl font-mono font-bold text-blue-700">{userProfile.caregiver_code}</p>
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
                isSelected={selectedPatient?._id === patient._d}
              />
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-6 mt-8">
        <AIChatPanel
          patientId={selectedPatient?._id || null}
          patientName={selectedPatient?.full_name || null}
        />
      </div>
    </div>
  );
}