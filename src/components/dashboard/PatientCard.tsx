import React, { useState, useEffect } from 'react';
import { apiClient, User } from '../../lib/api';
import { Heart, Pill, AlertTriangle, CheckCircle, Phone, MessageCircle, Download } from 'lucide-react';
import { PatientDetailsModal } from './PatientDetailsModal';
import { MessageModal } from '../messaging/MessageModal';

interface PatientCardProps {
  patient: User;
  onClick: () => void;
  isSelected: boolean;
}

export function PatientCard({ patient, onClick, isSelected }: PatientCardProps) {
  const [medications, setMedications] = useState([]);
  const [todayReminders, setTodayReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);

  useEffect(() => {
    fetchPatientData();
    
    // Set up automatic refresh every 5 minutes for real-time progress updates
    const intervalId = setInterval(() => {
      fetchPatientData();
    }, 300000); // Refresh every 5 minutes
    
    return () => clearInterval(intervalId); // Cleanup on unmount
  }, [patient._id]);

  const fetchPatientData = async () => {
    try {
      // Fetch medications using the new API
      const medData = await apiClient.medications.getByPatientId(patient._id);
      
      // Fetch today's reminders using the new API
      const today = new Date().toISOString().split('T')[0];
      const reminderData = await apiClient.reminders.getByPatientId(patient._id, today);

      setMedications(medData || []);
      setTodayReminders(reminderData || []);
    } catch (error) {
      console.error('Error fetching patient data:', error);
      // Set empty arrays on error to prevent crashes
      setMedications([]);
      setTodayReminders([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-50 dark:bg-slate-800/50 rounded-xl p-6 animate-pulse">
        <div className="h-6 bg-gray-200 dark:bg-slate-700 rounded w-3/4 mb-4"></div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  const acknowledgedReminders = todayReminders.filter(r => r.acknowledged).length;
  const totalReminders = todayReminders.length;
  const lowStockCount = medications.filter(med => med.current_count <= med.low_stock_threshold).length;

  const handleCallNow = () => {
    if (patient.emergency_phone) {
      window.location.href = `tel:${patient.emergency_phone}`;
    } else {
      alert('No phone number available for this patient. Please check their emergency contact information.');
    }
  };

  return (
    <div
      className={`rounded-xl p-6 border transition-all duration-200 cursor-pointer ${
        isSelected
          ? 'bg-blue-50 border-blue-500 shadow-lg dark:bg-blue-900/50 dark:border-blue-500'
          : 'bg-gray-50 border-gray-200 hover:shadow-md dark:bg-slate-800/80 dark:border-slate-700 dark:hover:border-slate-600'
      }`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-3 ${isSelected ? 'bg-blue-100 dark:bg-blue-900' : 'bg-gray-200 dark:bg-slate-700'}`}>
            <Heart className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{patient.full_name}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{patient.email}</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Pill className="h-5 w-5 text-gray-600 dark:text-gray-400 mr-2" />
            <span className="text-gray-700 dark:text-gray-300">Medications</span>
          </div>
          <span className="font-semibold text-gray-900 dark:text-gray-100">{medications.length}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
            <span className="text-gray-700 dark:text-gray-300">Today's Progress</span>
          </div>
          <span className="font-semibold text-gray-900 dark:text-gray-100">
            {acknowledgedReminders}/{totalReminders}
          </span>
        </div>

        {lowStockCount > 0 && (
          <div className="flex items-center justify-between text-red-600 dark:text-red-400">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              <span>Low Stock</span>
            </div>
            <span className="font-semibold">{lowStockCount}</span>
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700">
        <div className="space-y-2">
          <button
            onClick={(e) => { e.stopPropagation(); setShowDetailsModal(true); }}
            className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400 text-white text-sm font-medium py-2 px-3 rounded-lg transition-colors duration-200"
          >
            View Details
          </button>
          
          <div className="flex space-x-2">
            <button
              onClick={(e) => { e.stopPropagation(); handleCallNow(); }}
              className="flex-1 bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-400 text-white text-sm font-medium py-2 px-3 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              <Phone className="h-4 w-4" />
              <span>Call</span>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setShowMessageModal(true); }}
              className="flex-1 bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-400 text-white text-sm font-medium py-2 px-3 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              <MessageCircle className="h-4 w-4" />
              <span>Message</span>
            </button>
          </div>
        </div>
      </div>

      {/* Patient Details Modal */}
      <PatientDetailsModal
        patient={patient}
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
      />
      
      {/* Message Modal */}
      <MessageModal
        isOpen={showMessageModal}
        onClose={() => setShowMessageModal(false)}
        recipient={patient}
      />
    </div>
  );
}