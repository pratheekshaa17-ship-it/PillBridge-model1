import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Heart, Users, Pill, AlertCircle } from 'lucide-react';

export function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState<'patient' | 'caregiver'>('patient');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    caregiverCode: '',
    emergencyContact: '',
    emergencyPhone: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  const { signIn, signUp, user } = useAuth();

  // Redirect if user is already authenticated
  useEffect(() => {
    if (user) {
      console.log('User already authenticated, redirecting to dashboard');
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        const { error, user } = await signIn(formData.email, formData.password);
        if (error) {
          setError(error.message);
        } else if (user) {
          console.log('Login successful, navigating to dashboard');
          // Navigate to dashboard after successful login
          navigate('/', { replace: true });
        }
      } else {
        let linkedCaregiverId = null;
        
        // If patient, caregiver code verification will be handled by the backend
        if (role === 'patient' && formData.caregiverCode) {
          linkedCaregiverId = formData.caregiverCode.toUpperCase();
        }

        const { error, user } = await signUp(formData.email, formData.password, {
          fullName: formData.fullName,
          role,
          caregiverCode: formData.caregiverCode.toUpperCase(),
          linkedCaregiverId,
          emergencyContact: formData.emergencyContact,
          emergencyPhone: formData.emergencyPhone,
        });
        
        if (error) {
          setError(error.message);
        } else if (user) {
          console.log('Registration successful, navigating to dashboard');
          // Navigate to dashboard after successful registration
          navigate('/', { replace: true });
        }
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:bg-slate-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center w-20 h-20 bg-blue-600 rounded-2xl mx-auto mb-4">
            <Pill className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">PillBridge</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">Medication Care Made Simple</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {isLogin ? 'Welcome Back' : 'Join PillBridge'}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              {isLogin ? 'Sign in to your account' : 'Create your account'}
            </p>
          </div>

          {!isLogin && (
            <div className="mb-6">
              <label className="block text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3">
                I am a:
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('patient')}
                  className={`flex items-center justify-center p-4 rounded-xl border-2 transition-all duration-200 ${
                    role === 'patient'
                      ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-500'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 dark:bg-slate-700 dark:border-slate-600 dark:text-gray-300 dark:hover:border-slate-500'
                  }`}
                >
                  <Heart className="h-6 w-6 mr-2" />
                  <span className="font-medium">Patient</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('caregiver')}
                  className={`flex items-center justify-center p-4 rounded-xl border-2 transition-all duration-200 ${
                    role === 'caregiver'
                      ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-500'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 dark:bg-slate-700 dark:border-slate-600 dark:text-gray-300 dark:hover:border-slate-500'
                  }`}
                >
                  <Users className="h-6 w-6 mr-2" />
                  <span className="font-medium">Caregiver</span>
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center dark:bg-red-900/20 dark:border-red-500/30">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <span className="text-red-700 dark:text-red-300">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label htmlFor="fullName" className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:border-slate-600 dark:text-gray-200 dark:placeholder-gray-400"
                  placeholder="Enter your full name"
                />
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:border-slate-600 dark:text-gray-200 dark:placeholder-gray-400"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:border-slate-600 dark:text-gray-200 dark:placeholder-gray-400"
                placeholder="Enter your password"
              />
            </div>

            {!isLogin && role === 'patient' && (
              <div>
                <label htmlFor="caregiverCode" className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Caregiver Code
                </label>
                <input
                  type="text"
                  id="caregiverCode"
                  name="caregiverCode"
                  value={formData.caregiverCode}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase dark:bg-slate-700 dark:border-slate-600 dark:text-gray-200 dark:placeholder-gray-400"
                  placeholder="Enter caregiver's code"
                />
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Ask your caregiver for their 6-character code
                </p>
              </div>
            )}

            {!isLogin && (
              <>
                <div>
                  <label htmlFor="emergencyContact" className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Emergency Contact Name
                  </label>
                  <input
                    type="text"
                    id="emergencyContact"
                    name="emergencyContact"
                    value={formData.emergencyContact}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:border-slate-600 dark:text-gray-200 dark:placeholder-gray-400"
                    placeholder="Emergency contact name"
                  />
                </div>

                <div>
                  <label htmlFor="emergencyPhone" className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Emergency Phone Number
                  </label>
                  <input
                    type="tel"
                    id="emergencyPhone"
                    name="emergencyPhone"
                    value={formData.emergencyPhone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:border-slate-600 dark:text-gray-200 dark:placeholder-gray-400"
                    placeholder="Emergency phone number"
                  />
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-lg font-semibold py-4 rounded-lg transition-colors duration-200 dark:disabled:bg-blue-500/50"
            >
              {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
                setFormData({
                  email: '',
                  password: '',
                  fullName: '',
                  caregiverCode: '',
                  emergencyContact: '',
                  emergencyPhone: '',
                });
              }}
              className="text-blue-600 hover:text-blue-700 font-medium text-lg dark:text-blue-400 dark:hover:text-blue-300"
            >
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}