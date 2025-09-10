import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';

interface Tournament {
  id: string;
  title: string;
  description?: string;
  photo?: string;
  startDate: string;
  location: string;
  noOfPlayersPerTeam?: number;
  game: {
    name: string;
  };
  creator: {
    user_id: string;
    displayName: string;
    photo?: string;
  };
  teams?: Array<{
    id: string;
    title: string;
  }>;
}

const TournamentPage: React.FC = () => {
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    loadTournaments();
    // Get current user ID for edit button visibility
    const userId = apiService.getUserIdFromToken();
    setCurrentUserId(userId);
  }, []);

  const loadTournaments = async () => {
    try {
      setIsLoading(true);
      setError('');
      const response = await apiService.getTournaments();
      setTournaments(response.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load tournaments');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTournament = () => {
    navigate('/tournaments/create');
  };

  const handleTournamentClick = (tournamentId: string) => {
    navigate(`/tournaments/${tournamentId}`);
  };

  const handleEditTournament = (e: React.MouseEvent, tournamentId: string) => {
    e.stopPropagation(); // Prevent triggering the card click
    navigate(`/tournaments/${tournamentId}/edit`);
  };

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
                onClick={handleCreateTournament}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Tournament
              </button>
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
            <h1 className="text-lg font-bold text-gray-900">Tournaments</h1>
            <button
              onClick={handleCreateTournament}
              className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-blue-700 transition-colors"
            >
              Create
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 pb-20 md:pb-6">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900">
              Active <span className="text-blue-600">Tournaments</span>
            </h2>
            <p className="mt-2 text-gray-600">Join tournaments and compete with other players</p>
          </div>

          {isLoading && (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {!isLoading && !error && (
            <div className="space-y-4">
              {tournaments.length === 0 ? (
                <div className="text-center py-12">
                  <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No tournaments yet</h3>
                  <p className="text-gray-600 mb-4">Be the first to create a tournament!</p>
                  <button
                    onClick={handleCreateTournament}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Create Tournament
                  </button>
                </div>
              ) : (
                tournaments.map((tournament) => (
                  <TournamentListItem
                    key={tournament.id}
                    tournament={tournament}
                    currentUserId={currentUserId}
                    onClick={() => handleTournamentClick(tournament.id)}
                    onEdit={(e) => handleEditTournament(e, tournament.id)}
                  />
                ))
              )}
            </div>
          )}
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

// Tournament List Item Component
const TournamentListItem: React.FC<{ 
  tournament: Tournament; 
  currentUserId: string | null;
  onClick: () => void;
  onEdit: (e: React.MouseEvent) => void;
}> = ({ tournament, currentUserId, onClick, onEdit }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow duration-200 cursor-pointer overflow-hidden"
    >
      <div className="flex">
        {/* Tournament Photo */}
        <div className="w-24 h-24 md:w-32 md:h-32 bg-gray-200 flex-shrink-0">
          {tournament.photo ? (
            <img
              src={tournament.photo}
              alt={tournament.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-blue-600">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          )}
        </div>

        {/* Tournament Details */}
        <div className="flex-1 p-4">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-lg font-semibold text-gray-900 truncate">{tournament.title}</h3>
            <span className="text-sm text-gray-500 ml-2 flex-shrink-0">
              {tournament.teams?.length || 0} teams
            </span>
          </div>
          
          <div className="space-y-1 text-sm text-gray-600">
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 0h10m-10 0a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V6a2 2 0 00-2-2" />
              </svg>
              <span className="font-medium">{tournament.game.name}</span>
            </div>
            
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0V6a2 2 0 012-2h2a2 2 0 012 2v1m-6 0h6m-6 0l-2 2m8-2l2 2m-2-2v6a2 2 0 01-2 2H8a2 2 0 01-2-2v-6m8 0H8" />
              </svg>
              <span>{formatDate(tournament.startDate)}</span>
            </div>
            
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>{tournament.location}</span>
            </div>
            
            {tournament.noOfPlayersPerTeam && (
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span>{tournament.noOfPlayersPerTeam} players per team</span>
              </div>
            )}
          </div>

          {tournament.description && (
            <p className="mt-2 text-sm text-gray-500 line-clamp-2">{tournament.description}</p>
          )}

          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center text-xs text-gray-500">
              <div className="w-6 h-6 rounded-full bg-gray-200 overflow-hidden mr-2">
                {tournament.creator.photo ? (
                  <img
                    src={tournament.creator.photo}
                    alt={tournament.creator.displayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="w-full h-full flex items-center justify-center text-gray-600 font-semibold">
                    {tournament.creator.displayName?.[0]?.toUpperCase() || '?'}
                  </span>
                )}
              </div>
              <span>Created by {tournament.creator.displayName}</span>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Edit button - only show for tournament creator */}
              {currentUserId === tournament.creator.user_id && (
                <button
                  onClick={onEdit}
                  className="flex items-center text-green-600 hover:text-green-700 text-sm font-medium transition-colors"
                  title="Edit tournament"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit
                </button>
              )}
              
              <div className="flex items-center text-blue-600 text-sm font-medium">
                <span>View Details</span>
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TournamentPage;
