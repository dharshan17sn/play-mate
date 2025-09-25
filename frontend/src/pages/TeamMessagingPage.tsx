import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiService, type TeamSummary } from '../services/api';
import { getSocket } from '../services/socket';

type TeamMessage = {
    id: string;
    teamId: string;
    content: string;
    sentAt: string;
    readAt?: string;
    sender: {
        user_id: string;
        displayName: string;
        photo?: string;
    };
};

type TeamMember = {
    id: string;
    userId: string;
    displayName: string;
    photo?: string;
    status: string;
    joinedAt: string;
    isAdmin?: boolean;
};

type Team = {
    id: string;
    title: string;
    description?: string | null;
    photo?: string | null;
    gameName: string;
    noOfPlayers?: number | null;
    isPublic: boolean;
    creatorId: string;
    createdAt: string;
    updatedAt: string;
    members: TeamMember[];
    game: {
        name: string;
    };
};

const TeamMessagingPage: React.FC = () => {
    const { teamId } = useParams<{ teamId: string }>();
    const navigate = useNavigate();
    const [teams, setTeams] = useState<TeamSummary[]>([]);
    const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
    const [messages, setMessages] = useState<TeamMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [showMembersModal, setShowMembersModal] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [showTeamView, setShowTeamView] = useState(false);
    const [memberSearchTerm, setMemberSearchTerm] = useState('');

    // Check if mobile
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Load current user ID
    useEffect(() => {
        const userId = apiService.getUserIdFromToken();
        setCurrentUserId(userId);
    }, []);

    // Load teams list
    useEffect(() => {
        const loadTeams = async () => {
            try {
                setLoading(true);
                const teamsResponse = await apiService.getMyTeams();
                setTeams(teamsResponse || []);
            } catch (error) {
                console.error('Failed to load teams:', error);
            } finally {
                setLoading(false);
            }
        };

        loadTeams();
    }, []);

    // Load specific team and messages when teamId changes (only if coming from URL)
    useEffect(() => {
        if (!teamId || teams.length === 0) return;

        // Only load if we don't have a selected team already (coming from direct URL)
        if (!selectedTeam) {
            const loadTeamData = async () => {
                try {
                    const [teamResponse, messagesResponse] = await Promise.all([
                        apiService.getTeamById(teamId),
                        apiService.getTeamMessages(teamId)
                    ]);

                    if (teamResponse.success) {
                        setSelectedTeam(teamResponse.data);
                    }

                    if (messagesResponse.success) {
                        setMessages(messagesResponse.data || []);
                    }
                } catch (error) {
                    console.error('Failed to load team data:', error);
                }
            };

            loadTeamData();
        }
    }, [teamId, teams, selectedTeam]);

    // WebSocket events for team messages
    useEffect(() => {
        if (!selectedTeam) return;

        const socket = getSocket();

        const onTeamMessage = (payload: any) => {
            if (payload.teamId === selectedTeam.id) {
                setMessages(prev => [...prev, payload]);
            }
        };

        socket.on('team:message', onTeamMessage);
        socket.on('team:message:sent', onTeamMessage);

        return () => {
            socket.off('team:message', onTeamMessage);
            socket.off('team:message:sent', onTeamMessage);
        };
    }, [selectedTeam]);

    const sendMessage = async () => {
        if (!newMessage.trim() || !selectedTeam) return;

        try {
            await apiService.sendTeamMessage(selectedTeam.id, newMessage.trim());
            setNewMessage('');
        } catch (error) {
            console.error('Failed to send message:', error);
        }
    };

    const selectTeam = (team: TeamSummary) => {
        // Load the selected team data and messages
        const loadSelectedTeam = async () => {
            try {
                const [teamResponse, messagesResponse] = await Promise.all([
                    apiService.getTeamById(team.id),
                    apiService.getTeamMessages(team.id)
                ]);

                if (teamResponse.success) {
                    setSelectedTeam(teamResponse.data);
                }

                if (messagesResponse.success) {
                    setMessages(messagesResponse.data || []);
                }
            } catch (error) {
                console.error('Failed to load team data:', error);
            }
        };

        loadSelectedTeam();

        if (isMobile) {
            setShowTeamView(true);
        }
    };

    const goBackToTeams = () => {
        setShowTeamView(false);
        setSelectedTeam(null);
        setMessages([]);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

        if (diffInHours < 24) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else {
            return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
        }
    };

    const isMyMessage = (message: TeamMessage) => {
        return currentUserId === message.sender.user_id;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    // Mobile view - show either teams list or team messages
    if (isMobile) {
        if (showTeamView && selectedTeam) {
            // Filter members based on search term
            const filteredMembers = selectedTeam.members.filter(member =>
                member.displayName.toLowerCase().includes(memberSearchTerm.toLowerCase())
            );

            return (
                <div className="h-screen bg-gray-50 flex flex-col">
                    {/* Mobile Team Header */}
                    <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center space-x-3">
                        <button onClick={goBackToTeams} className="p-2 -ml-2 bg-white rounded-full border border-gray-200 hover:bg-gray-50" title="Go Back">
                            <svg className="w-5 h-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <div className="flex-1">
                            <h3 className="text-sm font-medium text-gray-900">{selectedTeam.title}</h3>
                            <p className="text-xs text-gray-500">Team Details</p>
                        </div>
                    </div>

                    {/* Mobile Team Info and Members */}
                    <div className="flex-1 overflow-y-auto bg-gray-50">
                        {/* Team Photo */}
                        <div className="bg-white p-6 text-center border-b border-gray-200">
                            <div className="w-36 h-36 md:w-40 md:h-40 rounded-full overflow-hidden flex items-center justify-center mx-auto mb-4">
                                {selectedTeam.photo ? (
                                    <img src={selectedTeam.photo} alt={selectedTeam.title} className="w-full h-full object-cover rounded-full" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-700">
                                        <span className="text-white font-bold text-4xl leading-none">
                                            {selectedTeam.title[0]?.toUpperCase()}
                                        </span>
                                    </div>
                                )}
                            </div>
                            <h2 className="text-xl font-semibold text-gray-900 mb-2">{selectedTeam.title}</h2>
                        </div>

                        {/* Game Info */}
                        <div className="bg-white p-4 border-b border-gray-200">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900">Game</p>
                                    <p className="text-sm text-gray-600">{selectedTeam.gameName || 'No game specified'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="bg-white p-4 border-b border-gray-200">
                            <div className="flex items-start space-x-3">
                                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900 mb-1">Description</p>
                                    <p className="text-sm text-gray-600">{selectedTeam.description || 'No description available'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Mobile actions - moved below description, above members */}
                        <div className="bg-white px-4 py-3 border-b border-gray-200">
                            <div className="flex items-center justify-center space-x-3">
                                <button
                                    onClick={async () => {
                                        try {
                                            await apiService.leaveTeam(selectedTeam.id);
                                            setTeams(prev => prev.filter(t => t.id !== selectedTeam.id));
                                            setSelectedTeam(null);
                                            setMessages([]);
                                        } catch (e) {
                                            console.error('Failed to leave team', e);
                                        }
                                    }}
                                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                                >
                                    Exit team
                                </button>
                                <button
                                    onClick={async () => {
                                        if (!confirm('Delete this team? If you are creator, it deletes for everyone. Otherwise it removes only for you.')) return;
                                        try {
                                            try {
                                                await apiService.deleteTeam(selectedTeam.id);
                                            } catch (_) {
                                                await apiService.leaveTeam(selectedTeam.id);
                                            }
                                            setTeams(prev => prev.filter(t => t.id !== selectedTeam.id));
                                            setSelectedTeam(null);
                                            setMessages([]);
                                        } catch (e) {
                                            console.error('Failed to delete/exit team', e);
                                        }
                                    }}
                                    className="px-3 py-1.5 text-sm border border-red-300 text-red-600 rounded-md hover:bg-red-50"
                                >
                                    Delete / Exit
                                </button>
                                <button
                                    onClick={async () => {
                                        try {
                                            const shareUrl = `${window.location.origin}/team-invite/${encodeURIComponent(selectedTeam.id)}`;
                                            if (navigator.share) {
                                                await navigator.share({ title: selectedTeam.title, url: shareUrl });
                                            } else {
                                                await navigator.clipboard.writeText(shareUrl);
                                                alert('Invite link copied to clipboard');
                                            }
                                        } catch {}
                                    }}
                                    className="px-3 py-1.5 text-sm border border-indigo-300 text-indigo-700 rounded-md hover:bg-indigo-50"
                                >
                                    Share
                                </button>
                            </div>
                        </div>

                        {/* Members Section */}
                        <div className="bg-white p-4">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-900">Members ({selectedTeam.members.length})</h3>
                            </div>

                            {/* Search Bar */}
                            <div className="mb-4">
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={memberSearchTerm}
                                        onChange={(e) => setMemberSearchTerm(e.target.value)}
                                        placeholder="Search members..."
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                    <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                            </div>

                            {/* Members List */}
                            <div className="space-y-3">
                                {filteredMembers.length === 0 ? (
                                    <div className="text-center py-4">
                                        <p className="text-gray-500 text-sm">No members found</p>
                                    </div>
                                ) : (
                                    filteredMembers.map((member) => (
                                        <div key={member.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                                            <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
                                                {member.photo ? (
                                                    <img src={member.photo} alt={member.displayName} className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="text-gray-600 font-semibold text-sm">{member.displayName[0]?.toUpperCase()}</span>
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-2">
                                                    <p className="font-medium text-gray-900">
                                                        {member.displayName}
                                                        {member.userId === currentUserId && (
                                                            <span className="text-blue-600 font-normal"> (you)</span>
                                                        )}
                                                    </p>
                                                    {member.isAdmin && (
                                                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                                                            Admin
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-500">
                                                    Joined {new Date(member.joinedAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        // Mobile Teams List
        return (
            <div className="h-screen bg-white flex flex-col">
                {/* Mobile Header */}
                <div className="bg-white border-b border-gray-200 px-4 py-3">
                    <div className="flex items-center justify-between">
                        <h1 className="text-lg font-semibold text-gray-900">Team Messages</h1>
                        <button onClick={() => navigate('/chat')} className="p-2">
                            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {teams.length === 0 ? (
                        <div className="text-center text-gray-500 py-8">
                            <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            <p className="text-sm">No teams yet</p>
                            <p className="text-xs text-gray-400 mt-1">Join a team to start group conversations</p>
                        </div>
                    ) : (
                        <div className="p-4 space-y-3">
                            {teams.map((team) => (
                                <div key={team.id} className="rounded-lg border border-gray-100">
                                    <button
                                        onClick={() => selectTeam(team)}
                                        className="w-full p-3 text-left hover:bg-gray-50 rounded-t-lg flex items-center space-x-3"
                                    >
                                        <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
                                            <span className="text-gray-600 font-semibold">{team.title[0]?.toUpperCase()}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate">{team.title}</p>
                                            <p className="text-xs text-gray-500 truncate">{team.description || 'No description'}</p>
                                            <div className="flex items-center space-x-2 mt-1">
                                                <span className="text-xs text-gray-500">{team.gameName || 'No game'}</span>
                                                {team.isPublic ? (
                                                    <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">Public</span>
                                                ) : (
                                                    <span className="text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded-full">Private</span>
                                                )}
                                            </div>
                                        </div>
                                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                    <div className="flex items-center justify-end gap-2 px-3 py-2 bg-white rounded-b-lg border-t border-gray-100">
                                        <button
                                            onClick={async (e) => {
                                                e.stopPropagation();
                                                try {
                                                    await apiService.leaveTeam(team.id);
                                                    setTeams(prev => prev.filter(t => t.id !== team.id));
                                                    if (selectedTeam?.id === team.id) {
                                                        setSelectedTeam(null);
                                                        setMessages([]);
                                                    }
                                                } catch (err) {
                                                    console.error('Failed to exit team', err);
                                                }
                                            }}
                                            className="px-3 py-1.5 text-xs border border-gray-300 rounded-md text-gray-800 hover:bg-gray-50"
                                        >
                                            Exit
                                        </button>
                                        <button
                                            onClick={async (e) => {
                                                e.stopPropagation();
                                                if (!confirm('Delete this team? If you are creator, it deletes for everyone. Otherwise it removes only for you.')) return;
                                                try {
                                                    try {
                                                        await apiService.deleteTeam(team.id);
                                                    } catch (_) {
                                                        await apiService.leaveTeam(team.id);
                                                    }
                                                    setTeams(prev => prev.filter(t => t.id !== team.id));
                                                    if (selectedTeam?.id === team.id) {
                                                        setSelectedTeam(null);
                                                        setMessages([]);
                                                    }
                                                } catch (err) {
                                                    console.error('Failed to delete/exit team', err);
                                                }
                                            }}
                                            className="px-3 py-1.5 text-xs border border-red-300 text-red-600 rounded-md hover:bg-red-50"
                                        >
                                            Delete / Exit
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Desktop view - WhatsApp Web style
    return (
        <div className="h-screen bg-gray-100 flex">
            {/* Desktop Sidebar */}
            <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col">
                {/* Desktop Header */}
                <div className="bg-gray-50 border-b border-gray-200 px-4 py-3">
                    <div className="flex items-center justify-between">
                        <h1 className="text-lg font-semibold text-gray-900">Team Messages</h1>
                        <button onClick={() => navigate('/chat')} className="p-2 text-gray-500 hover:text-gray-700">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {teams.length === 0 ? (
                        <div className="text-center text-gray-500 py-8">
                            <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            <p className="text-sm">No teams yet</p>
                            <p className="text-xs text-gray-400 mt-1">Join a team to start group conversations</p>
                        </div>
                    ) : (
                        <div className="p-4 space-y-1">
                            {teams.map((team) => (
                                <button
                                    key={team.id}
                                    onClick={() => selectTeam(team)}
                                    className={`w-full p-3 text-left hover:bg-gray-50 rounded-lg flex items-center space-x-3 ${selectedTeam?.id === team.id ? 'bg-blue-50 border border-blue-200' : ''
                                        }`}
                                >
                                    <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
                                        <span className="text-gray-600 font-semibold text-sm">{team.title[0]?.toUpperCase()}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">{team.title}</p>
                                        <p className="text-xs text-gray-500 truncate">{team.description || 'No description'}</p>
                                        <div className="flex items-center space-x-2 mt-1">
                                            <span className="text-xs text-gray-500">{team.gameName || 'No game'}</span>
                                            {team.isPublic ? (
                                                <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">Public</span>
                                            ) : (
                                                <span className="text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded-full">Private</span>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Desktop Chat Area */}
            <div className="flex-1 flex flex-col">
                {selectedTeam ? (
                    <>
                        {/* Desktop Team Header */}
                        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
                                    {selectedTeam.photo ? (
                                        <img src={selectedTeam.photo} alt={selectedTeam.title} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-gray-600 font-semibold">{selectedTeam.title[0]?.toUpperCase()}</span>
                                    )}
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-gray-900">{selectedTeam.title}</h3>
                                    <p className="text-xs text-gray-500">{selectedTeam.members.length} members</p>
                                </div>
                            </div>
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => setShowMembersModal(true)}
                                    className="p-2 text-gray-500 hover:text-gray-700"
                                    title="View Team Members"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                                    </svg>
                                </button>
                                {/* Visible desktop actions */}
                                <button
                                    onClick={async () => {
                                        if (!selectedTeam) return;
                                        try {
                                            await apiService.leaveTeam(selectedTeam.id);
                                            setTeams(prev => prev.filter(t => t.id !== selectedTeam.id));
                                            setSelectedTeam(null);
                                            setMessages([]);
                                        } catch (e) {
                                            console.error('Failed to leave team', e);
                                        }
                                    }}
                                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                                >
                                    Exit team
                                </button>
                                <button
                                    onClick={async () => {
                                        if (!selectedTeam) return;
                                        if (!confirm('Delete this team? If you are creator, it deletes for everyone. Otherwise it removes only for you.')) return;
                                        try {
                                            try {
                                                await apiService.deleteTeam(selectedTeam.id);
                                            } catch (_) {
                                                await apiService.leaveTeam(selectedTeam.id);
                                            }
                                            setTeams(prev => prev.filter(t => t.id !== selectedTeam.id));
                                            setSelectedTeam(null);
                                            setMessages([]);
                                        } catch (e) {
                                            console.error('Failed to delete/exit team', e);
                                        }
                                    }}
                                    className="px-3 py-1.5 text-sm border border-red-300 text-red-600 rounded-md hover:bg-red-50"
                                >
                                    Delete / Exit
                                </button>
                                <button
                                    onClick={async () => {
                                        if (!selectedTeam) return;
                                        try {
                                            const shareUrl = `${window.location.origin}/team-invite/${encodeURIComponent(selectedTeam.id)}`;
                                            if (navigator.share) {
                                                await navigator.share({ title: selectedTeam.title, url: shareUrl });
                                            } else {
                                                await navigator.clipboard.writeText(shareUrl);
                                                alert('Invite link copied to clipboard');
                                            }
                                        } catch {}
                                    }}
                                    className="px-3 py-1.5 text-sm border border-indigo-300 text-indigo-700 rounded-md hover:bg-indigo-50"
                                >
                                    Share
                                </button>
                            </div>
                        </div>

                        {/* Desktop Messages */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
                            {messages.length === 0 ? (
                                <div className="text-center py-8">
                                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">No messages yet</h3>
                                    <p className="text-gray-500">Start the conversation by sending a message!</p>
                                </div>
                            ) : (
                                messages.map((message) => (
                                    <div
                                        key={message.id}
                                        className={`flex ${isMyMessage(message) ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div
                                            className={`max-w-[70%] px-4 py-2 rounded-2xl ${isMyMessage(message)
                                                ? 'bg-blue-500 text-white rounded-br-md'
                                                : 'bg-white text-gray-900 rounded-bl-md shadow-sm'
                                                }`}
                                        >
                                            {!isMyMessage(message) && (
                                                <p className="text-xs font-medium text-gray-600 mb-1">
                                                    {message.sender.displayName}
                                                </p>
                                            )}
                                            <p className="text-sm">{message.content}</p>
                                            <p className={`text-xs mt-1 ${isMyMessage(message) ? 'text-blue-100' : 'text-gray-500'
                                                }`}>
                                                {formatTime(message.sentAt)}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Desktop Message Input */}
                        <div className="bg-white border-t border-gray-200 p-4">
                            <div className="flex items-center space-x-3">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="Type a message..."
                                    className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                                <button
                                    onClick={sendMessage}
                                    disabled={!newMessage.trim()}
                                    className="bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center bg-gray-50">
                        <div className="text-center text-gray-500">
                            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Team Messages</h3>
                            <p className="text-sm">Select a team to start messaging</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Team Members Panel - Only for Desktop */}
            {showMembersModal && selectedTeam && !isMobile && (
                <div className="absolute top-0 right-0 w-80 h-full bg-white border-l border-gray-200 shadow-lg z-50">
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">Team Members</h3>
                            <button
                                onClick={() => setShowMembersModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                            {selectedTeam.members.map((member) => (
                                <div key={member.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg">
                                    <img
                                        src={member.photo || '/default-avatar.png'}
                                        alt={member.displayName}
                                        className="w-10 h-10 rounded-full object-cover"
                                    />
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-2">
                                            <p className="font-medium text-gray-900">
                                                {member.displayName}
                                                {member.userId === currentUserId && (
                                                    <span className="text-blue-600 font-normal"> (you)</span>
                                                )}
                                            </p>
                                            {member.isAdmin && (
                                                <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                                                    Admin
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-500">
                                            Joined {new Date(member.joinedAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeamMessagingPage;
