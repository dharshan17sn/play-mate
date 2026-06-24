import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { apiService, SERVER_BASE_URL } from '../services/api';
import type { Game, UserListItem } from '../services/api';
import { Users, Gamepad2, UsersRound, Trophy, Plus, Trash2, ShieldAlert, BarChart3, AlertCircle } from 'lucide-react';

interface Stats {
  users: number;
  games: number;
  teams: number;
  tournaments: number;
}

const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  const [isAdminUser, setIsAdminUser] = useState<boolean | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [newGameName, setNewGameName] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Game Banner Upload state variables
  const [uploadingGameName, setUploadingGameName] = useState<string | null>(null);
  const [uploadLoading, setUploadLoading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const triggerBannerUpload = (gameName: string) => {
    setUploadingGameName(gameName);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleBannerFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadingGameName) return;

    setUploadLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await apiService.uploadGameBanner(uploadingGameName, file);
      if (res.success) {
        setSuccessMsg(`Banner uploaded successfully for game "${uploadingGameName}"!`);
        // Refresh catalog list
        const updatedGames = await apiService.getGames();
        setGames(updatedGames || []);
      } else {
        setError(res.message || 'Failed to upload banner.');
      }
    } catch (err: any) {
      console.error('Error uploading banner:', err);
      setError(err?.message || 'Error occurred while uploading banner.');
    } finally {
      setUploadLoading(false);
      setUploadingGameName(null);
      e.target.value = '';
    }
  };

  // Users Directory state variables
  const [showUsers, setShowUsers] = useState<boolean>(false);
  const [usersList, setUsersList] = useState<UserListItem[]>([]);
  const [usersPage, setUsersPage] = useState<number>(1);
  const [usersLimit] = useState<number>(6); // Limit the count of users loaded (rate limiting/payload reduction)
  const [usersSearch, setUsersSearch] = useState<string>('');
  const [usersLoading, setUsersLoading] = useState<boolean>(false);

  const fetchUsers = async (page: number, search: string) => {
    setUsersLoading(true);
    try {
      const res = await apiService.listUsers({
        page,
        limit: usersLimit,
        search: search.trim() || undefined,
      });

      const usersArray = Array.isArray(res) ? res : ((res as any).users || []);
      setUsersList(usersArray);
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError(err?.message || 'Failed to fetch users list.');
    } finally {
      setUsersLoading(false);
    }
  };

  // Teams Directory state variables
  const [showTeams, setShowTeams] = useState<boolean>(false);
  const [teamsList, setTeamsList] = useState<any[]>([]);
  const [teamsPage, setTeamsPage] = useState<number>(1);
  const [teamsLimit] = useState<number>(6);
  const [teamsSearch, setTeamsSearch] = useState<string>('');
  const [teamsLoading, setTeamsLoading] = useState<boolean>(false);

  // Tournaments Directory state variables
  const [showTournaments, setShowTournaments] = useState<boolean>(false);
  const [tournamentsList, setTournamentsList] = useState<any[]>([]);
  const [tournamentsPage, setTournamentsPage] = useState<number>(1);
  const [tournamentsLimit] = useState<number>(6);
  const [selectedGameId, setSelectedGameId] = useState<string>('');
  const [tournamentsLoading, setTournamentsLoading] = useState<boolean>(false);

  const handleToggleUsers = () => {
    setShowTeams(false);
    setShowTournaments(false);
    if (!showUsers) {
      setShowUsers(true);
      setUsersPage(1);
      fetchUsers(1, usersSearch);
    } else {
      setShowUsers(false);
    }
  };

  const handleToggleTeams = () => {
    setShowUsers(false);
    setShowTournaments(false);
    if (!showTeams) {
      setShowTeams(true);
      setTeamsPage(1);
      fetchTeams(1, teamsSearch);
    } else {
      setShowTeams(false);
    }
  };

  const handleToggleTournaments = () => {
    setShowUsers(false);
    setShowTeams(false);
    if (!showTournaments) {
      setShowTournaments(true);
      setTournamentsPage(1);
      fetchTournaments(1, selectedGameId);
    } else {
      setShowTournaments(false);
    }
  };

  const handleUsersPageChange = (newPage: number) => {
    if (newPage < 1) return;
    setUsersPage(newPage);
    fetchUsers(newPage, usersSearch);
  };

  const handleTeamsPageChange = (newPage: number) => {
    if (newPage < 1) return;
    setTeamsPage(newPage);
    fetchTeams(newPage, teamsSearch);
  };

  const handleTournamentsPageChange = (newPage: number) => {
    if (newPage < 1) return;
    setTournamentsPage(newPage);
    fetchTournaments(newPage, selectedGameId);
  };

  const fetchTeams = async (page: number, search: string) => {
    setTeamsLoading(true);
    try {
      const res = await apiService.getAllTeams({
        page,
        limit: teamsLimit,
        search: search.trim() || undefined,
      });
      const teamsArray = Array.isArray(res?.data) ? res.data : (res?.data?.teams || []);
      setTeamsList(teamsArray);
    } catch (err: any) {
      console.error('Error fetching teams:', err);
      setError(err?.message || 'Failed to fetch teams list.');
    } finally {
      setTeamsLoading(false);
    }
  };

  const fetchTournaments = async (page: number, gameId: string) => {
    setTournamentsLoading(true);
    try {
      const res = await apiService.getTournaments({
        page,
        limit: tournamentsLimit,
        gameId: gameId || undefined,
      });
      const tournamentsArray = Array.isArray(res?.data) ? res.data : (res?.data?.tournaments || []);
      setTournamentsList(tournamentsArray);
    } catch (err: any) {
      console.error('Error fetching tournaments:', err);
      setError(err?.message || 'Failed to fetch tournaments list.');
    } finally {
      setTournamentsLoading(false);
    }
  };

  // Debounced user search
  useEffect(() => {
    if (!showUsers) return;
    const delayDebounceFn = setTimeout(() => {
      setUsersPage(1);
      fetchUsers(1, usersSearch);
    }, 400);
    return () => clearTimeout(delayDebounceFn);
  }, [usersSearch, showUsers]);

  // Debounced team search
  useEffect(() => {
    if (!showTeams) return;
    const delayDebounceFn = setTimeout(() => {
      setTeamsPage(1);
      fetchTeams(1, teamsSearch);
    }, 400);
    return () => clearTimeout(delayDebounceFn);
  }, [teamsSearch, showTeams]);

  // Filter tournaments by selected game
  useEffect(() => {
    if (!showTournaments) return;
    setTournamentsPage(1);
    fetchTournaments(1, selectedGameId);
  }, [selectedGameId, showTournaments]);

  useEffect(() => {
    // Check if user is admin
    const checkAdmin = async () => {
      const adminStatus = apiService.isAdmin();
      setIsAdminUser(adminStatus);
      if (!adminStatus) {
        setLoading(false);
        return;
      }

      await fetchData();
    };

    checkAdmin();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, gamesRes] = await Promise.all([
        apiService.getAdminStats(),
        apiService.getGames(),
      ]);

      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data);
      } else {
        throw new Error(statsRes.message || 'Failed to fetch admin stats');
      }

      setGames(gamesRes || []);
    } catch (err: any) {
      console.error('Error fetching admin data:', err);
      setError(err?.message || 'Failed to load dashboard statistics.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddGame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGameName.trim()) return;

    setActionLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await apiService.createGame(newGameName.trim());
      if (res.success) {
        setSuccessMsg(`Game "${newGameName}" created successfully!`);
        setNewGameName('');
        // Refresh stats and game list
        const updatedGames = await apiService.getGames();
        setGames(updatedGames || []);
        const statsRes = await apiService.getAdminStats();
        if (statsRes.success && statsRes.data) {
          setStats(statsRes.data);
        }
      } else {
        setError(res.message || 'Failed to create game.');
      }
    } catch (err: any) {
      console.error('Error creating game:', err);
      setError(err?.message || 'Error occurred while creating game.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteGame = async (gameName: string) => {
    if (!window.confirm(`Are you sure you want to delete "${gameName}"? This will delete all relationships.`)) {
      return;
    }

    setActionLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await apiService.deleteGame(gameName);
      if (res.success) {
        setSuccessMsg(`Game "${gameName}" deleted successfully!`);
        // Refresh stats and game list
        const updatedGames = await apiService.getGames();
        setGames(updatedGames || []);
        const statsRes = await apiService.getAdminStats();
        if (statsRes.success && statsRes.data) {
          setStats(statsRes.data);
        }
      } else {
        setError(res.message || 'Failed to delete game.');
      }
    } catch (err: any) {
      console.error('Error deleting game:', err);
      setError(err?.message || 'Error occurred while deleting game.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        </div>
      </div>
    );
  }

  // Not an admin
  if (isAdminUser === false) {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <Navbar />
        <div className="max-w-md mx-auto px-4 py-20 text-center flex flex-col items-center justify-center h-[calc(100vh-64px)]">
          <div className="bg-red-500/10 p-4 rounded-full text-red-500 mb-6 border border-red-500/20">
            <ShieldAlert size={48} />
          </div>
          <h1 className="text-3xl font-extrabold mb-4 tracking-tight">Access Denied</h1>
          <p className="text-slate-400 mb-8 leading-relaxed">
            You do not have administrative privileges to access this area. If you believe this is an error, contact support.
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-6 rounded-lg transition duration-200 shadow-lg shadow-indigo-600/20"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-500/10 p-3 rounded-xl border border-indigo-500/20 text-indigo-400">
              <BarChart3 size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Admin Analysis Portal</h1>
              <p className="text-slate-400 text-sm mt-1">Monitor system metrics and manage gaming catalogs</p>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-8 flex items-start gap-3">
            <AlertCircle className="shrink-0 mt-0.5" size={20} />
            <div>
              <p className="font-semibold">Operation Error</p>
              <p className="text-sm text-red-300/80 mt-1 whitespace-pre-line">{error}</p>
            </div>
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl mb-8 flex items-start gap-3">
            <div className="shrink-0 bg-emerald-500/20 p-1 rounded-full">
              <Plus size={16} />
            </div>
            <div>
              <p className="font-semibold">Success</p>
              <p className="text-sm text-emerald-300/80 mt-1">{successMsg}</p>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {/* Card 1 - Clickable Users Card */}
          <button
            onClick={handleToggleUsers}
            className={`w-full text-left bg-slate-900 border ${
              showUsers ? 'border-blue-500/80 shadow-lg shadow-blue-500/5' : 'border-slate-800 hover:border-slate-700'
            } rounded-2xl p-6 flex items-center justify-between shadow-xl transition-all duration-300 cursor-pointer focus:outline-none`}
            title="Click to toggle user directory"
          >
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Total Users</p>
              <h3 className="text-3xl font-extrabold mt-2 tracking-tight flex items-baseline gap-2 text-slate-100">
                {stats?.users ?? 0}
                <span className="text-[10px] font-normal text-blue-400 normal-case bg-blue-500/10 px-1.5 py-0.5 rounded-full border border-blue-500/20">
                  {showUsers ? 'Viewing' : 'View list'}
                </span>
              </h3>
            </div>
            <div className={`p-3.5 rounded-xl border transition-all duration-300 ${
              showUsers 
                ? 'bg-blue-500 text-white border-blue-450 shadow-md shadow-blue-500/20' 
                : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
            }`}>
              <Users size={24} />
            </div>
          </button>

          {/* Card 2 */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex items-center justify-between shadow-xl">
            <div>
              <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">Total Games</p>
              <h3 className="text-3xl font-extrabold mt-2 tracking-tight">{stats?.games ?? 0}</h3>
            </div>
            <div className="bg-indigo-500/10 p-4 rounded-2xl text-indigo-400 border border-indigo-500/20">
              <Gamepad2 size={28} />
            </div>
          </div>

          {/* Card 3 - Clickable Teams Card */}
          <button
            onClick={handleToggleTeams}
            className={`w-full text-left bg-slate-900 border ${
              showTeams ? 'border-purple-500/80 shadow-lg shadow-purple-500/5' : 'border-slate-800 hover:border-slate-700'
            } rounded-2xl p-6 flex items-center justify-between shadow-xl transition-all duration-300 cursor-pointer focus:outline-none`}
            title="Click to toggle team directory"
          >
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Total Teams</p>
              <h3 className="text-3xl font-extrabold mt-2 tracking-tight flex items-baseline gap-2 text-slate-100">
                {stats?.teams ?? 0}
                <span className="text-[10px] font-normal text-purple-400 normal-case bg-purple-500/10 px-1.5 py-0.5 rounded-full border border-purple-500/20">
                  {showTeams ? 'Viewing' : 'View list'}
                </span>
              </h3>
            </div>
            <div className={`p-3.5 rounded-xl border transition-all duration-300 ${
              showTeams 
                ? 'bg-purple-500 text-white border-purple-450 shadow-md shadow-purple-500/20' 
                : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
            }`}>
              <UsersRound size={24} />
            </div>
          </button>

          {/* Card 4 - Clickable Tournaments Card */}
          <button
            onClick={handleToggleTournaments}
            className={`w-full text-left bg-slate-900 border ${
              showTournaments ? 'border-amber-500/80 shadow-lg shadow-amber-500/5' : 'border-slate-800 hover:border-slate-700'
            } rounded-2xl p-6 flex items-center justify-between shadow-xl transition-all duration-300 cursor-pointer focus:outline-none`}
            title="Click to toggle tournament directory"
          >
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Total Tournaments</p>
              <h3 className="text-3xl font-extrabold mt-2 tracking-tight flex items-baseline gap-2 text-slate-100">
                {stats?.tournaments ?? 0}
                <span className="text-[10px] font-normal text-amber-400 normal-case bg-amber-500/10 px-1.5 py-0.5 rounded-full border border-amber-500/20">
                  {showTournaments ? 'Viewing' : 'View list'}
                </span>
              </h3>
            </div>
            <div className={`p-3.5 rounded-xl border transition-all duration-300 ${
              showTournaments 
                ? 'bg-amber-550 text-white border-amber-500 shadow-md shadow-amber-500/20' 
                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
            }`}>
              <Trophy size={24} />
            </div>
          </button>
        </div>

        {/* Users Directory (Collapsible & Paginated/Debounced) */}
        {showUsers && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl mb-8 animate-in fade-in slide-in-from-top-4 duration-300">
            {/* Header with Search */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
                  <Users className="text-blue-400" size={22} />
                  Registered Users
                </h2>
                <p className="text-slate-400 text-xs mt-1">
                  Browse and search user records (limited count per page to protect server resource limits)
                </p>
              </div>
              
              {/* Search input with rate limiting/debouncing */}
              <div className="relative max-w-xs w-full">
                <input
                  type="text"
                  placeholder="Filter users..."
                  value={usersSearch}
                  onChange={(e) => setUsersSearch(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl py-2.5 px-4 pl-10 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors text-sm"
                />
                <span className="absolute left-3.5 top-3.5 text-slate-500">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
                {usersSearch && (
                  <button 
                    onClick={() => setUsersSearch('')}
                    className="absolute right-3 top-3 text-slate-500 hover:text-slate-300 text-xs bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 transition"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Content area */}
            {usersLoading && usersList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <p className="text-slate-500 text-xs">Loading user registry...</p>
              </div>
            ) : usersList.length === 0 ? (
              <div className="text-center py-12 text-slate-500 border border-dashed border-slate-800 rounded-xl bg-slate-950/40">
                <Users size={36} className="mx-auto mb-3 opacity-20 text-slate-400" />
                <p className="text-sm font-medium text-slate-400">No users found</p>
                <p className="text-xs text-slate-600 mt-1">Try refining your search keyword</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Users List Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {usersList.map((user) => (
                    <div 
                      key={user.user_id} 
                      className="bg-slate-950/40 hover:bg-slate-950/80 border border-slate-850 hover:border-slate-800 rounded-xl p-4 flex items-center justify-between gap-3 transition-all duration-200"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Avatar */}
                        {user.photo ? (
                          <img 
                            src={user.photo} 
                            alt={user.displayName} 
                            className="w-10 h-10 rounded-full object-cover border border-slate-800 shrink-0"
                            onError={(e) => {
                              (e.target as any).style.display = 'none';
                              const parent = (e.target as any).parentElement;
                              if (parent) {
                                const fallback = parent.querySelector('.user-fallback-avatar');
                                if (fallback) (fallback as HTMLElement).style.display = 'flex';
                              }
                            }}
                          />
                        ) : null}
                        <div 
                          className="user-fallback-avatar w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold flex items-center justify-center shrink-0 text-xs uppercase"
                          style={{ display: user.photo ? 'none' : 'flex' }}
                        >
                          {user.displayName.substring(0, 2)}
                        </div>
                        
                        {/* User Details */}
                        <div className="min-w-0">
                          <h4 className="font-semibold text-slate-200 truncate text-sm">{user.displayName}</h4>
                          <p className="text-slate-400 text-xs truncate">{user.email}</p>
                          <p className="text-slate-500 text-[10px] truncate mt-0.5">ID: {user.user_id}</p>
                        </div>
                      </div>
                      
                      {/* Meta/Badges */}
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        {user.location && (
                          <span className="text-[10px] bg-slate-900 border border-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-medium truncate max-w-[80px]">
                            {user.location}
                          </span>
                        )}
                        {user.gender && (
                          <span className="text-[10px] bg-slate-900 border border-slate-800 text-slate-450 px-2 py-0.5 rounded-full font-medium uppercase text-center min-w-[32px]">
                            {user.gender.substring(0, 1)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination Controls */}
                <div className="flex items-center justify-between border-t border-slate-850 pt-4">
                  <div className="text-xs text-slate-400 flex items-center gap-1.5">
                    Showing Page <span className="font-semibold text-slate-200">{usersPage}</span>
                    {usersLoading && (
                      <span className="inline-block w-2.5 h-2.5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleUsersPageChange(usersPage - 1)}
                      disabled={usersPage === 1 || usersLoading}
                      className="px-3 py-1.5 bg-slate-950 border border-slate-850 hover:bg-slate-900 hover:border-slate-800 disabled:opacity-30 disabled:pointer-events-none rounded-lg text-xs font-semibold text-slate-300 transition duration-150 cursor-pointer"
                    >
                      ← Previous
                    </button>
                    <button
                      onClick={() => handleUsersPageChange(usersPage + 1)}
                      disabled={usersList.length < usersLimit || usersLoading}
                      className="px-3 py-1.5 bg-slate-950 border border-slate-850 hover:bg-slate-900 hover:border-slate-800 disabled:opacity-30 disabled:pointer-events-none rounded-lg text-xs font-semibold text-slate-300 transition duration-150 cursor-pointer"
                    >
                      Next →
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Teams Directory (Collapsible & Paginated/Debounced) */}
        {showTeams && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl mb-8 animate-in fade-in slide-in-from-top-4 duration-300">
            {/* Header with Search */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
                  <UsersRound className="text-purple-400" size={22} />
                  Teams Directory
                </h2>
                <p className="text-slate-400 text-xs mt-1">
                  Browse and search teams (limited count per page to protect server resources)
                </p>
              </div>
              
              {/* Search input with rate limiting/debouncing */}
              <div className="relative max-w-xs w-full">
                <input
                  type="text"
                  placeholder="Filter teams..."
                  value={teamsSearch}
                  onChange={(e) => setTeamsSearch(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl py-2.5 px-4 pl-10 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors text-sm"
                />
                <span className="absolute left-3.5 top-3.5 text-slate-500">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
                {teamsSearch && (
                  <button 
                    onClick={() => setTeamsSearch('')}
                    className="absolute right-3 top-3 text-slate-500 hover:text-slate-300 text-xs bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 transition"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Content area */}
            {teamsLoading && teamsList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                <p className="text-slate-500 text-xs">Loading teams...</p>
              </div>
            ) : teamsList.length === 0 ? (
              <div className="text-center py-12 text-slate-500 border border-dashed border-slate-800 rounded-xl bg-slate-950/40">
                <UsersRound size={36} className="mx-auto mb-3 opacity-20 text-slate-400" />
                <p className="text-sm font-medium text-slate-400">No teams found</p>
                <p className="text-xs text-slate-600 mt-1">Try refining your search keyword</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Teams List Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {teamsList.map((team) => (
                    <div 
                      key={team.id} 
                      className="bg-slate-950/40 hover:bg-slate-950/80 border border-slate-850 hover:border-slate-800 rounded-xl p-4 flex items-center justify-between gap-3 transition-all duration-200"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Avatar */}
                        {team.photo ? (
                          <img 
                            src={team.photo.startsWith('/') ? `${SERVER_BASE_URL}${team.photo}` : team.photo} 
                            alt={team.title} 
                            className="w-10 h-10 rounded-full object-cover border border-slate-800 shrink-0"
                            onError={(e) => {
                              (e.target as any).style.display = 'none';
                              const fallback = (e.target as any).nextSibling;
                              if (fallback) fallback.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div 
                          className="w-10 h-10 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 font-bold flex items-center justify-center shrink-0 text-xs uppercase"
                          style={{ display: team.photo ? 'none' : 'flex' }}
                        >
                          {team.title.substring(0, 2)}
                        </div>
                        
                        {/* Team Details */}
                        <div className="min-w-0">
                          <h4 className="font-semibold text-slate-200 truncate text-sm">{team.title}</h4>
                          <p className="text-slate-400 text-xs truncate">Game: {team.gameName || team.game?.name || 'N/A'}</p>
                          <p className="text-slate-500 text-[10px] truncate mt-0.5">ID: {team.id}</p>
                        </div>
                      </div>
                      
                      {/* Meta/Badges */}
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className="text-[10px] bg-slate-900 border border-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-medium">
                          {team.isPublic ? 'Public' : 'Private'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination Controls */}
                <div className="flex items-center justify-between border-t border-slate-850 pt-4">
                  <div className="text-xs text-slate-400 flex items-center gap-1.5">
                    Showing Page <span className="font-semibold text-slate-200">{teamsPage}</span>
                    {teamsLoading && (
                      <span className="inline-block w-2.5 h-2.5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleTeamsPageChange(teamsPage - 1)}
                      disabled={teamsPage === 1 || teamsLoading}
                      className="px-3 py-1.5 bg-slate-950 border border-slate-850 hover:bg-slate-900 hover:border-slate-800 disabled:opacity-30 disabled:pointer-events-none rounded-lg text-xs font-semibold text-slate-300 transition duration-150 cursor-pointer"
                    >
                      ← Previous
                    </button>
                    <button
                      onClick={() => handleTeamsPageChange(teamsPage + 1)}
                      disabled={teamsList.length < teamsLimit || teamsLoading}
                      className="px-3 py-1.5 bg-slate-950 border border-slate-850 hover:bg-slate-900 hover:border-slate-800 disabled:opacity-30 disabled:pointer-events-none rounded-lg text-xs font-semibold text-slate-300 transition duration-150 cursor-pointer"
                    >
                      Next →
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tournaments Directory (Collapsible & Paginated) */}
        {showTournaments && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl mb-8 animate-in fade-in slide-in-from-top-4 duration-300">
            {/* Header with Search */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
                  <Trophy className="text-amber-400" size={22} />
                  Tournaments Directory
                </h2>
                <p className="text-slate-400 text-xs mt-1">
                  Browse and filter tournaments by game (limited count per page to protect server resources)
                </p>
              </div>
              
              {/* Game Filter Dropdown */}
              <div className="relative max-w-xs w-full">
                <select
                  value={selectedGameId}
                  onChange={(e) => setSelectedGameId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl py-2.5 px-4 text-slate-100 focus:outline-none focus:border-amber-500 transition-colors text-sm cursor-pointer"
                >
                  <option value="">All Games</option>
                  {games.map((g) => (
                    <option key={g.name} value={g.name}>{g.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Content area */}
            {tournamentsLoading && tournamentsList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
                <p className="text-slate-500 text-xs">Loading tournaments...</p>
              </div>
            ) : tournamentsList.length === 0 ? (
              <div className="text-center py-12 text-slate-500 border border-dashed border-slate-800 rounded-xl bg-slate-950/40">
                <Trophy size={36} className="mx-auto mb-3 opacity-20 text-slate-400" />
                <p className="text-sm font-medium text-slate-400">No tournaments found</p>
                <p className="text-xs text-slate-600 mt-1">Try selecting a different game filter</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Tournaments List Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {tournamentsList.map((t) => (
                    <div 
                      key={t.id} 
                      className="bg-slate-950/40 hover:bg-slate-950/80 border border-slate-850 hover:border-slate-800 rounded-xl p-4 flex flex-col justify-between gap-3 transition-all duration-200"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        {/* Avatar */}
                        {t.photo ? (
                          <img 
                            src={t.photo.startsWith('/') ? `${SERVER_BASE_URL}${t.photo}` : t.photo} 
                            alt={t.title} 
                            className="w-10 h-10 rounded-full object-cover border border-slate-800 shrink-0 mt-0.5"
                            onError={(e) => {
                              (e.target as any).style.display = 'none';
                              const fallback = (e.target as any).nextSibling;
                              if (fallback) fallback.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div 
                          className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold flex items-center justify-center shrink-0 text-xs uppercase mt-0.5"
                          style={{ display: t.photo ? 'none' : 'flex' }}
                        >
                          {t.title.substring(0, 2)}
                        </div>
                        
                        {/* Tournament Details */}
                        <div className="min-w-0 flex-1">
                          <h4 className="font-semibold text-slate-200 truncate text-sm">{t.title}</h4>
                          <p className="text-slate-400 text-xs truncate">Game: {t.gameId || t.game?.name || 'N/A'}</p>
                          <p className="text-slate-400 text-xs truncate">Location: {t.location}</p>
                          <p className="text-slate-500 text-[10px] truncate mt-0.5">Start: {t.startDate ? new Date(t.startDate).toLocaleDateString() : 'N/A'}</p>
                        </div>
                      </div>
                      
                      {/* Meta/Badges */}
                      <div className="flex items-center justify-between border-t border-slate-900 pt-2 mt-1">
                        <span className="text-[10px] text-slate-500 font-mono truncate max-w-[120px]">
                          ID: {t.id.substring(0, 8)}...
                        </span>
                        <span className="text-[10px] bg-slate-900 border border-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-medium">
                          {t.teams?.length || 0} Reg. Teams
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination Controls */}
                <div className="flex items-center justify-between border-t border-slate-850 pt-4">
                  <div className="text-xs text-slate-400 flex items-center gap-1.5">
                    Showing Page <span className="font-semibold text-slate-200">{tournamentsPage}</span>
                    {tournamentsLoading && (
                      <span className="inline-block w-2.5 h-2.5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleTournamentsPageChange(tournamentsPage - 1)}
                      disabled={tournamentsPage === 1 || tournamentsLoading}
                      className="px-3 py-1.5 bg-slate-950 border border-slate-850 hover:bg-slate-900 hover:border-slate-800 disabled:opacity-30 disabled:pointer-events-none rounded-lg text-xs font-semibold text-slate-300 transition duration-150 cursor-pointer"
                    >
                      ← Previous
                    </button>
                    <button
                      onClick={() => handleTournamentsPageChange(tournamentsPage + 1)}
                      disabled={tournamentsList.length < tournamentsLimit || tournamentsLoading}
                      className="px-3 py-1.5 bg-slate-950 border border-slate-850 hover:bg-slate-900 hover:border-slate-800 disabled:opacity-30 disabled:pointer-events-none rounded-lg text-xs font-semibold text-slate-300 transition duration-150 cursor-pointer"
                    >
                      Next →
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Management Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Add Game Form */}
          <div className="lg:col-span-1">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl sticky top-6">
              <h2 className="text-xl font-bold mb-4 tracking-tight flex items-center gap-2">
                <Plus size={20} className="text-indigo-400" />
                Add New Game
              </h2>
              <form onSubmit={handleAddGame} className="space-y-4">
                <div>
                  <label htmlFor="game-name" className="block text-slate-400 text-sm mb-2 font-medium">
                    Game Catalog Name
                  </label>
                  <input
                    type="text"
                    id="game-name"
                    value={newGameName}
                    onChange={(e) => setNewGameName(e.target.value)}
                    placeholder="e.g., Apex Legends"
                    disabled={actionLoading}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl py-3 px-4 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={actionLoading || !newGameName.trim()}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium py-3 rounded-xl transition duration-200 shadow-lg shadow-indigo-600/10 flex items-center justify-center gap-2"
                >
                  <Plus size={18} />
                  Add Game
                </button>
              </form>
            </div>
          </div>

          {/* Current Games List */}
          <div className="lg:col-span-2">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <h2 className="text-xl font-bold mb-4 tracking-tight flex items-center gap-2">
                <Gamepad2 size={20} className="text-indigo-400" />
                Game Catalog ({games.length})
              </h2>
              
              {games.length === 0 ? (
                <div className="text-center py-10 text-slate-500">
                  <Gamepad2 size={48} className="mx-auto mb-3 opacity-30" />
                  No games currently in catalog
                </div>
              ) : (
                <div className="divide-y divide-slate-850 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                  {games.map((game) => (
                    <div key={game.name} className="py-4 flex items-center justify-between first:pt-0 last:pb-0 gap-4">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {/* Game Banner Preview or Fallback Icon */}
                        {game.banner ? (
                          <img
                            src={game.banner}
                            alt={game.name}
                            className="w-12 h-8 rounded-lg object-cover border border-slate-850 shrink-0"
                            onError={(e) => {
                              (e.target as any).style.display = 'none';
                              const parent = (e.target as any).parentElement;
                              if (parent) {
                                const fallback = parent.querySelector('.game-fallback-icon');
                                if (fallback) (fallback as HTMLElement).style.display = 'flex';
                              }
                            }}
                          />
                        ) : null}
                        <div
                          className="game-fallback-icon w-12 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0"
                          style={{ display: game.banner ? 'none' : 'flex' }}
                        >
                          <Gamepad2 size={16} />
                        </div>
                        <span className="font-semibold text-slate-200 truncate text-sm">{game.name}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {/* Upload Banner Button */}
                        <button
                          onClick={() => triggerBannerUpload(game.name)}
                          disabled={actionLoading || uploadLoading}
                          className="bg-slate-950 hover:bg-indigo-500/10 hover:border-indigo-500/20 text-slate-500 hover:text-indigo-400 p-2 rounded-lg border border-slate-850 transition duration-200 cursor-pointer"
                          title="Upload Game Banner"
                        >
                          {uploadLoading && uploadingGameName === game.name ? (
                            <span className="inline-block w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></span>
                          ) : (
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          )}
                        </button>
                        {/* Delete Button */}
                        <button
                          onClick={() => handleDeleteGame(game.name)}
                          disabled={actionLoading || uploadLoading}
                          className="bg-slate-950 hover:bg-red-500/10 hover:border-red-500/20 text-slate-500 hover:text-red-400 p-2 rounded-lg border border-slate-850 transition duration-200 cursor-pointer"
                          title="Delete Game"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Hidden file input for dynamic banner uploads */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleBannerFileChange}
        accept="image/*"
        className="hidden"
      />
    </div>
  );
};

export default AdminPage;
