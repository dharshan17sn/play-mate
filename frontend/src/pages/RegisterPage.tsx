import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiService } from '../services/api';

const RegisterPage: React.FC = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState<'email' | 'otp'>('email');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Email step form data
    const [emailData, setEmailData] = useState({
        email: '',
    });

    // OTP step form data - simplified to match backend schema
    const [otpData, setOtpData] = useState({
        email: '',
        code: '',
        user_id: '',
        displayName: '',
        password: '',
        gender: '',
        location: '',
    });

    const handleEmailInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setEmailData(prev => ({
            ...prev,
            [name]: value
        }));
        if (error) setError('');
    };

    const handleOtpInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setOtpData(prev => ({
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
            await apiService.requestRegistrationOtp(emailData.email);
            setSuccess('OTP sent to your email!');
            setOtpData(prev => ({ ...prev, email: emailData.email }));
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

        // Validate required fields
        if (!otpData.email || !otpData.code || !otpData.user_id || !otpData.displayName || !otpData.password) {
            setError('Please fill in all required fields (email, OTP, username, display name, password)');
            setLoading(false);
            return;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(otpData.email)) {
            setError('Please enter a valid email address');
            setLoading(false);
            return;
        }

        // Validate username format
        const usernameRegex = /^[a-zA-Z0-9_-]+$/;
        if (!usernameRegex.test(otpData.user_id)) {
            setError('Username can only contain letters, numbers, underscores, and hyphens');
            setLoading(false);
            return;
        }

        // Validate password strength
        if (otpData.password.length < 8) {
            setError('Password must be at least 8 characters long');
            setLoading(false);
            return;
        }

        try {
            const payload: any = {
                email: otpData.email,
                code: otpData.code,
                user_id: otpData.user_id,
                displayName: otpData.displayName,
                password: otpData.password,
            };

            // Only include optional fields if they have values (avoid backend validation on empty strings)
            if (otpData.gender && otpData.gender.trim()) {
                payload.gender = otpData.gender.trim();
            }
            if (otpData.location && otpData.location.trim()) {
                payload.location = otpData.location.trim();
            }

            console.log('Sending verify-otp payload:', payload);
            console.log('Payload JSON:', JSON.stringify(payload, null, 2));
            const response = await apiService.verifyRegistrationOtp(payload);

            if (response.success) {
                // Clear any existing token first to ensure clean registration
                apiService.removeAuthToken();

                // Store the new token
                apiService.setAuthToken(response.data.token);

                // Redirect to dashboard
                navigate('/dashboard');
            }
        } catch (err: any) {
            console.error('Registration error:', err);

            // Format error message for better display
            let displayError = err.message || 'Registration failed. Please try again.';

            // If the error message contains validation details, format them nicely
            if (displayError.includes('Validation errors:')) {
                displayError = displayError.replace(/\n•/g, '\n• ');
            }

            setError(displayError);
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        setLoading(true);
        setError('');

        try {
            await apiService.requestRegistrationOtp(emailData.email);
            setSuccess('OTP resent to your email!');
        } catch (err: any) {
            setError(err.message || 'Failed to resend OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        PlayMate
                    </h1>
                    <h2 className="text-2xl font-bold text-gray-900">
                        {step === 'email' ? 'Create your account' : 'Verify your email'}
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        {step === 'email' ? (
                            <>
                                Already have an account?{' '}
                                <Link
                                    to="/login"
                                    className="font-medium text-blue-600 hover:text-blue-500"
                                >
                                    Sign in
                                </Link>
                            </>
                        ) : (
                            <>
                                Back to{' '}
                                <button
                                    onClick={() => setStep('email')}
                                    className="font-medium text-blue-600 hover:text-blue-500"
                                >
                                    email step
                                </button>
                            </>
                        )}
                    </p>
                </div>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    {step === 'email' ? (
                        <form className="space-y-6" onSubmit={handleRequestOtp}>
                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                                    {error}
                                </div>
                            )}

                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                    Email address <span className="text-red-500">*</span>
                                </label>
                                <div className="mt-1">
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        required
                                        value={emailData.email}
                                        onChange={handleEmailInputChange}
                                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                        placeholder="Enter your email address"
                                    />
                                </div>
                            </div>

                            <div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? 'Sending OTP...' : 'Send OTP'}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <form className="space-y-6" onSubmit={handleVerifyOtp}>
                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                                    <div className="whitespace-pre-line text-sm">
                                        {error}
                                    </div>
                                </div>
                            )}

                            {success && (
                                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
                                    {success}
                                </div>
                            )}

                            {/* OTP Section */}
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <h3 className="text-sm font-medium text-blue-900 mb-3">Email Verification</h3>
                                <div className="mb-3 p-2 bg-blue-100 rounded border">
                                    <span className="text-sm text-blue-800">
                                        <strong>Email:</strong> {otpData.email}
                                    </span>
                                </div>

                                <div className="mb-4">
                                    <label htmlFor="code" className="block text-sm font-medium text-gray-700">
                                        OTP Code <span className="text-red-500">*</span>
                                    </label>
                                    <div className="mt-1">
                                        <input
                                            id="code"
                                            name="code"
                                            type="text"
                                            required
                                            value={otpData.code}
                                            onChange={handleOtpInputChange}
                                            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                            placeholder="Enter 6-digit OTP"
                                            maxLength={6}
                                        />
                                    </div>
                                    <div className="mt-2 text-sm text-gray-600">
                                        Didn't receive the code?{' '}
                                        <button
                                            type="button"
                                            onClick={handleResendOtp}
                                            disabled={loading}
                                            className="font-medium text-blue-600 hover:text-blue-500 disabled:opacity-50"
                                        >
                                            Resend OTP
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Account Details Section */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h3 className="text-sm font-medium text-gray-900 mb-3">Account Details</h3>

                                <div className="space-y-4">
                                    <div>
                                        <label htmlFor="user_id" className="block text-sm font-medium text-gray-700">
                                            Username <span className="text-red-500">*</span>
                                        </label>
                                        <div className="mt-1">
                                            <input
                                                id="user_id"
                                                name="user_id"
                                                type="text"
                                                required
                                                value={otpData.user_id}
                                                onChange={handleOtpInputChange}
                                                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                                placeholder="Choose a unique username (letters, numbers, _ -)"
                                            />
                                        </div>
                                        <p className="mt-1 text-xs text-gray-500">
                                            Username must be 4-20 characters, letters, numbers, underscores, and hyphens only
                                        </p>
                                    </div>

                                    <div>
                                        <label htmlFor="displayName" className="block text-sm font-medium text-gray-700">
                                            Display Name <span className="text-red-500">*</span>
                                        </label>
                                        <div className="mt-1">
                                            <input
                                                id="displayName"
                                                name="displayName"
                                                type="text"
                                                required
                                                value={otpData.displayName}
                                                onChange={handleOtpInputChange}
                                                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                                placeholder="Enter your display name"
                                            />
                                        </div>
                                        <p className="mt-1 text-xs text-gray-500">
                                            Display name must be 4-30 characters
                                        </p>
                                    </div>

                                    <div>
                                        <label htmlFor="gender" className="block text-sm font-medium text-gray-700">
                                            Gender
                                        </label>
                                        <div className="mt-1">
                                            <select
                                                id="gender"
                                                name="gender"
                                                value={otpData.gender}
                                                onChange={handleOtpInputChange}
                                                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                            >
                                                <option value="">Select gender</option>
                                                <option value="male">Male</option>
                                                <option value="female">Female</option>
                                                <option value="other">Other</option>
                                                <option value="prefer-not-to-say">Prefer not to say</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                                            Location
                                        </label>
                                        <div className="mt-1">
                                            <input
                                                id="location"
                                                name="location"
                                                type="text"
                                                value={otpData.location}
                                                onChange={handleOtpInputChange}
                                                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                                placeholder="Enter your location"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Password Section */}
                            <div className="bg-green-50 p-4 rounded-lg">
                                <h3 className="text-sm font-medium text-green-900 mb-3">Set Password</h3>

                                <div>
                                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                        Password <span className="text-red-500">*</span>
                                    </label>
                                    <div className="mt-1">
                                        <input
                                            id="password"
                                            name="password"
                                            type="password"
                                            required
                                            value={otpData.password}
                                            onChange={handleOtpInputChange}
                                            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                            placeholder="Create a strong password (min 8 characters)"
                                        />
                                    </div>
                                    <p className="mt-1 text-xs text-gray-500">
                                        Password must be at least 8 characters long
                                    </p>
                                </div>
                            </div>

                            <div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? 'Creating account...' : 'Create account'}
                                </button>
                            </div>
                        </form>
                    )}

                    <div className="mt-6">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white text-gray-500">
                                    {step === 'email' ? 'Already have an account?' : 'Back to sign in'}
                                </span>
                            </div>
                        </div>

                        <div className="mt-6">
                            <Link
                                to="/login"
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-blue-600 bg-white border-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                Sign in to existing account
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
