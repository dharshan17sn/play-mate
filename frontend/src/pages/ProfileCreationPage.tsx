import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';

interface UserProfile {
  user_id: string;
  email: string;
  displayName: string;
  photo?: string;
  gender?: string;
  location?: string;
  preferredGames: string[];
  preferredDays: string[];
  timeRange?: string[];
}

interface Game {
  id: string;
  name: string;
}

export default function ProfileCreationPage() {
  const navigate = useNavigate();
  const [loading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [availableGames, setAvailableGames] = useState<Game[]>([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [formData, setFormData] = useState({
    displayName: '',
    photo: '',
    gender: '',
    location: '',
    preferredGames: [] as string[],
    preferredDays: [] as string[],
    timeRange: [] as string[],
  });

  const hasPreferredDays = formData.preferredDays && formData.preferredDays.length > 0;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setFetching(true);
        setError('');

        // Fetch user profile
        const profileResponse = await apiService.getProfile();
        console.log('Profile response:', profileResponse);
        if (profileResponse.success && profileResponse.data) {
          const profileData = profileResponse.data;
          console.log('Profile data:', profileData);
          setUserProfile(profileData);
          // Pre-fill form with existing data
          setFormData({
            displayName: profileData.displayName || '',
            photo: profileData.photo || '',
            gender: profileData.gender || '',
            location: profileData.location || '',
            preferredGames: profileData.preferredGames?.map((pg: any) => pg.gameName) || [],
            preferredDays: profileData.preferredDays || [],
            timeRange: profileData.timeRange || [],
          });

          // If displayName is a timestamp, show a message to the user
          if (profileData.displayName && /^\d{4}-\d{12}$/.test(profileData.displayName)) {
            setError('Your display name appears to be incorrect. Please enter your actual name below.');
          }
        }

        // Fetch available games
        try {
          const gamesResponse = await apiService.getGames();
          console.log('Games response:', gamesResponse);
          setAvailableGames(Array.isArray(gamesResponse) ? gamesResponse : []);
        } catch (gamesError: any) {
          console.error('Error fetching games:', gamesError);
          setAvailableGames([]);
        }
      } catch (error: any) {
        console.error('Error fetching data:', error);
        setError('Failed to load profile: ' + error.message);
      } finally {
        setFetching(false);
      }
    };

    fetchData();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      preferredDays: checked
        ? [...prev.preferredDays, value]
        : prev.preferredDays.filter(day => day !== value)
    }));
  };

  useEffect(() => {
    // If preferred days become empty, clear any selected time ranges
    if (!hasPreferredDays && formData.timeRange.length > 0) {
      setFormData(prev => ({ ...prev, timeRange: [] }));
    }
  }, [hasPreferredDays]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // For now, we'll just store the file name
      // In a real app, you'd upload to a server and get a URL
      setFormData(prev => ({
        ...prev,
        photo: file.name
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log('=== FRONTEND SUBMISSION START ===');
    console.log('Form data before processing:', formData);

    // Create submit data with only filled fields
    const submitData: any = {};

    if (formData.displayName) submitData.displayName = formData.displayName;
    if (formData.photo) submitData.photo = formData.photo;
    if (formData.gender) submitData.gender = formData.gender;
    if (formData.location) submitData.location = formData.location;
    if (formData.preferredDays && formData.preferredDays.length > 0) {
      console.log('Adding preferredDays:', formData.preferredDays);
      submitData.preferredDays = formData.preferredDays;
    }
    if (formData.timeRange && formData.timeRange.length > 0 && formData.preferredDays && formData.preferredDays.length > 0) {
      console.log('Adding timeRange:', formData.timeRange);
      submitData.timeRange = formData.timeRange;
    }
    if (formData.preferredGames && formData.preferredGames.length > 0) {
      console.log('Adding preferredGames:', formData.preferredGames);
      submitData.preferredGames = formData.preferredGames;
    }

    console.log('Final submitData object:', submitData);
    console.log('SubmitData keys:', Object.keys(submitData));
    console.log('SubmitData JSON:', JSON.stringify(submitData, null, 2));
    console.log('=== FRONTEND SUBMISSION END ===');

    try {
      const response = await apiService.updateProfile(submitData);
      console.log('Profile update successful:', response);

      // Show success message
      setSuccess('Profile updated successfully!');
      setError(''); // Clear any previous errors

      // Close modal and clear success message after 3 seconds
      setTimeout(() => {
        setSuccess('');
        setShowEditModal(false);
      }, 3000);

      // Handle success (e.g., show success message, redirect)
    } catch (error) {
      console.error('Profile update error:', error);
      setError(error instanceof Error ? error.message : 'Failed to update profile');
      setSuccess(''); // Clear any previous success messages
      // Handle error (e.g., show error message)
    }
  };

  if (fetching) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto py-8 px-4">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header with Edit Icon */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-8 relative">
            <button
              onClick={() => setShowEditModal(true)}
              className="absolute top-4 right-4 p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full transition-all duration-200"
              title="Edit Profile"
            >
              <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>

            {/* Profile Layout - Username and Photo on Left, Info on Center */}
            <div className="flex items-center space-x-6">
              {/* Left Side - Username and Profile Photo */}
              <div className="flex flex-col items-center">
                <div className="flex items-center space-x-3 mb-4">
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full transition-all duration-200"
                    title="Go Back"
                  >
                    <svg className="w-5 h-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <h1 className="text-3xl font-bold text-white">
                    {userProfile?.user_id || 'Username'}
                  </h1>
                </div>

                {/* Profile Photo */}
                <div className="relative">
                  {formData.photo ? (
                    <div className="w-28 h-28 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border-4 border-white shadow-lg">
                      <span className="text-gray-500 text-sm">Photo</span>
                    </div>
                  ) : (
                    <div className="w-28 h-28 rounded-full bg-white bg-opacity-30 flex items-center justify-center border-4 border-white shadow-lg">
                      <svg className="w-16 h-16 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>

              {/* Center - Display Name, Gender, Location */}
              <div className="flex-1 text-center">
                {/* Display Name */}
                <h2 className="text-2xl font-semibold text-white mb-3">
                  {formData.displayName || userProfile?.displayName || 'Display Name'}
                </h2>

                {/* Gender */}
                <p className="text-blue-100 text-lg mb-2">
                  {formData.gender || userProfile?.gender || 'Gender not specified'}
                </p>

                {/* Location */}
                <p className="text-blue-100 text-lg">
                  📍 {formData.location || userProfile?.location || 'Location not specified'}
                </p>
              </div>
            </div>
          </div>

          {/* Profile Actions */}
          <div className="px-6 py-4 bg-white">
            <div className="space-y-3">
              <button
                onClick={() => navigate('/account-settings')}
                className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <span className="text-gray-700 font-medium">Account Info</span>
                </div>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              <button
                onClick={() => {
                  // Handle logout
                  localStorage.removeItem('token');
                  navigate('/login');
                }}
                className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </div>
                  <span className="text-gray-700 font-medium">Logout</span>
                </div>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              <button
                onClick={() => {
                  // Handle help center - you can navigate to a help page or show a modal
                  alert('Help Center - Coming Soon!');
                }}
                className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="text-gray-700 font-medium">Help Center</span>
                </div>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Edit Profile Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-white flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Update Profile</h3>
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-full"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="p-6">
                <form className="space-y-6" onSubmit={handleSubmit}>
                  {/* Success Alert */}
                  {success && (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-green-800">{success}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Error Alert */}
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-red-800">{error}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Photo Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Profile Photo
                    </label>
                    <div className="flex items-center space-x-4">
                      <div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoUpload}
                          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          Upload a profile photo (JPG, PNG, GIF) - Preview shown above
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Display Name */}
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
                        value={formData.displayName}
                        onChange={handleInputChange}
                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="Enter your display name"
                      />
                    </div>
                  </div>

                  {/* Gender */}
                  <div>
                    <label htmlFor="gender" className="block text-sm font-medium text-gray-700">
                      Gender
                    </label>
                    <div className="mt-1">
                      <select
                        id="gender"
                        name="gender"
                        value={formData.gender}
                        onChange={handleInputChange}
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

                  {/* Location */}
                  <div>
                    <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                      Location
                    </label>
                    <div className="mt-1">
                      <input
                        id="location"
                        name="location"
                        type="text"
                        value={formData.location}
                        onChange={handleInputChange}
                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="Enter your location"
                      />
                    </div>
                  </div>

                  {/* Preferred Games */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Preferred Games
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {Array.isArray(availableGames) && availableGames.length > 0 ? (
                        availableGames.map((game) => (
                          <label key={game.name} className="flex items-center">
                            <input
                              type="checkbox"
                              value={game.name}
                              checked={formData.preferredGames.includes(game.name)}
                              onChange={(e) => {
                                const { value, checked } = e.target;
                                setFormData(prev => ({
                                  ...prev,
                                  preferredGames: checked
                                    ? [...prev.preferredGames, value]
                                    : prev.preferredGames.filter(g => g !== value)
                                }));
                              }}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <span className="ml-2 text-sm text-gray-700">{game.name}</span>
                          </label>
                        ))
                      ) : (
                        <div className="col-span-2 text-sm text-gray-500">
                          {fetching ? 'Loading games...' : 'No games available'}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Preferred Days */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Preferred Days
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'].map((day) => (
                        <label key={day} className="flex items-center">
                          <input
                            type="checkbox"
                            value={day}
                            checked={formData.preferredDays.includes(day)}
                            onChange={handleCheckboxChange}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <span className="ml-2 text-sm text-gray-700">{day.charAt(0) + day.slice(1).toLowerCase()}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Preferred Time Range */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Preferred Time Ranges
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        '06:00-10:00',
                        '10:00-14:00',
                        '14:00-18:00',
                        '18:00-22:00',
                        '22:00-02:00',
                        '02:00-06:00'
                      ].map((timeRange) => (
                        <label key={timeRange} className="flex items-center">
                          <input
                            type="checkbox"
                            value={timeRange}
                            checked={formData.timeRange.includes(timeRange)}
                            onChange={(e) => {
                              const { value, checked } = e.target;
                              setFormData(prev => ({
                                ...prev,
                                timeRange: checked
                                  ? [...prev.timeRange, value]
                                  : prev.timeRange.filter(t => t !== value)
                              }));
                            }}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={!hasPreferredDays}
                          />
                          <span className="ml-2 text-sm text-gray-700">{timeRange}</span>
                        </label>
                      ))}
                    </div>
                    {!hasPreferredDays && (
                      <p className="mt-1 text-xs text-gray-500">Select at least one preferred day to choose time ranges.</p>
                    )}
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Updating profile...' : 'Update Profile'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
