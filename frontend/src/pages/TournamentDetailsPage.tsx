import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
    photo?: string;
    members?: Array<{
      id: string;
      user: {
        user_id: string;
        displayName: string;
        photo?: string;
      };
    }>;
  }>;
}

const TournamentDetailsPage: React.FC = () => {
  const navigate = useNavigate();
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'completed' | 'pending'>('completed');
  const [showTeamRegistrationModal, setShowTeamRegistrationModal] = useState(false);
  const [userTeams, setUserTeams] = useState<any[]>([]);
  const [isLoadingTeams, setIsLoadingTeams] = useState(false);
  const [registrationType, setRegistrationType] = useState<'individual' | 'team'>('individual');
  const [showPendingConfirmation, setShowPendingConfirmation] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<any>(null);
  const [requestedTeamIds, setRequestedTeamIds] = useState<Set<string>>(new Set());
  const [expandedTeamIds, setExpandedTeamIds] = useState<Set<string>>(new Set());
  const [teamMembersById, setTeamMembersById] = useState<Record<string, any[]>>({});
  const [pendingRequestedTeamIds, setPendingRequestedTeamIds] = useState<Set<string>>(new Set());
  const [isCreatingIndividual, setIsCreatingIndividual] = useState(false);
  const [soloTeamTitle, setSoloTeamTitle] = useState('');
  const [teamDetailsById, setTeamDetailsById] = useState<Record<string, any>>({});

  // Download functions for tournament creator
  const downloadTeamsData = (format: 'csv' | 'excel') => {
    if (!tournament?.teams) return;

    const completedTeams = tournament.teams.filter(team => {
      const memberCount = getTeamMemberCount(team);
      return memberCount >= (tournament.noOfPlayersPerTeam || 1);
    });

    if (completedTeams.length === 0) {
      alert('No completed teams found to download.');
      return;
    }

    // Prepare data
    const maxPlayers = Math.max(...completedTeams.map(team => getTeamMemberCount(team)));
    const headers = ['Team Name', ...Array.from({ length: maxPlayers }, (_, i) => `Player ${i + 1}`)];
    
    const rows = completedTeams.map(team => {
      const row = [team.title];
      const members = team.members || [];
      
      // Add player names
      for (let i = 0; i < maxPlayers; i++) {
        const member = members[i];
        const playerName = member?.user?.displayName || (member as any)?.displayName || '';
        row.push(playerName);
      }
      
      return row;
    });

    if (format === 'csv') {
      downloadCSV(headers, rows, `${tournament.title}_teams.csv`);
    } else {
      downloadExcel(headers, rows, `${tournament.title}_teams.xlsx`);
    }
  };

  const downloadCSV = (headers: string[], rows: string[][], filename: string) => {
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadExcel = (headers: string[], rows: string[][], filename: string) => {
    // For now, we'll create a CSV file with .xlsx extension
    // In a real implementation, you'd use a library like xlsx
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join('\t'))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Safely derive team member count across different API shapes
  const getTeamMemberCount = (team: any): number => {
    const members = team?.members;
    if (Array.isArray(members)) return members.length;
    if (typeof members === 'number') return members;
    return (
      team?.membersCount ??
      team?.memberCount ??
      team?.playersCount ??
      team?.playerCount ??
      0
    );
  };

  const isUserMemberOfTeam = (team: any): boolean => {
    if (!currentUserId) return false;
    const members = Array.isArray(team?.members) ? team.members : [];
    return members.some((m: any) => m?.user?.user_id === currentUserId || m?.userId === currentUserId);
  };

  const handleRequestToJoin = async (teamId: string) => {
    try {
      await apiService.requestToJoinTeam(teamId);
      setRequestedTeamIds(prev => new Set([...Array.from(prev), teamId]));
      setPendingRequestedTeamIds(prev => new Set([...Array.from(prev), teamId]));
    } catch (err: any) {
      setError(err.message || 'Failed to send join request');
    }
  };

  const toggleTeamExpanded = async (teamId: string) => {
    setExpandedTeamIds(prev => {
      const next = new Set(prev);
      if (next.has(teamId)) next.delete(teamId); else next.add(teamId);
      return next;
    });
    // Lazy-load members if not cached
    if (!teamMembersById[teamId]) {
      try {
        const res = await apiService.getTeamMembers(teamId);
        const data = (res as any)?.data;
        const membersArray = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : Array.isArray(data?.members) ? data.members : [];
        setTeamMembersById(prev => ({ ...prev, [teamId]: membersArray }));
      } catch (e: any) {
        // Keep UI functional even if fetch fails
      }
    }
    // Lazy-load team details (creatorId, admin flags) if not cached
    if (!teamDetailsById[teamId]) {
      try {
        const res = await apiService.getTeamById(teamId);
        const data = (res as any)?.data ?? res;
        setTeamDetailsById(prev => ({ ...prev, [teamId]: data }));
      } catch (e: any) {
        // ignore
      }
    }
  };

  useEffect(() => {
    if (tournamentId) {
      loadTournament();
    }
    // Get current user ID for edit button visibility
    const userId = apiService.getUserIdFromToken();
    setCurrentUserId(userId);
    // Load user's sent team join requests to hide Request for already pending
    (async () => {
      try {
        const sent = await apiService.listInvitations('sent');
        const items = (sent as any)?.data as any[];
        if (Array.isArray(items)) {
          const pendingTeamIds = items
            .filter((inv: any) => inv?.status === 'PENDING')
            .map((inv: any) => inv.teamId)
            .filter(Boolean);
          setPendingRequestedTeamIds(new Set(pendingTeamIds));
        }
      } catch {}
    })();
  }, [tournamentId]);

  const loadTournament = async () => {
    try {
      setIsLoading(true);
      setError('');
      const response = await apiService.getTournamentById(tournamentId!);
      const raw = response.data as any;
      // Normalize teams: backend returns TournamentTeam with nested team
      const normalizedTeams = Array.isArray(raw?.teams)
        ? raw.teams.map((tt: any) => {
            const nested = tt?.team || tt;
            // Prefer nested members if present
            const members = Array.isArray(nested?.members)
              ? nested.members
              : Array.isArray(tt?.members)
              ? tt.members
              : undefined;
            return {
              id: nested?.id ?? tt?.id,
              title: nested?.title ?? tt?.title,
              photo: nested?.photo ?? tt?.photo,
              members,
            };
          })
        : [];

      setTournament({ ...raw, teams: normalizedTeams });
    } catch (err: any) {
      setError(err.message || 'Failed to load tournament');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/tournaments');
  };

  const loadUserTeams = async () => {
    try {
      setIsLoadingTeams(true);
      const teams = await apiService.getMyTeams();
      // Enrich teams with member counts if not present
      const enrichedTeams = await Promise.all(
        (teams || []).map(async (team: any) => {
          const currentCount = getTeamMemberCount(team);
          if (currentCount > 0) return team;
          try {
            const res = await apiService.getTeamMembers(team.id);
            const data = (res as any)?.data;
            let membersArray: any[] | undefined;
            if (Array.isArray(data)) {
              membersArray = data;
            } else if (Array.isArray(data?.members)) {
              membersArray = data.members;
            } else if (Array.isArray(data?.data)) {
              membersArray = data.data;
            }
            if (Array.isArray(membersArray)) {
              return { ...team, members: membersArray };
            }
            const computedCount = (
              data?.membersCount ?? data?.memberCount ?? data?.playersCount ?? data?.playerCount ?? 0
            );
            return { ...team, membersCount: computedCount };
          } catch (e) {
            return team;
          }
        })
      );
      setUserTeams(enrichedTeams);
    } catch (err: any) {
      console.error('Failed to load user teams:', err);
      setError('Failed to load your teams');
    } finally {
      setIsLoadingTeams(false);
    }
  };

  const handleRegisterTeam = () => {
    loadUserTeams();
    setShowTeamRegistrationModal(true);
  };

  const handleEditTournament = () => {
    if (tournamentId) {
      navigate(`/tournaments/${tournamentId}/edit`);
    }
  };


  const handleTeamSelection = (team: any) => {
    const hasEnoughPlayers = getTeamMemberCount(team) >= (tournament?.noOfPlayersPerTeam || 1);
    
    if (hasEnoughPlayers) {
      // Direct registration
      handleTeamRegistration(team.id);
    } else {
      // Show pending confirmation
      setSelectedTeam(team);
      setShowPendingConfirmation(true);
    }
  };

  const handleTeamRegistration = async (teamId: string) => {
    if (!tournamentId) return;
    
    try {
      await apiService.registerTeamForTournament(tournamentId, teamId);
      setShowTeamRegistrationModal(false);
      setShowPendingConfirmation(false);
      setActiveTab('completed'); // Switch to completed tab to show registered team
      loadTournament();
    } catch (err: any) {
      setError(err.message || 'Failed to register team');
    }
  };

  const handlePendingRegistration = async () => {
    if (!selectedTeam || !tournamentId) return;
    
    try {
      await apiService.registerTeamForTournament(tournamentId, selectedTeam.id);
      setShowTeamRegistrationModal(false);
      setShowPendingConfirmation(false);
      setActiveTab('pending'); // Switch to pending tab to show pending team
      loadTournament();
    } catch (err: any) {
      setError(err.message || 'Failed to register team as pending');
    }
  };

  const handleIndividualRegistration = async () => {
    if (!tournamentId || !tournament) return;
    const requiredPlayers = tournament.noOfPlayersPerTeam || 1;
    try {
      setIsCreatingIndividual(true);
      const soloTitle = soloTeamTitle?.trim() || 'My Solo Team';
      const gameName = (tournament as any).gameId || (tournament as any).game?.name;
      if (!gameName) {
        setError('Tournament game is unavailable for individual registration');
        setIsCreatingIndividual(false);
        return;
      }
      const created = await apiService.createTeam({
        title: soloTitle,
        gameName,
        // Keep it discoverable so others can request to join
        isPublic: true,
        description: 'Auto-created for tournament registration'
      });
      const createdData: any = (created as any)?.data ?? created;
      const newTeamId: string = createdData?.id || createdData?.team?.id;
      if (!newTeamId) {
        throw new Error('Failed to create solo team');
      }
      // Register the solo team to this tournament so it appears under Pending teams
      await apiService.registerTeamForTournament(tournamentId, newTeamId);
      setShowTeamRegistrationModal(false);
      setShowPendingConfirmation(false);
      // Appear under Pending until team reaches required size (>1), else Completed
      setActiveTab(requiredPlayers > 1 ? 'pending' : 'completed');
      loadTournament();
    } catch (err: any) {
      setError(err?.message || 'Failed to register as individual');
    } finally {
      setIsCreatingIndividual(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !tournament) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-600">{error || 'Tournament not found'}</p>
              <button
                onClick={handleBack}
                className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Back to Tournaments
              </button>
            </div>
          </div>
        </div>
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
                onClick={handleBack}
                className="text-gray-600 hover:text-blue-600 font-medium"
              >
                ← Back to Tournaments
              </button>
              {/* Creator Actions - only show for tournament creator */}
              {currentUserId === tournament?.creator.user_id && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleEditTournament}
                    className="px-3 py-1 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-md font-medium"
                  >
                    Edit Tournament
                  </button>
                  <div className="relative group">
                    <button
                      className="px-3 py-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md font-medium"
                    >
                      Download Teams
                    </button>
                    {/* Download dropdown */}
                    <div className="absolute right-0 top-full mt-1 w-32 bg-white rounded-md shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                      <button
                        onClick={() => downloadTeamsData('csv')}
                        className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-t-md"
                      >
                        Download CSV
                      </button>
                      <button
                        onClick={() => downloadTeamsData('excel')}
                        className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-b-md"
                      >
                        Download Excel
                      </button>
                    </div>
                  </div>
                </div>
              )}
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
              onClick={handleBack}
              className="p-2 text-gray-600 hover:text-blue-600 rounded-full"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-lg font-bold text-gray-900 truncate">{tournament.title}</h1>
            {/* Creator Actions - only show for tournament creator */}
            {currentUserId === tournament.creator.user_id ? (
              <div className="flex items-center space-x-1">
                <button
                  onClick={handleEditTournament}
                  className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-full"
                  title="Edit tournament"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <div className="relative group">
                  <button
                    className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-full"
                    title="Download teams data"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </button>
                  {/* Download dropdown */}
                  <div className="absolute right-0 top-full mt-1 w-32 bg-white rounded-md shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <button
                      onClick={() => downloadTeamsData('csv')}
                      className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-t-md"
                    >
                      Download CSV
                    </button>
                    <button
                      onClick={() => downloadTeamsData('excel')}
                      className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-b-md"
                    >
                      Download Excel
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-10"></div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8 pb-20 md:pb-6">
        <div className="px-4 py-6 sm:px-0">
          {/* Tournament Header */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="h-48 bg-gradient-to-r from-blue-500 to-purple-600 relative">
              {tournament.photo && (
                <img
                  src={tournament.photo}
                  alt={tournament.title}
                  className="w-full h-full object-cover"
                />
              )}
              <div className="absolute inset-0 bg-black bg-opacity-30"></div>
              <div className="absolute bottom-4 left-4 text-white">
                <h1 className="text-2xl md:text-3xl font-bold">{tournament.title}</h1>
                <p className="text-lg opacity-90">{tournament.game.name}</p>
              </div>
            </div>

            <div className="p-6">
              {/* Tournament Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-4">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0V6a2 2 0 012-2h2a2 2 0 012 2v1m-6 0h6m-6 0l-2 2m8-2l2 2m-2-2v6a2 2 0 01-2 2H8a2 2 0 01-2-2v-6m8 0H8" />
                    </svg>
                    <div>
                      <p className="text-sm text-gray-500">Start Date</p>
                      <p className="font-medium">{formatDate(tournament.startDate)}</p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <div>
                      <p className="text-sm text-gray-500">Location</p>
                      <p className="font-medium">{tournament.location}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <div>
                      <p className="text-sm text-gray-500">Registered Teams</p>
                      <p className="font-medium">{tournament.teams?.length || 0} teams</p>
                    </div>
                  </div>

                  {tournament.noOfPlayersPerTeam && (
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                      </svg>
                      <div>
                        <p className="text-sm text-gray-500">Players per Team</p>
                        <p className="font-medium">{tournament.noOfPlayersPerTeam} players</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden mr-3">
                      {tournament.creator.photo ? (
                        <img
                          src={tournament.creator.photo}
                          alt={tournament.creator.displayName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="w-full h-full flex items-center justify-center text-gray-600 font-semibold text-sm">
                          {tournament.creator.displayName?.[0]?.toUpperCase() || '?'}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Created by</p>
                      <p className="font-medium">{tournament.creator.displayName}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              {tournament.description && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Description (Rules)</h3>
                  <p className="text-gray-600">{tournament.description}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-center">
                {/* Edit Button - only show for tournament creator */}
                {currentUserId === tournament.creator.user_id ? (
                  <button
                    onClick={handleEditTournament}
                    className="flex items-center bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit Tournament
                  </button>
                ) : (
                  /* Register Team Button - only show for non-creators */
                  <button
                    onClick={handleRegisterTeam}
                    className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  >
                    Register Team
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Registered Teams */}
          <div className="mt-6 bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Registered Teams</h3>
                
                {/* Tabs - Completed vs Pending */}
                <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setActiveTab('completed')}
                    className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                      activeTab === 'completed'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Completed
                  </button>
                  <button
                    onClick={() => setActiveTab('pending')}
                    className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                      activeTab === 'pending'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Pending
                  </button>
                </div>
              </div>
            </div>
            <div className="p-6">
              {!tournament.teams || tournament.teams.length === 0 ? (
                <div className="text-center py-12">
                  <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No registrations yet</h3>
                  <p className="text-gray-600 mb-4">Be the first to register a team for this tournament!</p>
                  {currentUserId !== tournament.creator.user_id && (
                    <button
                      onClick={handleRegisterTeam}
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Register Team
                    </button>
                  )}
                </div>
              ) : (() => {
                // Filter teams based on active tab: completed (enough players) vs pending (insufficient players)
                const filteredTeams = tournament.teams.filter(team => {
                  const hasEnoughPlayers = getTeamMemberCount(team) >= (tournament?.noOfPlayersPerTeam || 1);
                  if (activeTab === 'pending') return !hasEnoughPlayers;
                  // completed
                  return hasEnoughPlayers;
                });

                if (filteredTeams.length === 0) {
                  return (
                    <div className="text-center py-12">
                      <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {activeTab === 'pending' ? 'No pending teams' : 'No completed teams'}
                      </h3>
                      <p className="text-gray-600">
                        {activeTab === 'pending' 
                          ? 'All registered teams have sufficient players.' 
                          : 'No teams currently meet the required players per team.'
                        }
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="divide-y divide-gray-200 border border-gray-200 rounded-lg overflow-visible">
                    {filteredTeams.map((team) => {
                      const pending = activeTab === 'pending';
                      const canRequest = pending && currentUserId && currentUserId !== tournament.creator.user_id && !isUserMemberOfTeam(team);
                      const alreadyRequested = requestedTeamIds.has(team.id) || pendingRequestedTeamIds.has(team.id);
                      const details = teamDetailsById[team.id];
                      const isCurrentUserAdmin = !!currentUserId && (
                        details?.creatorId === currentUserId ||
                        (Array.isArray(details?.members) && details.members.some((m: any) => (m.userId === currentUserId || m.user?.user_id === currentUserId) && (m.isAdmin === true || m.role === 'ADMIN')))
                      );
                      return (
                      <div key={team.id} className="p-4 cursor-pointer" onClick={() => toggleTeamExpanded(team.id)}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-gray-200 rounded-lg overflow-hidden mr-3">
                              {team.photo ? (
                                <img
                                  src={team.photo}
                                  alt={team.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-blue-600">
                                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                  </svg>
                                </div>
                              )}
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">{team.title}</h4>
                              <p className="text-sm text-gray-500">{getTeamMemberCount(team)} members</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                          {isCurrentUserAdmin && (
                            <div className="relative" onClick={(e) => e.stopPropagation()}>
                              <details className="group">
                                <summary className="list-none cursor-pointer p-1 rounded hover:bg-gray-200">
                                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.75a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm0 7.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm0 7.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" />
                                  </svg>
                                </summary>
                                <div className="absolute right-0 bottom-full mb-1 w-44 bg-white border border-gray-200 rounded shadow z-10">
                                  <button
                                    onClick={async () => {
                                      try {
                                        await apiService.unregisterTeamFromTournament(tournamentId as string, team.id);
                                        loadTournament();
                                      } catch (err: any) {
                                        setError(err?.message || 'Failed to unregister team');
                                      }
                                    }}
                                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                                  >
                                    Unregister from Tournament
                                  </button>
                                </div>
                              </details>
                            </div>
                          )}
                          {canRequest && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleRequestToJoin(team.id); }}
                              disabled={alreadyRequested}
                              className={`px-3 py-1 text-sm rounded-md border transition-colors ${alreadyRequested ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' : 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'}`}
                            >
                              {alreadyRequested ? 'Requested' : 'Request'}
                            </button>
                          )}
                          </div>
                        </div>
                        {expandedTeamIds.has(team.id) && (
                          <div className="mt-3 pl-13">
                            {!teamMembersById[team.id] ? (
                              <div className="text-sm text-gray-500">Loading members...</div>
                            ) : teamMembersById[team.id].length === 0 ? (
                              <div className="text-sm text-gray-500">No members to show</div>
                            ) : (
                              <ul className="mt-1 space-y-1">
                                {teamMembersById[team.id].map((member: any) => {
                                  const uid = member.user?.user_id || member.userId;
                                  const name = member.displayName || member.user?.displayName || member.userId;
                                  return (
                                    <li key={member.id} className="flex items-center text-sm text-gray-700">
                                      <span className="inline-block w-2 h-2 rounded-full bg-gray-400 mr-2"></span>
                                      {uid ? (
                                        <button
                                          onClick={(e) => { e.stopPropagation(); navigate(`/users/${uid}`); }}
                                          className="text-left text-blue-600 hover:underline"
                                        >
                                          {name}
                                        </button>
                                      ) : (
                                        <span>{name}</span>
                                      )}
                                    </li>
                                  );
                                })}
                              </ul>
                            )}
                          </div>
                        )}
                      </div>
                    );
                    })}
                  </div>
                );
              })()}
            </div>
          </div>
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

      {/* Team Registration Modal */}
      {showTeamRegistrationModal && (
        <div className="fixed inset-0 bg-white flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Register for Tournament</h3>
                <button
                  onClick={() => {
                    setShowTeamRegistrationModal(false);
                    setRegistrationType('individual');
                    setShowPendingConfirmation(false);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {/* Registration Type Selection */}
              <div className="mb-6">
                <h4 className="text-md font-semibold text-gray-900 mb-4">Choose Registration Type</h4>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setRegistrationType('individual')}
                    className={`p-4 border-2 rounded-lg text-center transition-colors ${
                      registrationType === 'individual'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <h5 className="font-medium">Individual</h5>
                    <p className="text-sm text-gray-500">Register as individual player</p>
                  </button>
                  
                  <button
                    onClick={() => setRegistrationType('team')}
                    className={`p-4 border-2 rounded-lg text-center transition-colors ${
                      registrationType === 'team'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <h5 className="font-medium">Team</h5>
                    <p className="text-sm text-gray-500">Register with existing team</p>
                  </button>
                </div>
              </div>

              {/* Individual Registration */}
              {registrationType === 'individual' ? (
                <div className="text-center py-8">
                  <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Individual Registration</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    We’ll create a solo team (you as admin) and register it. If the tournament requires more than one player per team, your team will show under Pending until enough members join; once it reaches the required size, it will move to Completed.
                  </p>
                  <div className="max-w-sm mx-auto text-left mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Team name</label>
                    <input
                      type="text"
                      value={soloTeamTitle}
                      onChange={(e) => setSoloTeamTitle(e.target.value)}
                      placeholder="Enter your team name"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-3">
                    <button
                      onClick={handleIndividualRegistration}
                      disabled={isCreatingIndividual}
                      className={`px-6 py-3 rounded-lg transition-colors text-white ${isCreatingIndividual ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                    >
                      {isCreatingIndividual ? 'Registering…' : 'Create Solo Team & Register'}
                    </button>
                    <p className="text-sm text-gray-500">or</p>
                    <button
                      onClick={() => setRegistrationType('team')}
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Register with Existing Team
                    </button>
                  </div>
                </div>
              ) : (
                /* Team Registration */
                <>
                  {isLoadingTeams ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : userTeams.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500 mb-4">You don't have any teams for this game yet.</p>
                      <button
                        onClick={() => {
                          setShowTeamRegistrationModal(false);
                          navigate('/teams/create');
                        }}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                      >
                        Create Team
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-sm text-gray-600 mb-4">
                        Select a team to register for this tournament. Teams with insufficient players will be marked as pending.
                      </p>
                      
                      {userTeams.map((team) => {
                        const hasEnoughPlayers = getTeamMemberCount(team) >= (tournament?.noOfPlayersPerTeam || 1);
                        const isAlreadyRegistered = tournament?.teams?.some(t => t.id === team.id);
                        
                        const isAdmin = team?.creatorId === currentUserId;
                        return (
                          <div
                            key={team.id}
                            className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                              isAlreadyRegistered
                                ? 'border-gray-200 bg-gray-50'
                                : hasEnoughPlayers
                                ? 'border-green-200 bg-green-50 hover:bg-green-100'
                                : 'border-yellow-200 bg-yellow-50 hover:bg-yellow-100'
                            }`}
                            onClick={() => !isAlreadyRegistered && handleTeamSelection(team)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <div className="w-12 h-12 bg-gray-200 rounded-lg overflow-hidden mr-3">
                                  {team.photo ? (
                                    <img
                                      src={team.photo}
                                      alt={team.title}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-blue-600">
                                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                      </svg>
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <h4 className="font-medium text-gray-900">{team.title}</h4>
                                  <p className="text-sm text-gray-500">
                                    {getTeamMemberCount(team)} / {tournament?.noOfPlayersPerTeam || '?'} players
                                  </p>
                                  {!hasEnoughPlayers && (
                                    <p className="text-xs text-yellow-600 mt-1">
                                      ⚠️ Insufficient players - will be marked as pending
                                    </p>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                {isAdmin && isAlreadyRegistered && (
                                  <div className="relative">
                                    <details className="group">
                                      <summary className="list-none cursor-pointer p-1 rounded hover:bg-gray-200">
                                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.75a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm0 7.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm0 7.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" />
                                        </svg>
                                      </summary>
                                      <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-200 rounded shadow z-10">
                                        <button
                                          onClick={async (e) => {
                                            e.stopPropagation();
                                            try {
                                              await apiService.unregisterTeamFromTournament(tournamentId as string, team.id);
                                              loadTournament();
                                            } catch (err: any) {
                                              setError(err?.message || 'Failed to deregister team');
                                            }
                                          }}
                                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                                        >
                                          Deregister from Tournament
                                        </button>
                                      </div>
                                    </details>
                                  </div>
                                )}
                                {isAlreadyRegistered ? (
                                  <span className="text-sm text-gray-500">Already registered</span>
                                ) : (
                                  <div className="text-right">
                                    <p className="text-sm font-medium text-gray-900">
                                      {hasEnoughPlayers ? 'Ready to register' : 'Register as pending'}
                                    </p>
                                    <p className="text-xs text-gray-500">Click to register</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Pending Confirmation Modal */}
      {showPendingConfirmation && selectedTeam && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Register as Pending Team</h3>
            </div>
            
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gray-200 rounded-lg overflow-hidden mr-3">
                  {selectedTeam.photo ? (
                    <img
                      src={selectedTeam.photo}
                      alt={selectedTeam.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-blue-600">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{selectedTeam.title}</h4>
                  <p className="text-sm text-gray-500">
                    {getTeamMemberCount(selectedTeam)} / {tournament?.noOfPlayersPerTeam || '?'} players
                  </p>
                </div>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex">
                  <svg className="w-5 h-5 text-yellow-400 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <div>
                    <h5 className="text-sm font-medium text-yellow-800">Insufficient Players</h5>
                    <p className="text-sm text-yellow-700 mt-1">
                      This team doesn't have enough players for the tournament. It will be registered as pending until you add more members.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowPendingConfirmation(false);
                    setSelectedTeam(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePendingRegistration}
                  className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                >
                  Register as Pending
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TournamentDetailsPage;
