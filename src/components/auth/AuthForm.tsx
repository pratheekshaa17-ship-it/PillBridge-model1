import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Heart, Users, Pill, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function AuthForm() {
  const { t } = useTranslation();
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
          navigate('/', { replace: true });
        }
      } else {
        let linkedCaregiverId = null;
        
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center w-20 h-20 bg-blue-600 rounded-2xl mx-auto mb-4">
            <Pill className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{t('layout.title')}</h1>
          <p className="text-lg text-gray-600">{t('layout.subtitle')}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {isLogin ? t('auth.welcomeBack') : t('auth.joinPillBridge')}
            </h2>
            <p className="text-gray-600 mt-2">
              {isLogin ? t('auth.signInToAccount') : t('auth.createYourAccount')}
            </p>
          </div>

          {!isLogin && (
            <div className="mb-6">
              <label className="block text-lg font-semibold text-gray-700 mb-3">
                {t('auth.iAmA')}
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('patient')}
                  className={`flex items-center justify-center p-4 rounded-xl border-2 transition-all duration-200 ${
                    role === 'patient'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <Heart className="h-6 w-6 mr-2" />
                  <span className="font-medium">{t('auth.patient')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('caregiver')}
                  className={`flex items-center justify-center p-4 rounded-xl border-2 transition-all duration-200 ${
                    role === 'caregiver'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <Users className="h-6 w-6 mr-2" />
                  <span className="font-medium">{t('auth.caregiver')}</span>
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <span className="text-red-700">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label htmlFor="fullName" className="block text-lg font-medium text-gray-700 mb-2">
                  {t('auth.fullNameLabel')}
                </label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t('auth.fullNamePlaceholder')}
                />
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-lg font-medium text-gray-700 mb-2">
                {t('auth.emailLabel')}
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={t('auth.emailPlaceholder')}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-lg font-medium text-gray-700 mb-2">
                {t('auth.passwordLabel')}
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={t('auth.passwordPlaceholder')}
              />
            </div>

            {!isLogin && role === 'patient' && (
              <div>
                <label htmlFor="caregiverCode" className="block text-lg font-medium text-gray-700 mb-2">
                  {t('auth.caregiverCodeLabel')}
                </label>
                <input
                  type="text"
                  id="caregiverCode"
                  name="caregiverCode"
                  value={formData.caregiverCode}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                  placeholder={t('auth.caregiverCodePlaceholder')}
                />
                <p className="text-sm text-gray-600 mt-1">
                  {t('auth.caregiverCodeHint')}
                </p>
              </div>
            )}

            {!isLogin && (
              <>
                <div>
                  <label htmlFor="emergencyContact" className="block text-lg font-medium text-gray-700 mb-2">
                    {t('auth.emergencyContactLabel')}
                  </label>
                  <input
                    type="text"
                    id="emergencyContact"
                    name="emergencyContact"
                    value={formData.emergencyContact}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t('auth.emergencyContactPlaceholder')}
                  />
                </div>

                <div>
                  <label htmlFor="emergencyPhone" className="block text-lg font-medium text-gray-700 mb-2">
                    {t('auth.emergencyPhoneLabel')}
                  </label>
                  <input
                    type="tel"
                    id="emergencyPhone"
                    name="emergencyPhone"
                    value={formData.emergencyPhone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t('auth.emergencyPhonePlaceholder')}
                  />
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-lg font-semibold py-4 rounded-lg transition-colors duration-200"
            >
              {loading ? t('auth.pleaseWait') : (isLogin ? t('auth.signIn') : t('auth.createAccount'))}
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
              className="text-blue-600 hover:text-blue-700 font-medium text-lg"
            >
              {isLogin ? t('auth.promptSignUp') : t('auth.promptSignIn')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}