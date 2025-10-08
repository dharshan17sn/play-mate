import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiService, type Game } from '../services/api';

interface TournamentFormData {
  title: string;
  description: string;
  gameId: string;
  photo: string;
  startDate: string;
  location: string;
  noOfPlayersPerTeam: string;
}

const TournamentEditPage: React.FC = () => {
  const navigate = useNavigate();
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const [games, setGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingTournament, setIsLoadingTournament] = useState(true);
  const [error, setError] = useState<string>('');
  const [formData, setFormData] = useState<TournamentFormData>({
    title: '',
    description: '',
    gameId: '',
    photo: '',
    startDate: '',
    location: '',
    noOfPlayersPerTeam: ''
  });

  useEffect(() => {
    loadGames();
    if (tournamentId) {
      loadTournament();
    }
  }, [tournamentId]);

  const loadGames = async () => {
    try {
      const gamesData = await apiService.getGames();
      setGames(gamesData);
    } catch (err: any) {
      console.error('Failed to load games:', err);
    }
  };

  const loadTournament = async () => {
    if (!tournamentId) return;
    
    try {
      setIsLoadingTournament(true);
      const response = await apiService.getTournamentById(tournamentId);
      const tournament = response.data;
      
      // Convert ISO date to datetime-local format
      const startDate = new Date(tournament.startDate);
      const localDate = new Date(startDate.getTime() - startDate.getTimezoneOffset() * 60000);
      const formattedDate = localDate.toISOString().slice(0, 16);
      
      setFormData({
        title: tournament.title || '',
        description: tournament.description || '',
        gameId: tournament.gameId || tournament.game?.name || '',
        photo: tournament.photo || '',
        startDate: formattedDate,
        location: tournament.location || '',
        noOfPlayersPerTeam: tournament.noOfPlayersPerTeam?.toString() || ''
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load tournament');
    } finally {
      setIsLoadingTournament(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!tournamentId) {
      setError('Tournament ID is missing');
      return;
    }
    
    if (!formData.title.trim()) {
      setError('Tournament title is required');
      return;
    }
    
    // Game selection is disabled in edit mode, so no validation needed
    
    if (!formData.startDate) {
      setError('Start date is required');
      return;
    }
    
    if (!formData.location.trim()) {
      setError('Location is required');
      return;
    }

    if (!formData.noOfPlayersPerTeam || parseInt(formData.noOfPlayersPerTeam) < 1) {
      setError('Number of players per team is required and must be at least 1');
      return;
    }

    // Validate date is in the future
    const selectedDate = new Date(formData.startDate);
    const now = new Date();
    if (selectedDate <= now) {
      setError('Start date must be in the future');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      
      // Convert datetime-local to ISO string
      const isoStartDate = new Date(formData.startDate).toISOString();
      
      await apiService.updateTournament(tournamentId, {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        photo: formData.photo.trim() || undefined,
        startDate: isoStartDate,
        location: formData.location.trim(),
        noOfPlayersPerTeam: parseInt(formData.noOfPlayersPerTeam)
      });
      
      navigate(`/tournaments/${tournamentId}`);
    } catch (err: any) {
      setError(err.message || 'Failed to update tournament');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (tournamentId) {
      navigate(`/tournaments/${tournamentId}`);
    } else {
      navigate('/tournaments');
    }
  };

  // Get minimum date (today)
  const getMinDate = () => {
    const today = new Date();
    today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
    return today.toISOString().slice(0, 16);
  };

  if (isLoadingTournament) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Header */}
      <header className="hidden md:block bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <h1 className="text-2xl font-bold text-gray-900">PlayMate</h1>
              <nav className="hidden md:flex items-center space-x-6">
                <button onClick={() => navigate('/dashboard')} className="text-gray-700 hover:text-blue-600 font-medium">Home</button>
                <button onClick={() => navigate('/chat')} className="text-gray-700 hover:text-blue-600 font-medium">Chats</button>
                <button onClick={() => navigate('/tournaments')} className="text-blue-600 font-medium">Tournaments</button>
              </nav>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/profile-creation')}
                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full"
                title="Account"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Header */}
      <header className="md:hidden bg-white shadow sticky top-0 z-20">
        <div className="px-4">
          <div className="flex items-center justify-between h-14">
            <button
              onClick={handleCancel}
              className="flex items-center text-gray-600 hover:text-blue-600"
            >
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <h1 className="text-lg font-bold text-gray-900">Edit Tournament</h1>
            <div className="w-16"></div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto py-6 sm:px-6 lg:px-8 pb-20 md:pb-6">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900">
              Edit <span className="text-blue-600">Tournament</span>
            </h2>
            <p className="mt-2 text-gray-600">Update your tournament details</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-600">{error}</p>
              </div>
            )}

            <div className="bg-white shadow rounded-lg p-6 space-y-6">
              {/* Tournament Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Tournament Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Enter tournament title"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Game Selection - Read Only */}
              <div>
                <label htmlFor="gameId" className="block text-sm font-medium text-gray-700 mb-2">
                  Game
                </label>
                <select
                  id="gameId"
                  name="gameId"
                  value={formData.gameId}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                >
                  <option value="">Select a game</option>
                  {games.map((game) => (
                    <option key={game.id} value={game.id}>
                      {game.name}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">Game cannot be changed after tournament creation</p>
              </div>

              {/* Number of Players per Team */}
              <div>
                <label htmlFor="noOfPlayersPerTeam" className="block text-sm font-medium text-gray-700 mb-2">
                  Players per Team <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="noOfPlayersPerTeam"
                  name="noOfPlayersPerTeam"
                  value={formData.noOfPlayersPerTeam}
                  onChange={handleInputChange}
                  placeholder="e.g., 5"
                  min="1"
                  max="50"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <p className="mt-1 text-xs text-gray-500">Maximum number of players per team</p>
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe your tournament (optional)"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Start Date */}
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date & Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  id="startDate"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  min={getMinDate()}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Location */}
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                  Location <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="e.g., Online, New York, etc."
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Photo Upload */}
              <div>
                <label htmlFor="photo" className="block text-sm font-medium text-gray-700 mb-2">
                  Tournament Photo
                </label>
                <input
                  type="file"
                  id="photo"
                  name="photo"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = () => {
                      const dataUrl = String(reader.result || '');
                      setFormData(prev => ({ ...prev, photo: dataUrl }));
                    };
                    reader.readAsDataURL(file);
                  }}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                <p className="mt-1 text-xs text-gray-500">Optional: Upload a tournament image (JPG, PNG)</p>
              </div>

              {/* Preview */}
              {formData.photo && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Photo Preview</label>
                  <div className="w-32 h-32 border border-gray-300 rounded-lg overflow-hidden">
                    <img
                      src={formData.photo}
                      alt="Tournament preview"
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
              <button
                type="button"
                onClick={handleCancel}
                className="w-full sm:w-auto px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Updating...' : 'Update Tournament'}
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 z-20">
        <div className="flex justify-around items-center h-14">
          <button onClick={() => navigate('/chat')} className="flex flex-col items-center text-gray-600 hover:text-blue-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4-.8L3 20l.8-3.2A8.96 8.96 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span className="text-xs">Chats</span>
          </button>
          <button onClick={() => navigate('/dashboard')} className="flex flex-col items-center text-gray-600 hover:text-blue-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M13 5v6a2 2 0 002 2h3m-9 4h6m-6 0a2 2 0 01-2-2v-3m8 5a2 2 0 002-2v-3m0 0l2-2m-2 2l-2 2" />
            </svg>
            <span className="text-xs">Home</span>
          </button>
          <button onClick={() => navigate('/tournaments')} className="-mt-6 bg-blue-600 text-white rounded-full p-4 shadow-lg">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default TournamentEditPage;
