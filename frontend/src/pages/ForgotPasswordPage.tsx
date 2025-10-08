import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiService } from '../services/api';
import RibbonBackground from '../components/RibbonBackground';

const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<'email' | 'otp' | 'reset'>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Email step form data
  const [emailData, setEmailData] = useState({
    email: '',
  });

  // OTP step form data
  const [otpData, setOtpData] = useState({
    email: '',
    code: '',
  });

  // Reset step form data
  const [resetData, setResetData] = useState({
    email: '',
    code: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleEmailInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEmailData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  };

  const handleOtpInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setOtpData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  };

  const handleResetInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setResetData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await apiService.requestForgotPasswordOtp(emailData.email);
      setSuccess('OTP sent to your email!');
      setOtpData(prev => ({ ...prev, email: emailData.email }));
      setResetData(prev => ({ ...prev, email: emailData.email }));
      setStep('otp');
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // For now, we'll just move to the reset step
    // In a real implementation, you might want to verify the OTP first
    setResetData(prev => ({ ...prev, code: otpData.code }));
    setStep('reset');
    setLoading(false);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate passwords match
    if (resetData.newPassword !== resetData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    // Validate password strength
    if (resetData.newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      setLoading(false);
      return;
    }

    try {
      await apiService.resetPassword({
        email: resetData.email,
        code: resetData.code,
        newPassword: resetData.newPassword,
      });

      setSuccess('Password reset successfully! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Password reset failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    setError('');

    try {
      await apiService.requestForgotPasswordOtp(emailData.email);
      setSuccess('OTP resent to your email!');
    } catch (err: any) {
      setError(err.message || 'Failed to resend OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <RibbonBackground />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-800/70 via-fuchsia-700/70 to-rose-700/70" />

      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md pt-16 text-center">
        <h1 className="text-4xl font-extrabold text-white drop-shadow mb-2">PlayMate</h1>
        <h2 className="text-2xl font-bold text-white">
          {step === 'email' && 'Reset your password'}
          {step === 'otp' && 'Verify your email'}
          {step === 'reset' && 'Create new password'}
        </h2>
        <p className="mt-2 text-sm text-indigo-100">
          {step === 'email' && 'Enter your email to receive a reset code'}
          {step === 'otp' && 'Enter the code sent to your email'}
          {step === 'reset' && 'Create a new password for your account'}
        </p>
      </div>

      <div className="relative z-10 mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl rounded-2xl p-6 sm:p-8">
          {step === 'email' && (
            <form className="space-y-6" onSubmit={handleRequestOtp}>
              {error && (
                <div className="bg-red-500/20 border border-red-300 text-red-100 px-4 py-3 rounded-md">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-indigo-100">
                  Email address
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={emailData.email}
                    onChange={handleEmailInputChange}
                    className="appearance-none block w-full px-3 py-2 rounded-md bg-white/90 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent sm:text-sm"
                    placeholder="Enter your email address"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-2.5 px-4 rounded-md shadow-lg text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-400 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Sending OTP...' : 'Send reset code'}
                </button>
              </div>
            </form>
          )}

          {step === 'otp' && (
            <form className="space-y-6" onSubmit={handleVerifyOtp}>
              {error && (
                <div className="bg-red-500/20 border border-red-300 text-red-100 px-4 py-3 rounded-md">
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-green-500/20 border border-green-300 text-green-100 px-4 py-3 rounded-md">
                  {success}
                </div>
              )}

              <div>
                <label htmlFor="code" className="block text-sm font-medium text-indigo-100">
                  Reset Code
                </label>
                <div className="mt-2 flex items-center gap-2">
                  {Array.from({ length: 6 }).map((_, idx) => (
                    <input
                      key={idx}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={otpData.code[idx] || ''}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        const next = (otpData.code || '').split('');
                        next[idx] = val;
                        const joined = next.join('').slice(0, 6);
                        setOtpData(prev => ({ ...prev, code: joined }));
                        if (val && e.currentTarget.nextElementSibling instanceof HTMLInputElement) {
                          e.currentTarget.nextElementSibling.focus();
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Backspace' && !otpData.code[idx] && e.currentTarget.previousElementSibling instanceof HTMLInputElement) {
                          e.currentTarget.previousElementSibling.focus();
                        }
                      }}
                      className="w-10 h-12 text-center rounded-md bg-white/90 text-gray-900 font-semibold focus:outline-none focus:ring-2 focus:ring-pink-400"
                    />
                  ))}
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  Didn't receive the code?{' '}
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={loading}
                    className="font-medium text-blue-200 hover:text-white underline disabled:opacity-50"
                  >
                    Resend code
                  </button>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-2.5 px-4 rounded-md shadow-lg text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-400 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Verifying...' : 'Verify code'}
                </button>
              </div>
            </form>
          )}

          {step === 'reset' && (
            <form className="space-y-6" onSubmit={handleResetPassword}>
              {error && (
                <div className="bg-red-500/20 border border-red-300 text-red-100 px-4 py-3 rounded-md">
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-green-500/20 border border-green-300 text-green-100 px-4 py-3 rounded-md">
                  {success}
                </div>
              )}

              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-indigo-100">
                  New Password
                </label>
                <div className="mt-1">
                  <input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    required
                    value={resetData.newPassword}
                    onChange={handleResetInputChange}
                    className="appearance-none block w-full px-3 py-2 rounded-md bg-white/90 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent sm:text-sm"
                    placeholder="Enter new password"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-indigo-100">
                  Confirm New Password
                </label>
                <div className="mt-1">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    value={resetData.confirmPassword}
                    onChange={handleResetInputChange}
                    className="appearance-none block w-full px-3 py-2 rounded-md bg-white/90 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent sm:text-sm"
                    placeholder="Confirm new password"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-2.5 px-4 rounded-md shadow-lg text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-400 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Resetting password...' : 'Reset password'}
                </button>
              </div>
            </form>
          )}

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/20" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-transparent text-indigo-100">Remember your password?</span>
              </div>
            </div>

            <div className="mt-6">
              <Link
                to="/login"
                className="w-full flex justify-center py-2 px-4 rounded-md shadow-sm text-sm font-semibold text-white bg-white/10 border border-white/20 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-400"
              >
                Back to sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
