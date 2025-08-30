import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Phone, MapPin, Edit3, Save, X, Building2 } from 'lucide-react';

const API_BASE = 'http://localhost:3000';

const nearbyPharmacies = [
  {
    name: 'CVS Pharmacy',
    address: '123 Main St, Downtown',
    phone: '(555) 123-4567',
    hours: 'Open 24 hours',
    distance: '0.5 miles',
  },
  {
    name: 'Walgreens',
    address: '456 Oak Ave, Midtown',
    phone: '(555) 234-5678',
    hours: 'Mon-Sun: 8AM-10PM',
    distance: '0.8 miles',
  },
  {
    name: 'Rite Aid',
    address: '789 Pine St, Uptown',
    phone: '(555) 345-6789',
    hours: 'Mon-Fri: 9AM-9PM, Weekends: 9AM-6PM',
    distance: '1.2 miles',
  },
];

export function EmergencyInfo() {
  const { user } = useAuth();
  const [editingHospital, setEditingHospital] = useState(false);
  const [caregiverData, setCaregiverData] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [hospitalData, setHospitalData] = useState({
    hospitalName: '',
    hospitalAddress: '',
    hospitalPhone: '',
    doctorName: '',
    doctorPhone: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchEmergencyInfo();
    }
  }, [user]);

  const fetchEmergencyInfo = async () => {
    try {
      const res = await fetch(`${API_BASE}/emergency/${user._id}`);
      const data = await res.json();
      
      // Set caregiver data if available
      if (data.caregiver) {
        setCaregiverData({
          name: data.caregiver.name || 'Not available',
          email: data.caregiver.email || 'Not available',
          phone: data.caregiver.phone || 'Not available',
        });
      } else {
        setCaregiverData({
          name: 'No caregiver linked',
          email: 'N/A',
          phone: 'N/A',
        });
      }
      
      // Set hospital data
      setHospitalData({
        hospitalName: data.hospital_name || '',
        hospitalAddress: data.hospital_address || '',
        hospitalPhone: data.hospital_phone || '',
        doctorName: data.doctor_name || '',
        doctorPhone: data.doctor_phone || '',
      });
    } catch (error) {
      // fallback to empty
      setCaregiverData({
        name: 'Unable to load',
        email: 'N/A',
        phone: 'N/A',
      });
      setHospitalData({
        hospitalName: '',
        hospitalAddress: '',
        hospitalPhone: '',
        doctorName: '',
        doctorPhone: '',
      });
    }
  };


  const handleSaveHospital = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/emergency/${user._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hospital_name: hospitalData.hospitalName,
          hospital_address: hospitalData.hospitalAddress,
          hospital_phone: hospitalData.hospitalPhone,
          doctor_name: hospitalData.doctorName,
          doctor_phone: hospitalData.doctorPhone,
        }),
      });
      if (!res.ok) throw new Error('Failed to update hospital information');
      setEditingHospital(false);
      fetchEmergencyInfo();
    } catch (error) {
      console.error('Error updating hospital information:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
          <Phone className="h-8 w-8 text-red-600 dark:text-red-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Emergency Information</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Quick access to important contacts and nearby pharmacies</p>
      </div>

      {/* Emergency Contacts - Caregiver Information */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center">
            <Phone className="h-6 w-6 text-red-600 dark:text-red-400 mr-2" />
            Emergency Contact - Your Caregiver
          </h3>
          <div className="bg-green-50 dark:bg-green-900/50 px-3 py-1 rounded-full">
            <span className="text-sm text-green-700 dark:text-green-300 font-medium">Auto-populated</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
              Caregiver Name
            </label>
            <div className="bg-blue-50 dark:bg-blue-900/50 rounded-lg p-4 border border-blue-200 dark:border-blue-500/30">
              <p className="text-lg text-blue-900 dark:text-blue-200 font-medium">
                {caregiverData.name}
              </p>
            </div>
          </div>

          <div>
            <label className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
              Caregiver Contact
            </label>
            <div className="bg-blue-50 dark:bg-blue-900/50 rounded-lg p-4 border border-blue-200 dark:border-blue-500/30">
              <p className="text-lg text-blue-900 dark:text-blue-200 font-medium mb-1">
                {caregiverData.phone !== 'N/A' ? caregiverData.phone : 'Phone not provided'}
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                {caregiverData.email}
              </p>
              {caregiverData.phone !== 'N/A' && caregiverData.phone !== 'Not available' && (
                <a
                  href={`tel:${caregiverData.phone}`}
                  className="inline-flex items-center mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 dark:bg-blue-500 dark:hover:bg-blue-400"
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Call Caregiver
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Quick Call Buttons */}
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-slate-700">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Quick Emergency Numbers</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a
              href="tel:911"
              className="flex items-center justify-center p-4 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors duration-200"
            >
              <Phone className="h-5 w-5 mr-2" />
              Emergency: 911
            </a>
            <a
              href="tel:1-800-222-1222"
              className="flex items-center justify-center p-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors duration-200"
            >
              <Phone className="h-5 w-5 mr-2" />
              Poison Control
            </a>
            <a
              href="tel:211"
              className="flex items-center justify-center p-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors duration-200"
            >
              <Phone className="h-5 w-5 mr-2" />
              Health Info: 211
            </a>
          </div>
        </div>
      </div>

      {/* Hospital Information */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center">
            <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-2" />
            Preferred Hospital & Doctor
          </h3>
          {!editingHospital ? (
            <button
              onClick={() => setEditingHospital(true)}
              className="flex items-center px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-lg transition-colors duration-200 dark:bg-blue-900/50 dark:hover:bg-blue-900/80 dark:text-blue-300"
            >
              <Edit3 className="h-4 w-4 mr-2" />
              {hospitalData.hospitalName ? 'Edit' : 'Add Hospital'}
            </button>
          ) : (
            <div className="flex space-x-2">
              <button
                onClick={handleSaveHospital}
                disabled={loading}
                className="flex items-center px-4 py-2 bg-green-100 hover:bg-green-200 text-green-600 rounded-lg transition-colors duration-200 dark:bg-green-900/50 dark:hover:bg-green-900/80 dark:text-green-300"
              >
                <Save className="h-4 w-4 mr-2" />
                Save
              </button>
              <button
                onClick={() => {
                  setEditingHospital(false);
                  fetchEmergencyInfo(); // Reset to original data
                }}
                className="flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors duration-200 dark:bg-slate-600 dark:hover:bg-slate-500 dark:text-gray-300"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </button>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {/* Hospital Information */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                Hospital Name
              </label>
              {editingHospital ? (
                <input
                  type="text"
                  value={hospitalData.hospitalName}
                  onChange={(e) => setHospitalData(prev => ({ ...prev, hospitalName: e.target.value }))}
                  className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:border-slate-600 dark:text-gray-200 dark:placeholder-gray-400"
                  placeholder="Enter hospital name"
                />
              ) : (
                <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4">
                  <p className="text-lg text-gray-900 dark:text-gray-100">
                    {hospitalData.hospitalName || 'Not set'}
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                Hospital Phone
              </label>
              {editingHospital ? (
                <input
                  type="tel"
                  value={hospitalData.hospitalPhone}
                  onChange={(e) => setHospitalData(prev => ({ ...prev, hospitalPhone: e.target.value }))}
                  className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:border-slate-600 dark:text-gray-200 dark:placeholder-gray-400"
                  placeholder="Enter hospital phone"
                />
              ) : (
                <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4">
                  <p className="text-lg text-gray-900 dark:text-gray-100">
                    {hospitalData.hospitalPhone || 'Not set'}
                  </p>
                  {hospitalData.hospitalPhone && (
                    <a
                      href={`tel:${hospitalData.hospitalPhone}`}
                      className="inline-flex items-center mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 dark:bg-blue-500 dark:hover:bg-blue-400"
                    >
                      <Phone className="h-4 w-4 mr-2" />
                      Call Hospital
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
              Hospital Address
            </label>
            {editingHospital ? (
              <textarea
                value={hospitalData.hospitalAddress}
                onChange={(e) => setHospitalData(prev => ({ ...prev, hospitalAddress: e.target.value }))}
                rows={3}
                className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none dark:bg-slate-700 dark:border-slate-600 dark:text-gray-200 dark:placeholder-gray-400"
                placeholder="Enter hospital address"
              />
            ) : (
              <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4">
                <p className="text-lg text-gray-900 dark:text-gray-100">
                  {hospitalData.hospitalAddress || 'Not set'}
                </p>
                {hospitalData.hospitalAddress && (
                  <a
                    href={`https://maps.google.com/maps?q=${encodeURIComponent(hospitalData.hospitalAddress)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center mt-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors duration-200 dark:bg-green-500 dark:hover:bg-green-400"
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    Get Directions
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Doctor Information */}
          <div className="pt-6 border-t border-gray-200 dark:border-slate-700">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Primary Care Doctor</h4>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Doctor Name
                </label>
                {editingHospital ? (
                  <input
                    type="text"
                    value={hospitalData.doctorName}
                    onChange={(e) => setHospitalData(prev => ({ ...prev, doctorName: e.target.value }))}
                    className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:border-slate-600 dark:text-gray-200 dark:placeholder-gray-400"
                    placeholder="Enter doctor's name"
                  />
                ) : (
                  <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4">
                    <p className="text-lg text-gray-900 dark:text-gray-100">
                      {hospitalData.doctorName || 'Not set'}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Doctor Phone
                </label>
                {editingHospital ? (
                  <input
                    type="tel"
                    value={hospitalData.doctorPhone}
                    onChange={(e) => setHospitalData(prev => ({ ...prev, doctorPhone: e.target.value }))}
                    className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:border-slate-600 dark:text-gray-200 dark:placeholder-gray-400"
                    placeholder="Enter doctor's phone"
                  />
                ) : (
                  <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4">
                    <p className="text-lg text-gray-900 dark:text-gray-100">
                      {hospitalData.doctorPhone || 'Not set'}
                    </p>
                    {hospitalData.doctorPhone && (
                      <a
                        href={`tel:${hospitalData.doctorPhone}`}
                        className="inline-flex items-center mt-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors duration-200 dark:bg-green-500 dark:hover:bg-green-400"
                      >
                        <Phone className="h-4 w-4 mr-2" />
                        Call Doctor
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Nearby Pharmacies */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6 flex items-center">
          <MapPin className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-2" />
          Nearby Pharmacies
        </h3>

        <div className="space-y-4">
          {nearbyPharmacies.map((pharmacy, index) => (
            <div key={index} className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-6 border border-gray-200 dark:border-slate-600">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{pharmacy.name}</h4>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">{pharmacy.address}</p>
                  <p className="text-gray-600 dark:text-gray-400">{pharmacy.hours}</p>
                  <p className="text-sm text-blue-600 dark:text-blue-400 font-medium mt-1">{pharmacy.distance} away</p>
                </div>
                <div className="flex flex-col space-y-2">
                  <a
                    href={`tel:${pharmacy.phone}`}
                    className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors duration-200 dark:bg-green-500 dark:hover:bg-green-400"
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    Call
                  </a>
                  <a
                    href={`https://maps.google.com/maps?q=${encodeURIComponent(pharmacy.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 dark:bg-blue-500 dark:hover:bg-blue-400"
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    Directions
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}