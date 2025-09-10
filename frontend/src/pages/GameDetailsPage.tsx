import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { apiService, type UserListItem, type UserProfile, type ApiResponse } from '../services/api';

type TabKey = 'players' | 'teams';

const GameDetailsPage: React.FC = () => {
    const navigate = useNavigate();
    const { name } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();

    // Get active tab from URL params, default to 'players'
    const tabFromUrl = searchParams.get('tab') as TabKey;
    const [activeTab, setActiveTab] = useState<TabKey>(tabFromUrl || 'players');
    const [users, setUsers] = useState<UserListItem[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
    const [expandedUserProfile, setExpandedUserProfile] = useState<UserProfile | null>(null);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [friends, setFriends] = useState<{ user_id: string; displayName: string; photo?: string }[]>([]);
    const [teams, setTeams] = useState<any[]>([]);
    const [teamsLoading, setTeamsLoading] = useState<boolean>(false);

    // Handle tab change and update URL
    const handleTabChange = (tab: TabKey) => {
        setActiveTab(tab);
        setSearchParams({ tab });
    };

    // Sync activeTab with URL changes
    useEffect(() => {
        const tabFromUrl = searchParams.get('tab') as TabKey;
        if (tabFromUrl && (tabFromUrl === 'players' || tabFromUrl === 'teams')) {
            setActiveTab(tabFromUrl);
        }
    }, [searchParams]);

    // Load current user id and friends list
    useEffect(() => {
        let isMounted = true;
        const fromToken = apiService.getUserIdFromToken();
        if (isMounted && fromToken) setCurrentUserId(fromToken);

        (async () => {
            try {
                const [profileRes, friendsRes] = await Promise.all([
                    apiService.getProfile(),
                    apiService.listFriends()
                ]);
                const me = (profileRes as ApiResponse).data as any;
                if (isMounted && me?.user_id) setCurrentUserId(me.user_id);
                if (isMounted) setFriends(friendsRes || []);
            } catch { }
        })();
        return () => { isMounted = false; };
    }, []);

    // Load users and filter by preferred game (excluding self)
    useEffect(() => {
        let isMounted = true;
        (async () => {
            setIsLoading(true);
            setError(null);
            try {
                // Pull first 100 users and filter locally by preferredGames includes game name
                const res = await apiService.listUsers({ page: 1, limit: 100 });
                const list = Array.isArray(res) ? res : (res.users || []);
                const filtered = list
                    .filter(u => (u.preferredGames || []).some(g => g.gameName?.toLowerCase() === (name || '').toLowerCase()))
                    .filter(u => !currentUserId || u.user_id !== currentUserId);
                if (isMounted) setUsers(filtered);
            } catch (e: any) {
                if (isMounted) setError(e?.message || 'Failed to load users');
            } finally {
                if (isMounted) setIsLoading(false);
            }
        })();
        return () => { isMounted = false; };
    }, [name, currentUserId]);

    // When a user is expanded, load profile to show preferred time
    useEffect(() => {
        let isMounted = true;
        (async () => {
            if (!expandedUserId) { setExpandedUserProfile(null); return; }
            try {
                const profile = await apiService.getUserById(expandedUserId);
                if (isMounted) setExpandedUserProfile(profile);
            } catch (e) {
                if (isMounted) setExpandedUserProfile(null);
            }
        })();
        return () => { isMounted = false; };
    }, [expandedUserId]);

    // Load teams when teams tab is active
    useEffect(() => {
        if (activeTab !== 'teams') return;

        let isMounted = true;
        (async () => {
            setTeamsLoading(true);
            try {
                const response = await apiService.getPublicTeams({
                    gameName: name,
                    page: 1,
                    limit: 20
                });
                const teamsData = (response as ApiResponse).data?.teams || [];
                if (isMounted) setTeams(teamsData);
            } catch (e: any) {
                console.error('Failed to load teams:', e);
            } finally {
                if (isMounted) setTeamsLoading(false);
            }
        })();
        return () => { isMounted = false; };
    }, [activeTab, name]);

    const title = useMemo(() => name || 'Game', [name]);

    // Helper function to check if a user is already a friend
    const isFriend = (userId: string): boolean => {
        return friends.some(friend => friend.user_id === userId);
    };

    // Handle message button click - navigate to chat page
    const handleMessageClick = async (userId: string) => {
        try {
            // Get or create chat with the friend
            await apiService.getOrCreateChat(userId);
            // Navigate to chat page
            navigate('/chat');
        } catch (error) {
            console.error('Failed to start chat:', error);
            alert('Failed to start chat. Please try again.');
        }
    };

    // Handle team join request
    const handleJoinTeam = async (teamId: string) => {
        try {
            await apiService.requestToJoinTeam(teamId);
            alert('Join request sent successfully!');
        } catch (error: any) {
            alert(error?.message || 'Failed to send join request');
        }
    };

    // Check if user is team owner
    const isTeamOwner = (team: any) => {
        const isOwner = team.creator?.user_id === currentUserId;
        console.log('Team ownership check:', {
            teamId: team.id,
            teamTitle: team.title,
            creatorId: team.creator?.user_id,
            currentUserId,
            isOwner
        });
        return isOwner;
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow sticky top-0 z-10">
                <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="p-2 rounded hover:bg-gray-100">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 py-6">
                <div className="flex gap-3 mb-4">
                    <button
                        onClick={() => handleTabChange('players')}
                        className={`px-4 py-2 rounded-full border ${activeTab === 'players' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-900 border-gray-300'}`}
                    >
                        Active Players
                    </button>
                    <button
                        onClick={() => handleTabChange('teams')}
                        className={`px-4 py-2 rounded-full border ${activeTab === 'teams' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-900 border-gray-300'}`}
                    >
                        Active Teams
                    </button>
                </div>

                {activeTab === 'players' && (
                    <section>
                        {isLoading && (
                            <div className="flex justify-center py-12">
                                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                            </div>
                        )}
                        {error && <p className="text-red-600">{error}</p>}
                        {!isLoading && !error && (
                            <ul className="space-y-3">
                                {users.map((u) => (
                                    <li key={u.user_id} className="bg-white rounded-xl border border-gray-200 p-3 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
                                                {u.photo ? (
                                                    <img src={u.photo} alt={u.displayName} className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="text-gray-600 font-semibold">{u.displayName?.[0]?.toUpperCase() || '?'}</span>
                                                )}
                                            </div>
                                            <div>
                                                <button onClick={() => navigate(`/users/${u.user_id}`)} className="font-semibold text-gray-900 text-left text-blue-600 hover:underline">{u.displayName}</button>
                                                <div className="text-xs text-gray-500">{u.location}</div>
                                                {expandedUserId === u.user_id && expandedUserProfile && (
                                                    <div className="mt-1 text-xs text-blue-600">
                                                        <div>Days: {(expandedUserProfile.preferredDays || []).join(', ') || 'Not set'}</div>
                                                        <div>Time: {(expandedUserProfile.timeRange || []).join(', ') || 'Not set'}</div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => setExpandedUserId(expandedUserId === u.user_id ? null : u.user_id)}
                                                className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white hover:bg-gray-50"
                                            >
                                                {expandedUserId === u.user_id ? 'Hide time' : 'View time'}
                                            </button>
                                            {isFriend(u.user_id) ? (
                                                <button
                                                    onClick={() => handleMessageClick(u.user_id)}
                                                    className="px-3 py-2 text-sm rounded-lg bg-green-600 text-white hover:bg-green-700"
                                                >
                                                    Message
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={async () => {
                                                        try {
                                                            await apiService.sendFriendRequest(u.user_id);
                                                            alert('Friend request sent');
                                                        } catch (e: any) {
                                                            alert(e?.message || 'Failed to send request');
                                                        }
                                                    }}
                                                    className="px-3 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                                                >
                                                    Send Request
                                                </button>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>
                )}

                {activeTab === 'teams' && (
                    <section>
                        {teamsLoading && (
                            <div className="flex justify-center py-12">
                                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                            </div>
                        )}
                        {!teamsLoading && teams.length === 0 && (
                            <div className="text-center py-12">
                                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                <p className="text-gray-600">No active teams found for this game.</p>
                                <p className="text-sm text-gray-500 mt-1">Be the first to create a team!</p>
                            </div>
                        )}
                        {!teamsLoading && teams.length > 0 && (
                            <div className="space-y-4">
                                {teams.map((team) => (
                                    <div key={team.id} className="bg-white rounded-xl border border-gray-200 p-4">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
                                                    {team.photo ? (
                                                        <img src={team.photo} alt={team.title} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="text-gray-600 font-semibold">{team.title[0]?.toUpperCase()}</span>
                                                    )}
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-gray-900">{team.title}</h3>
                                                    <p className="text-sm text-gray-600">{team.description || 'No description'}</p>
                                                    <div className="flex items-center gap-4 mt-1">
                                                        <span className="text-xs text-gray-500">
                                                            {team._count?.members || 0} members
                                                            {team.noOfPlayers && ` / ${team.noOfPlayers} max`}
                                                        </span>
                                                        <span className="text-xs text-gray-500">
                                                            Created by {team.creator?.displayName || 'Unknown'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            {isTeamOwner(team) ? (
                                                <button
                                                    onClick={() => navigate('/chat')}
                                                    className="px-4 py-2 text-sm rounded-lg bg-green-600 text-white hover:bg-green-700"
                                                >
                                                    Message
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleJoinTeam(team.id)}
                                                    className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                                                >
                                                    Join Team
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                )}
            </main>
        </div>
    );
};

export default GameDetailsPage;


