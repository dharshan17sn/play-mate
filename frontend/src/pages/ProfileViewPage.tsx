import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiService } from '../services/api';

const ProfileViewPage: React.FC = () => {
  const navigate = useNavigate();
  const { userId } = useParams<{ userId: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    (async () => {
      try {
        setIsLoading(true);
        setError('');
        if (!userId) throw new Error('Missing userId');
        const data = await apiService.getUserById(userId);
        setUser(data);
      } catch (e: any) {
        setError(e.message || 'Failed to load user');
      } finally {
        setIsLoading(false);
      }
    })();
  }, [userId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto p-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-red-600">{error || 'User not found'}</p>
            <button onClick={() => navigate(-1)} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg">Go Back</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="p-2 bg-white rounded-full border border-gray-200 hover:bg-gray-50" title="Go Back">
            <svg className="w-5 h-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-gray-900">Profile</h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 sm:p-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden">
              {user.photo ? (
                <img src={user.photo} alt={user.displayName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-600 font-semibold text-xl">
                  {user.displayName?.[0]?.toUpperCase() || '?'}
                </div>
              )}
            </div>
            <div>
              <div className="text-xl font-semibold text-gray-900">{user.displayName}</div>
              <div className="text-sm text-gray-500">{user.email}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Basic Info</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Name</span><span className="text-gray-900">{user.displayName || '-'}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Gender</span><span className="text-gray-900">{user.gender || '-'}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Location</span><span className="text-gray-900">{user.location || '-'}</span></div>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Preferences</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Preferred Days</span><span className="text-gray-900">{Array.isArray(user.preferredDays) && user.preferredDays.length ? user.preferredDays.join(', ') : '-'}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Preferred Time</span><span className="text-gray-900">{Array.isArray(user.timeRange) && user.timeRange.length ? user.timeRange.join(' - ') : '-'}</span></div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProfileViewPage;


