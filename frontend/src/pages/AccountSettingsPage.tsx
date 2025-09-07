import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';

const AccountSettingsPage: React.FC = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'password' | 'delete'>('password');

    // Change Password State
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');

    // Delete Account State
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteError, setDeleteError] = useState('');
    const [confirmText, setConfirmText] = useState('');

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordError('');
        setPasswordSuccess('');

        // Validation
        if (!currentPassword || !newPassword || !confirmPassword) {
            setPasswordError('All fields are required');
            return;
        }

        if (newPassword !== confirmPassword) {
            setPasswordError('New passwords do not match');
            return;
        }

        if (newPassword.length < 8) {
            setPasswordError('New password must be at least 8 characters long');
            return;
        }

        if (currentPassword === newPassword) {
            setPasswordError('New password must be different from current password');
            return;
        }

        setPasswordLoading(true);
        try {
            const response = await apiService.changePassword(currentPassword, newPassword);
            if (response.success) {
                setPasswordSuccess('Password changed successfully!');
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
            } else {
                setPasswordError(response.message || 'Failed to change password');
            }
        } catch (error: any) {
            setPasswordError(error.response?.data?.message || 'Failed to change password');
        } finally {
            setPasswordLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        setDeleteError('');

        if (confirmText !== 'DELETE') {
            setDeleteError('Please type DELETE to confirm');
            return;
        }

        setDeleteLoading(true);
        try {
            const userId = apiService.getUserIdFromToken();
            if (!userId) {
                setDeleteError('User not found');
                return;
            }

            const response = await apiService.deleteAccount(userId);
            if (response.success) {
                // Clear local storage and redirect to login
                localStorage.removeItem('token');
                navigate('/login');
            } else {
                setDeleteError(response.message || 'Failed to delete account');
            }
        } catch (error: any) {
            setDeleteError(error.response?.data?.message || 'Failed to delete account');
        } finally {
            setDeleteLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-4xl mx-auto px-4 py-6">
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
                            <p className="text-gray-600">Manage your account security and preferences</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-8">
                {/* Tab Navigation */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
                    <div className="border-b border-gray-200">
                        <nav className="flex space-x-8 px-6">
                            <button
                                onClick={() => setActiveTab('password')}
                                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'password'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                Change Password
                            </button>
                            <button
                                onClick={() => setActiveTab('delete')}
                                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'delete'
                                    ? 'border-red-500 text-red-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                Delete Account
                            </button>
                        </nav>
                    </div>

                    <div className="p-6">
                        {/* Change Password Tab */}
                        {activeTab === 'password' && (
                            <div>
                                <div className="mb-6">
                                    <h2 className="text-lg font-semibold text-gray-900 mb-2">Change Password</h2>
                                    <p className="text-gray-600">Update your password to keep your account secure.</p>
                                </div>

                                <form onSubmit={handleChangePassword} className="space-y-6">
                                    <div>
                                        <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
                                            Current Password
                                        </label>
                                        <input
                                            type="password"
                                            id="currentPassword"
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="Enter your current password"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                                            New Password
                                        </label>
                                        <input
                                            type="password"
                                            id="newPassword"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="Enter your new password"
                                            required
                                        />
                                        <p className="mt-1 text-xs text-gray-500">Password must be at least 8 characters long</p>
                                    </div>

                                    <div>
                                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                                            Confirm New Password
                                        </label>
                                        <input
                                            type="password"
                                            id="confirmPassword"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="Confirm your new password"
                                            required
                                        />
                                    </div>

                                    {passwordError && (
                                        <div className="bg-red-50 border border-red-200 rounded-md p-4">
                                            <div className="flex">
                                                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <div className="ml-3">
                                                    <p className="text-sm text-red-800">{passwordError}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {passwordSuccess && (
                                        <div className="bg-green-50 border border-green-200 rounded-md p-4">
                                            <div className="flex">
                                                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <div className="ml-3">
                                                    <p className="text-sm text-green-800">{passwordSuccess}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex justify-end">
                                        <button
                                            type="submit"
                                            disabled={passwordLoading}
                                            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            {passwordLoading ? 'Changing...' : 'Change Password'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* Delete Account Tab */}
                        {activeTab === 'delete' && (
                            <div>
                                <div className="mb-6">
                                    <h2 className="text-lg font-semibold text-gray-900 mb-2">Delete Account</h2>
                                    <p className="text-gray-600">Permanently delete your account and all associated data.</p>
                                </div>

                                {!showDeleteConfirm ? (
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                                        <div className="flex items-start">
                                            <svg className="w-6 h-6 text-red-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
                                            </svg>
                                            <div className="ml-3">
                                                <h3 className="text-lg font-medium text-red-800">Warning</h3>
                                                <div className="mt-2 text-sm text-red-700">
                                                    <p>This action cannot be undone. This will permanently delete your account and remove all data from our servers.</p>
                                                    <ul className="mt-2 list-disc list-inside space-y-1">
                                                        <li>Your profile and personal information</li>
                                                        <li>All your teams and team memberships</li>
                                                        <li>All your messages and chat history</li>
                                                        <li>All your game preferences and statistics</li>
                                                    </ul>
                                                </div>
                                                <div className="mt-4">
                                                    <button
                                                        onClick={() => setShowDeleteConfirm(true)}
                                                        className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
                                                    >
                                                        Delete My Account
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                                        <div className="flex items-start">
                                            <svg className="w-6 h-6 text-red-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
                                            </svg>
                                            <div className="ml-3 flex-1">
                                                <h3 className="text-lg font-medium text-red-800">Are you absolutely sure?</h3>
                                                <div className="mt-2 text-sm text-red-700">
                                                    <p>This action cannot be undone. Please type <strong>DELETE</strong> to confirm.</p>
                                                </div>

                                                <div className="mt-4">
                                                    <input
                                                        type="text"
                                                        value={confirmText}
                                                        onChange={(e) => setConfirmText(e.target.value)}
                                                        placeholder="Type DELETE to confirm"
                                                        className="w-full px-3 py-2 border border-red-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                                                    />
                                                </div>

                                                {deleteError && (
                                                    <div className="mt-4 bg-red-100 border border-red-300 rounded-md p-3">
                                                        <p className="text-sm text-red-800">{deleteError}</p>
                                                    </div>
                                                )}

                                                <div className="mt-6 flex space-x-3">
                                                    <button
                                                        onClick={handleDeleteAccount}
                                                        disabled={deleteLoading || confirmText !== 'DELETE'}
                                                        className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                    >
                                                        {deleteLoading ? 'Deleting...' : 'Yes, Delete My Account'}
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setShowDeleteConfirm(false);
                                                            setConfirmText('');
                                                            setDeleteError('');
                                                        }}
                                                        className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AccountSettingsPage;
