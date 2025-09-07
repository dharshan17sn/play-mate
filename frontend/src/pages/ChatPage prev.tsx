import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiService, type ApiResponse } from '../services/api';
import { getSocket } from '../services/socket';

type Chat = {
    id: string;
    userAId: string;
    userBId: string;
    createdAt: string;
    updatedAt: string;
    userA: { user_id: string; displayName: string; photo?: string };
    userB: { user_id: string; displayName: string; photo?: string };
    lastMessage?: {
        id: string;
        content: string;
        sentAt: string;
        senderId: string;
    };
    unreadCount?: number;
};

type Message = {
    id: string;
    chatId: string;
    content: string;
    sentAt: string;
    readAt?: string;
    sender: {
        user_id: string;
        displayName: string;
        photo?: string;
    };
};
type Friend = {
    user_id: string;
    displayName: string;
    photo?: string;
};

type TabKey = 'messaging' | 'teams';

// Team Creation Modal Component (moved above for declaration order)
const CreateTeamModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onCreateTeam: (data: {
        title: string;
        description?: string;
        photo?: string;
        gameName: string;
        noOfPlayers?: number;
        isPublic: boolean;
    }) => Promise<void>;
}> = ({ isOpen, onClose, onCreateTeam }) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        photo: '',
        gameName: '',
        noOfPlayers: '',
        isPublic: true,
    });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [games, setGames] = useState<{ name: string }[]>([]);
    const [loading, setLoading] = useState(false);

    // Load games when modal opens
    useEffect(() => {
        if (isOpen) {
            const loadGames = async () => {
                try {
                    const response = await apiService.getGames();
                    setGames(response);
                } catch (error) {
                    console.error('Failed to load games:', error);
                }
            };
            loadGames();
        }
    }, [isOpen]);

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            setFormData(prev => ({
                ...prev,
                photo: file.name
            }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title.trim() || !formData.gameName.trim()) return;

        setLoading(true);
        try {
            await onCreateTeam({
                title: formData.title.trim(),
                description: formData.description.trim() || undefined,
                photo: formData.photo.trim() || undefined,
                gameName: formData.gameName.trim(),
                noOfPlayers: formData.noOfPlayers ? parseInt(formData.noOfPlayers) : undefined,
                isPublic: formData.isPublic,
            });
            setFormData({
                title: '',
                description: '',
                photo: '',
                gameName: '',
                noOfPlayers: '',
                isPublic: true,
            });
            setSelectedFile(null);
            onClose();
        } catch (error) {
            console.error('Failed to create team:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold text-gray-900">Create Team</h2>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-full"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Team Name *
                            </label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter team name"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Game *
                            </label>
                            <select
                                value={formData.gameName}
                                onChange={(e) => setFormData({ ...formData, gameName: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            >
                                <option value="">Select a game</option>
                                {games.map((game) => (
                                    <option key={game.name} value={game.name}>
                                        {game.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Description
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter team description"
                                rows={3}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Team Photo
                            </label>
                            <div className="flex items-center space-x-4">
                                {selectedFile && (
                                    <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                                        <span className="text-gray-500 text-xs">Photo</span>
                                    </div>
                                )}
                                <div>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handlePhotoUpload}
                                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                    />
                                    <p className="mt-1 text-xs text-gray-500">
                                        Upload a team photo (JPG, PNG, GIF)
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Max Players
                            </label>
                            <input
                                type="number"
                                value={formData.noOfPlayers}
                                onChange={(e) => setFormData({ ...formData, noOfPlayers: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter max number of players"
                                min="2"
                                max="50"
                            />
                        </div>

                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="isPublic"
                                checked={formData.isPublic}
                                onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label htmlFor="isPublic" className="ml-2 block text-sm text-gray-700">
                                Public team (visible to everyone)
                            </label>
                        </div>

                        <div className="flex space-x-3 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading || !formData.title.trim() || !formData.gameName.trim()}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Creating...' : 'Create Team'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

const ChatPage: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    // Get active tab from URL params, default to 'messaging'
    const tabFromUrl = searchParams.get('tab') as TabKey;
    const [activeTab, setActiveTab] = useState<TabKey>(tabFromUrl || 'messaging');
    const [chats, setChats] = useState<Chat[]>([]);
    const [friends, setFriends] = useState<Friend[]>([]);
    const [teams, setTeams] = useState<any[]>([]);
    const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
    const [selectedTeam, setSelectedTeam] = useState<any>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [teamMessages, setTeamMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [isMobile, setIsMobile] = useState(false);
    const [showChatView, setShowChatView] = useState(false);
    const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);
    const [showFriendsList, setShowFriendsList] = useState(false);
    const [showTeamDetails, setShowTeamDetails] = useState(false);
    const [teamMembers, setTeamMembers] = useState<any[]>([]);
    const [membersSearchTerm, setMembersSearchTerm] = useState('');
    const [teamDetailsActiveTab, setTeamDetailsActiveTab] = useState<'overview' | 'members'>('overview');
    const [sidebarWidth, setSidebarWidth] = useState(280);
    const [isResizing, setIsResizing] = useState(false);
    const [editingField, setEditingField] = useState<'teamName' | 'description' | null>(null);
    const [editValue, setEditValue] = useState('');
    const [mainSidebarWidth, setMainSidebarWidth] = useState(320);
    const [isMainResizing, setIsMainResizing] = useState(false);
    const [showMemberMenu, setShowMemberMenu] = useState<string | null>(null);
    const [selectedMember, setSelectedMember] = useState<any>(null);
    const [chatSearchTerm, setChatSearchTerm] = useState('');
    const [teamSearchTerm, setTeamSearchTerm] = useState('');

    // Handle tab change and update URL
    const handleTabChange = (tab: TabKey) => {
        setActiveTab(tab);
        setSearchParams({ tab });
    };

    // Sync activeTab with URL changes
    useEffect(() => {
        const tabFromUrl = searchParams.get('tab') as TabKey;
        if (tabFromUrl && (tabFromUrl === 'messaging' || tabFromUrl === 'teams')) {
            setActiveTab(tabFromUrl);
        }
    }, [searchParams]);

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

    // Load chats, friends, and teams
    useEffect(() => {
        const loadData = async () => {
            try {
                const [chatsResponse, friendsResponse, teamsResponse] = await Promise.all([
                    apiService.getUserChats(),
                    apiService.listFriends(),
                    apiService.getMyTeams()
                ]);
                setChats((chatsResponse as ApiResponse).data || []);
                setFriends(friendsResponse || []);
                setTeams(teamsResponse || []);
            } catch (error) {
                console.error('Failed to load data:', error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    // Load messages for selected chat
    useEffect(() => {
        if (!selectedChat) return;

        const loadMessages = async () => {
            try {
                const response = await apiService.getChatMessages(selectedChat.id);
                setMessages((response as ApiResponse).data || []);
                // Mark messages as read
                await apiService.markMessagesAsRead(selectedChat.id);
            } catch (error) {
                console.error('Failed to load messages:', error);
            }
        };
        loadMessages();
    }, [selectedChat]);

    // Load messages for selected team
    useEffect(() => {
        if (!selectedTeam) return;

        const loadTeamMessages = async () => {
            try {
                const response = await apiService.getTeamMessages(selectedTeam.id);
                setTeamMessages((response as ApiResponse).data || []);
            } catch (error) {
                console.error('Failed to load team messages:', error);
            }
        };
        loadTeamMessages();
    }, [selectedTeam]);

    // WebSocket events
    useEffect(() => {
        const socket = getSocket();

        const onMessage = (payload: any) => {
            if (selectedChat && payload.chatId === selectedChat.id) {
                setMessages(prev => [...prev, payload]);
                // Mark as read if it's the current chat
                apiService.markMessagesAsRead(selectedChat.id);
            }
            // Update chat list to show new message
            setChats(prev => prev.map(chat =>
                chat.id === payload.chatId
                    ? { ...chat, lastMessage: payload, updatedAt: payload.sentAt }
                    : chat
            ));
        };

        const onTeamMessage = (payload: any) => {
            if (selectedTeam && payload.teamId === selectedTeam.id) {
                setTeamMessages(prev => [...prev, payload]);
            }
        };

        socket.on('chat:message', onMessage);
        socket.on('chat:message:sent', onMessage);
        socket.on('team:message', onTeamMessage);
        socket.on('team:message:sent', onTeamMessage);

        return () => {
            socket.off('chat:message', onMessage);
            socket.off('chat:message:sent', onMessage);
            socket.off('team:message', onTeamMessage);
            socket.off('team:message:sent', onTeamMessage);
        };
    }, [selectedChat, selectedTeam]);

    const sendMessage = async () => {
        if (!newMessage.trim()) return;

        try {
            if (selectedChat) {
                await apiService.sendMessage(selectedChat.id, newMessage.trim());
            } else if (selectedTeam) {
                await apiService.sendTeamMessage(selectedTeam.id, newMessage.trim());
            }
            setNewMessage('');
        } catch (error) {
            console.error('Failed to send message:', error);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    // Handle ESC key to go back to chat selection
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            if (selectedChat || selectedTeam) {
                setSelectedChat(null);
                setSelectedTeam(null);
            } else if (showFriendsList) {
                setShowFriendsList(false);
            }
        }
    };

    const getOtherUser = (chat: Chat) => {
        if (!currentUserId) return null;
        return chat.userAId === currentUserId ? chat.userB : chat.userA;
    };

    const startChatWithFriend = async (friendId: string) => {
        try {
            const response = await apiService.getOrCreateChat(friendId);
            const chat = (response as ApiResponse).data as Chat;
            setSelectedChat(chat);
            if (isMobile) {
                setShowChatView(true);
            }
        } catch (error) {
            console.error('Failed to start chat:', error);
        }
    };

    const selectChat = (chat: Chat) => {
        setSelectedChat(chat);
        setSelectedTeam(null); // Clear team selection
        if (isMobile) {
            setShowChatView(true);
        }
    };

    const selectTeam = async (team: any) => {
        try {
            // Load full team data with members
            const teamResponse = await apiService.getTeamById(team.id);
            if (teamResponse.success) {
                setSelectedTeam(teamResponse.data);

                // Load team members
                const membersResponse = await apiService.getTeamMembers(team.id);
                if (membersResponse.success) {
                    setTeamMembers(membersResponse.data || []);
                }
            } else {
                setSelectedTeam(team); // Fallback to summary data
            }
        } catch (error) {
            console.error('Failed to load team details:', error);
            setSelectedTeam(team); // Fallback to summary data
        }

        setSelectedChat(null); // Clear chat selection
        setShowTeamDetails(false); // Start with messaging view
        if (isMobile) {
            setShowChatView(true);
        }
    };

    const goBackToFriends = () => {
        setShowChatView(false);
        setSelectedChat(null);
        setSelectedTeam(null);
        setShowTeamDetails(false);
    };

    const handleCreateTeam = async (data: {
        title: string;
        description?: string;
        photo?: string;
        gameName: string;
        noOfPlayers?: number;
        isPublic: boolean;
    }) => {
        try {
            await apiService.createTeam(data);
            alert('Team created successfully!');
            // Refresh teams list
            const teamsResponse = await apiService.getMyTeams();
            setTeams(teamsResponse || []);
        } catch (error: any) {
            alert(error?.message || 'Failed to create team');
        }
    };

    // Handle resizing functionality
    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsResizing(true);
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (!isResizing) return;

        // Get the team details window position
        const teamDetailsWindow = document.querySelector('[data-team-details]') as HTMLElement;
        if (!teamDetailsWindow) return;

        const rect = teamDetailsWindow.getBoundingClientRect();
        const newWidth = e.clientX - rect.left;
        const minWidth = 200;
        const maxWidth = 500;

        if (newWidth >= minWidth && newWidth <= maxWidth) {
            setSidebarWidth(newWidth);
        }
    };

    const handleMouseUp = () => {
        setIsResizing(false);
    };

    // Add mouse event listeners for resizing
    useEffect(() => {
        if (isResizing) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
        } else {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };
    }, [isResizing]);

    // Inline editing functions
    const startEditing = (field: 'teamName' | 'description') => {
        setEditingField(field);
        if (field === 'teamName') {
            setEditValue(selectedTeam?.title || '');
        } else if (field === 'description') {
            setEditValue(selectedTeam?.description || '');
        }
    };

    const cancelEditing = () => {
        setEditingField(null);
        setEditValue('');
    };

    const saveEdit = async () => {
        if (!selectedTeam || !editingField) return;

        try {
            const updateData: any = {};
            if (editingField === 'teamName') {
                updateData.title = editValue.trim();
            } else if (editingField === 'description') {
                updateData.description = editValue.trim();
            }

            // Call API to update the team
            const response = await apiService.updateTeam(selectedTeam.id, updateData);

            if (response.success) {
                // Update local state with the new data
                setSelectedTeam((prev: any) => prev ? { ...prev, ...updateData } : null);

                // Also update the teams list to reflect the changes
                setTeams(prev => prev.map(team =>
                    team.id === selectedTeam.id
                        ? { ...team, ...updateData }
                        : team
                ));

                setEditingField(null);
                setEditValue('');
            } else {
                throw new Error(response.message || 'Failed to update team');
            }
        } catch (error) {
            console.error('Failed to update team:', error);
            alert('Failed to update team: ' + (error as Error).message);
        }
    };

    const handleEditKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            saveEdit();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            cancelEditing();
        }
    };

    // Member management functions
    const openMemberMenu = (member: any, e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedMember(member);
        setShowMemberMenu(member.id);
    };

    const closeMemberMenu = () => {
        setShowMemberMenu(null);
        setSelectedMember(null);
    };

    const makeMemberAdmin = async () => {
        if (!selectedMember || !selectedTeam) return;

        try {
            // Call API to make the member an admin
            const response = await apiService.makeMemberAdmin(selectedTeam.id, selectedMember.userId);

            if (response.success) {
                // Update local state
                setTeamMembers(prev => prev.map(member =>
                    member.id === selectedMember.id
                        ? { ...member, isAdmin: true }
                        : member
                ));

                closeMemberMenu();
                alert(`${selectedMember.displayName} is now an admin`);
            } else {
                throw new Error(response.message || 'Failed to make member admin');
            }
        } catch (error) {
            console.error('Failed to make member admin:', error);
            alert('Failed to make member admin: ' + (error as Error).message);
        }
    };

    const removeMemberFromGroup = async () => {
        if (!selectedMember || !selectedTeam) return;

        const confirmRemove = window.confirm(
            `Are you sure you want to remove ${selectedMember.displayName} from the team?`
        );

        if (!confirmRemove) return;

        try {
            // Call API to remove the member
            const response = await apiService.removeMemberFromTeam(selectedTeam.id, selectedMember.userId);

            if (response.success) {
                // Update local state
                setTeamMembers(prev => prev.filter(member => member.id !== selectedMember.id));

                // Update team members count
                setSelectedTeam((prev: any) => prev ? {
                    ...prev,
                    members: prev.members?.filter((m: any) => m.id !== selectedMember.id) || []
                } : null);

                closeMemberMenu();
                alert(`${selectedMember.displayName} has been removed from the team`);
            } else {
                throw new Error(response.message || 'Failed to remove member');
            }
        } catch (error) {
            console.error('Failed to remove member:', error);
            alert('Failed to remove member: ' + (error as Error).message);
        }
    };

    // Main sidebar resize handlers
    const handleMainMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsMainResizing(true);
    };

    const handleMainMouseMove = (e: MouseEvent) => {
        if (!isMainResizing) return;

        const newWidth = e.clientX;
        const minWidth = 250;
        const maxWidth = 500;

        if (newWidth >= minWidth && newWidth <= maxWidth) {
            setMainSidebarWidth(newWidth);
        }
    };

    const handleMainMouseUp = () => {
        setIsMainResizing(false);
    };

    // Add mouse event listeners for main sidebar resizing
    useEffect(() => {
        if (isMainResizing) {
            document.addEventListener('mousemove', handleMainMouseMove);
            document.addEventListener('mouseup', handleMainMouseUp);
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
        } else {
            document.removeEventListener('mousemove', handleMainMouseMove);
            document.removeEventListener('mouseup', handleMainMouseUp);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        }

        return () => {
            document.removeEventListener('mousemove', handleMainMouseMove);
            document.removeEventListener('mouseup', handleMainMouseUp);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };
    }, [isMainResizing]);

    // Close member menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (showMemberMenu) {
                const target = event.target as Element;
                if (!target.closest('.member-menu-container')) {
                    closeMemberMenu();
                }
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showMemberMenu]);


    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    // Mobile view - show either friends list or chat
    if (isMobile) {
        if (showChatView && (selectedChat || selectedTeam)) {
            const otherUser = selectedChat ? getOtherUser(selectedChat) : null;
            return (
                <div className="h-screen bg-gray-50 flex flex-col" style={{ height: '100vh', minHeight: '100vh' }}>
                    {/* Mobile Chat/Team Header */}
                    <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center space-x-3">
                        <button onClick={goBackToFriends} className="p-2 -ml-2">
                            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
                            {selectedChat ? (
                                otherUser?.photo ? (
                                    <img src={otherUser.photo} alt={otherUser.displayName} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-gray-600 font-semibold">{otherUser?.displayName[0]?.toUpperCase()}</span>
                                )
                            ) : selectedTeam ? (
                                <span className="text-gray-600 font-semibold">{selectedTeam.title[0]?.toUpperCase()}</span>
                            ) : null}
                        </div>
                        <div className="flex-1">
                            {selectedTeam ? (
                                <button
                                    onClick={() => setShowTeamDetails(!showTeamDetails)}
                                    className="text-left"
                                >
                                    <h3 className="text-sm font-medium text-gray-900 hover:text-blue-600">
                                        {selectedTeam.title}
                                    </h3>
                                    <p className="text-xs text-gray-500">
                                        {selectedTeam?.members ? `${selectedTeam.members.length} members` : ''}
                                    </p>
                                </button>
                            ) : (
                                <>
                                    <h3 className="text-sm font-medium text-gray-900">
                                        {otherUser?.displayName}
                                    </h3>
                                    <p className="text-xs text-gray-500"></p>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Mobile Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                        {selectedChat ? (
                            messages.map((message) => (
                                <div
                                    key={message.id}
                                    className={`flex ${message.sender.user_id === currentUserId ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[80%] px-4 py-2 rounded-2xl ${message.sender.user_id === currentUserId
                                            ? 'bg-blue-500 text-white rounded-br-md'
                                            : 'bg-white text-gray-900 rounded-bl-md shadow-sm'
                                            }`}
                                    >
                                        <p className="text-sm">{message.content}</p>
                                        <p className={`text-xs mt-1 ${message.sender.user_id === currentUserId ? 'text-blue-100' : 'text-gray-500'
                                            }`}>
                                            {new Date(message.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : selectedTeam ? (
                            teamMessages.map((message) => (
                                <div
                                    key={message.id}
                                    className={`flex ${message.sender.user_id === currentUserId ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[80%] px-4 py-2 rounded-2xl ${message.sender.user_id === currentUserId
                                            ? 'bg-blue-500 text-white rounded-br-md'
                                            : 'bg-white text-gray-900 rounded-bl-md shadow-sm'
                                            }`}
                                    >
                                        {message.sender.user_id !== currentUserId && (
                                            <p className="text-xs font-medium text-gray-600 mb-1">
                                                {message.sender.displayName}
                                            </p>
                                        )}
                                        <p className="text-sm">{message.content}</p>
                                        <p className={`text-xs mt-1 ${message.sender.user_id === currentUserId ? 'text-blue-100' : 'text-gray-500'
                                            }`}>
                                            {new Date(message.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : null}
                    </div>

                    {/* Mobile Message Input */}
                    <div className="bg-white border-t border-gray-200 p-4">
                        <div className="flex space-x-3">
                            <button className="p-2 text-gray-500">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                </svg>
                            </button>
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

                    {/* Mobile Team Details Mini Window */}
                    {showTeamDetails && selectedTeam && (
                        <div className="absolute top-0 right-0 w-full h-full bg-white border-l border-gray-200 shadow-lg z-50">
                            <div className="h-full flex flex-col">
                                {/* Mini Window Header */}
                                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                                    <h3 className="text-lg font-semibold text-gray-900">Team Info</h3>
                                    <button
                                        onClick={() => setShowTeamDetails(false)}
                                        className="p-1 hover:bg-gray-200 rounded-full"
                                    >
                                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                {/* Mini Window Content - Full Height */}
                                <div className="flex-1 overflow-y-auto p-4">
                                    {/* Team Photo */}
                                    <div className="flex justify-center mb-4">
                                        <div className="w-20 h-20 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
                                            {selectedTeam.photo ? (
                                                <img src={selectedTeam.photo} alt={selectedTeam.title} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-gray-600 font-semibold text-2xl">{selectedTeam.title[0]?.toUpperCase()}</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Team Name with Edit Button */}
                                    <div className="flex items-center justify-center space-x-2 mb-4">
                                        {editingField === 'teamName' ? (
                                            <input
                                                type="text"
                                                value={editValue}
                                                onChange={(e) => setEditValue(e.target.value)}
                                                onKeyPress={handleEditKeyPress}
                                                onBlur={saveEdit}
                                                className="text-lg font-semibold text-gray-900 text-center bg-white border border-blue-300 rounded px-3 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                autoFocus
                                            />
                                        ) : (
                                            <>
                                                <h2 className="text-lg font-semibold text-gray-900">{selectedTeam.title}</h2>
                                                {teamMembers.find(member => member.userId === currentUserId)?.isAdmin && (
                                                    <button
                                                        onClick={() => startEditing('teamName')}
                                                        className="p-1 hover:bg-gray-100 rounded-full"
                                                    >
                                                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                    </button>
                                                )}
                                            </>
                                        )}
                                    </div>

                                    {/* Team Info - Vertical Layout */}
                                    <div className="space-y-4">
                                        <div>
                                            <h5 className="text-sm font-medium text-gray-600 mb-1">Game</h5>
                                            <p className="text-sm text-gray-900">{selectedTeam.game?.name || 'No game specified'}</p>
                                        </div>

                                        <div>
                                            <h5 className="text-sm font-medium text-gray-600 mb-1">Created</h5>
                                            <p className="text-sm text-gray-900">{new Date(selectedTeam.createdAt).toLocaleDateString()}</p>
                                        </div>

                                        {/* Description - Only for Admins */}
                                        {teamMembers.find(member => member.userId === currentUserId)?.isAdmin && (
                                            <div>
                                                <div className="flex items-center justify-between mb-1">
                                                    <h5 className="text-sm font-medium text-gray-600">Description</h5>
                                                    <button
                                                        onClick={() => startEditing('description')}
                                                        className="p-1 hover:bg-gray-100 rounded-full"
                                                    >
                                                        <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                    </button>
                                                </div>
                                                {editingField === 'description' ? (
                                                    <textarea
                                                        value={editValue}
                                                        onChange={(e) => setEditValue(e.target.value)}
                                                        onKeyPress={handleEditKeyPress}
                                                        onBlur={saveEdit}
                                                        className="w-full text-sm text-gray-900 bg-white border border-blue-300 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                                                        rows={3}
                                                        autoFocus
                                                    />
                                                ) : (
                                                    <p className="text-sm text-gray-900">{selectedTeam.description || 'No description provided'}</p>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Members Section */}
                                    <div className="mt-6">
                                        <h4 className="text-sm font-medium text-gray-700 mb-3">Members</h4>

                                        {/* Search Bar */}
                                        <div className="relative mb-3">
                                            <input
                                                type="text"
                                                placeholder="Search..."
                                                value={membersSearchTerm}
                                                onChange={(e) => setMembersSearchTerm(e.target.value)}
                                                className="w-full pl-8 pr-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                            <span className="absolute inset-y-0 left-0 pl-2 flex items-center text-gray-400">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M10 18a8 8 0 100-16 8 8 0 000 16z" />
                                                </svg>
                                            </span>
                                        </div>

                                        {/* Members List */}
                                        <div className="space-y-2">
                                            {teamMembers
                                                .filter(member =>
                                                    member.displayName?.toLowerCase().includes(membersSearchTerm.toLowerCase())
                                                )
                                                .map((member) => (
                                                    <div key={member.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded relative member-menu-container">
                                                        <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
                                                            {member.photo ? (
                                                                <img src={member.photo} alt={member.displayName} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <span className="text-gray-600 font-semibold text-xs">{member.displayName[0]?.toUpperCase()}</span>
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-xs font-medium text-gray-900 truncate">{member.displayName}</p>
                                                            <p className="text-xs text-gray-500">
                                                                {new Date(member.joinedAt).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center space-x-1">
                                                            {member.isAdmin && (
                                                                <span className="px-1 py-0.5 text-xs bg-blue-100 text-blue-800 rounded">
                                                                    Admin
                                                                </span>
                                                            )}
                                                            {teamMembers.find(m => m.userId === currentUserId)?.isAdmin && member.userId !== currentUserId && (
                                                                <button
                                                                    onClick={(e) => openMemberMenu(member, e)}
                                                                    className="p-1 hover:bg-gray-200 rounded-full"
                                                                >
                                                                    <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                                                    </svg>
                                                                </button>
                                                            )}
                                                        </div>

                                                        {/* Member Action Menu */}
                                                        {showMemberMenu === member.id && (
                                                            <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                                                                <div className="py-1">
                                                                    {!member.isAdmin && (
                                                                        <button
                                                                            onClick={makeMemberAdmin}
                                                                            className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-100"
                                                                        >
                                                                            Make Admin
                                                                        </button>
                                                                    )}
                                                                    <button
                                                                        onClick={removeMemberFromGroup}
                                                                        className="w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-red-50"
                                                                    >
                                                                        Remove from Group
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            );
        }

        // Mobile Friends List
        return (
            <div className="h-screen bg-white flex flex-col">
                {/* Mobile Header */}
                <div className="bg-white border-b border-gray-200 px-4 py-3">
                    <div className="flex items-center justify-between">
                        <h1 className="text-lg font-semibold text-gray-900">Chats</h1>
                        <button onClick={() => navigate('/dashboard')} className="p-2">
                            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Mobile Tab Navigation */}
                <div className="flex border-b">
                    <button
                        onClick={() => handleTabChange('messaging')}
                        className={`flex-1 px-4 py-3 text-sm font-medium ${activeTab === 'messaging'
                            ? 'text-blue-600 border-b-2 border-blue-600'
                            : 'text-gray-500'
                            }`}
                    >
                        Messaging
                    </button>
                    <button
                        onClick={() => handleTabChange('teams')}
                        className={`flex-1 px-4 py-3 text-sm font-medium ${activeTab === 'teams'
                            ? 'text-blue-600 border-b-2 border-blue-600'
                            : 'text-gray-500'
                            }`}
                    >
                        Teams
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {activeTab === 'messaging' && (
                        <>
                            {/* Mobile Search Bar */}
                            <div className="p-4">
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Search chats..."
                                        value={chatSearchTerm}
                                        onChange={(e) => setChatSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M10 18a8 8 0 100-16 8 8 0 000 16z" />
                                        </svg>
                                    </span>
                                </div>
                            </div>

                            {/* Mobile Recent Chats */}
                            {chats.filter(chat => {
                                const otherUser = getOtherUser(chat);
                                if (!otherUser) return false;
                                return otherUser.displayName?.toLowerCase().includes(chatSearchTerm.toLowerCase());
                            }).length > 0 && (
                                    <div className="p-4 border-t border-gray-200">
                                        <h3 className="text-sm font-medium text-gray-700 mb-3">Recent Chats</h3>
                                        <div className="space-y-1">
                                            {chats.filter(chat => {
                                                const otherUser = getOtherUser(chat);
                                                if (!otherUser) return false;
                                                return otherUser.displayName?.toLowerCase().includes(chatSearchTerm.toLowerCase());
                                            }).map((chat) => {
                                                const otherUser = getOtherUser(chat);
                                                if (!otherUser) return null;

                                                return (
                                                    <button
                                                        key={chat.id}
                                                        onClick={() => selectChat(chat)}
                                                        className="w-full p-3 text-left hover:bg-gray-50 rounded-lg flex items-center space-x-3"
                                                    >
                                                        <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
                                                            {otherUser.photo ? (
                                                                <img src={otherUser.photo} alt={otherUser.displayName} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <span className="text-gray-600 font-semibold">{otherUser.displayName[0]?.toUpperCase()}</span>
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center justify-between">
                                                                <p className="text-sm font-medium text-gray-900 truncate">{otherUser.displayName}</p>
                                                                {chat.unreadCount && chat.unreadCount > 0 ? (
                                                                    <span className="bg-green-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                                                                        {chat.unreadCount}
                                                                    </span>
                                                                ) : null}
                                                            </div>
                                                            {chat.lastMessage && (
                                                                <p className="text-xs text-gray-500 truncate">
                                                                    {chat.lastMessage.senderId === currentUserId ? 'You: ' : ''}
                                                                    {chat.lastMessage.content}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                        </>
                    )}

                    {activeTab === 'teams' && (
                        <>
                            {/* Mobile Teams Search Bar */}
                            <div className="p-4 border-b border-gray-200">
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Search teams..."
                                        value={teamSearchTerm}
                                        onChange={(e) => setTeamSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                                        <svg
                                            className="w-5 h-5"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M21 21l-4.35-4.35M10 18a8 8 0 100-16 8 8 0 000 16z"
                                            />
                                        </svg>
                                    </span>
                                </div>
                            </div>

                            <div className="p-4">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-medium text-gray-700">My Teams</h3>
                                    <button
                                        onClick={() => setShowCreateTeamModal(true)}
                                        className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
                                        title="Create Team"
                                    >
                                        <svg
                                            className="w-5 h-5"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                            />
                                        </svg>
                                    </button>
                                </div>

                                {teams.filter(
                                    (team) =>
                                        team.title?.toLowerCase().includes(teamSearchTerm.toLowerCase()) ||
                                        team.description?.toLowerCase().includes(teamSearchTerm.toLowerCase()) ||
                                        team.gameName?.toLowerCase().includes(teamSearchTerm.toLowerCase())
                                ).length === 0 ? (
                                    <div className="text-center text-gray-500 py-8">
                                        <svg
                                            className="w-12 h-12 mx-auto mb-4 text-gray-300"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                                            />
                                        </svg>
                                        <p className="text-sm">
                                            {teamSearchTerm ? "No teams found matching your search" : "No teams yet"}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            {teamSearchTerm
                                                ? "Try a different search term"
                                                : "Create a team to start group conversations"}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {teams
                                            .filter(
                                                (team) =>
                                                    team.title?.toLowerCase().includes(teamSearchTerm.toLowerCase()) ||
                                                    team.description?.toLowerCase().includes(teamSearchTerm.toLowerCase()) ||
                                                    team.gameName?.toLowerCase().includes(teamSearchTerm.toLowerCase())
                                            )
                                            .map((team) => (
                                                <div
                                                    key={team.id}
                                                    className="p-3 bg-gray-50 rounded-lg flex items-center space-x-3 hover:bg-gray-100 cursor-pointer transition-colors"
                                                    onClick={() => selectTeam(team)}
                                                >
                                                    <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
                                                        {team.photo ? (
                                                            <img
                                                                src={team.photo}
                                                                alt={team.title}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <span className="text-gray-600 font-semibold text-sm">
                                                                {team.title[0]?.toUpperCase()}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-gray-900 truncate">{team.title}</p>
                                                        <p className="text-xs text-gray-500 truncate">{team.description || "No description"}</p>
                                                        <div className="flex items-center space-x-2 mt-1">
                                                            <span className="text-xs text-gray-500">{team.game?.name}</span>
                                                            {team.isPublic ? (
                                                                <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">Public</span>
                                                            ) : (
                                                                <span className="text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded-full">Private</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>

                {/* Modal is rendered below after its declaration to avoid hoisting issues */}
            </div>
        );
        // Desktop view - WhatsApp Web style
        return (
            <div className="h-screen bg-gray-100 flex" onKeyDown={handleKeyDown} tabIndex={0}>
                {/* Desktop Sidebar */}
                <div
                    className="bg-white border-r border-gray-200 flex flex-col relative"
                    style={{ width: `${mainSidebarWidth}px` }}
                >
                    {/* Desktop Header */}
                    <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 relative">
                        <div className="flex items-center justify-between">
                            <h1 className="text-lg font-semibold text-gray-900">Chats</h1>
                            {activeTab === 'messaging' && (
                                <button
                                    onClick={() => setShowFriendsList(!showFriendsList)}
                                    className="p-2 text-gray-500 hover:text-gray-700"
                                    title={showFriendsList ? "Hide Friends" : "Show Friends"}
                                >
                                    {showFriendsList ? (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    ) : (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                        </svg>
                                    )}
                                </button>
                            )}
                        </div>

                        {/* Friends Dropdown */}
                        {showFriendsList && (
                            <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 shadow-lg z-10 max-h-64 overflow-y-auto">
                                <div className="p-3">
                                    <h3 className="text-sm font-medium text-gray-700 mb-3">All Friends</h3>
                                    {friends.length === 0 ? (
                                        <div className="text-center text-gray-500 py-4">
                                            <p className="text-sm">No friends yet</p>
                                            <p className="text-xs text-gray-400 mt-1">Add friends to start chatting</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-1">
                                            {friends.map((friend) => (
                                                <button
                                                    key={friend.user_id}
                                                    onClick={() => {
                                                        startChatWithFriend(friend.user_id);
                                                        setShowFriendsList(false);
                                                    }}
                                                    className="w-full p-2 text-left hover:bg-gray-50 rounded-lg flex items-center space-x-3"
                                                >
                                                    <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
                                                        {friend.photo ? (
                                                            <img src={friend.photo} alt={friend.displayName} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <span className="text-gray-600 font-semibold text-xs">{friend.displayName[0]?.toUpperCase()}</span>
                                                        )}
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-sm font-medium text-gray-900">{friend.displayName}</p>
                                                        <p className="text-xs text-gray-500">Click to start chat</p>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Desktop Tab Navigation */}
                    <div className="flex border-b">
                        <button
                            onClick={() => handleTabChange('messaging')}
                            className={`flex-1 px-4 py-3 text-sm font-medium ${activeTab === 'messaging'
                                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Messaging
                        </button>
                        <button
                            onClick={() => handleTabChange('teams')}
                            className={`flex-1 px-4 py-3 text-sm font-medium ${activeTab === 'teams'
                                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Teams
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {activeTab === 'messaging' && (
                            <>
                                {/* Desktop Search Bar */}
                                <div className="p-4 border-b border-gray-200">
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="Search chats..."
                                            value={chatSearchTerm}
                                            onChange={(e) => setChatSearchTerm(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M10 18a8 8 0 100-16 8 8 0 000 16z" />
                                            </svg>
                                        </span>
                                    </div>
                                </div>


                                {/* Desktop Recent Chats */}
                                <div className="p-4">
                                    <h3 className="text-sm font-medium text-gray-700 mb-3">Recent Chats</h3>
                                    {chats.filter(chat => {
                                        const otherUser = getOtherUser(chat);
                                        if (!otherUser) return false;
                                        return otherUser.displayName?.toLowerCase().includes(chatSearchTerm.toLowerCase());
                                    }).length === 0 ? (
                                        <div className="text-center text-gray-500 py-4">
                                            <p className="text-sm">
                                                {chatSearchTerm ? 'No chats found matching your search' : 'No chats yet'}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                {chatSearchTerm ? 'Try a different search term' : 'Start a conversation with a friend'}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-1">
                                            {chats.filter(chat => {
                                                const otherUser = getOtherUser(chat);
                                                if (!otherUser) return false;
                                                return otherUser.displayName?.toLowerCase().includes(chatSearchTerm.toLowerCase());
                                            }).map((chat) => {
                                                const otherUser = getOtherUser(chat);
                                                if (!otherUser) return null;

                                                return (
                                                    <button
                                                        key={chat.id}
                                                        onClick={() => selectChat(chat)}
                                                        className={`w-full p-3 text-left hover:bg-gray-50 rounded-lg flex items-center space-x-3 ${selectedChat?.id === chat.id ? 'bg-blue-50 border border-blue-200' : ''
                                                            }`}
                                                    >
                                                        <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
                                                            {otherUser.photo ? (
                                                                <img src={otherUser.photo} alt={otherUser.displayName} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <span className="text-gray-600 font-semibold text-sm">{otherUser.displayName[0]?.toUpperCase()}</span>
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center justify-between">
                                                                <p className="text-sm font-medium text-gray-900 truncate">{otherUser.displayName}</p>
                                                                {chat.unreadCount && chat.unreadCount > 0 ? (
                                                                    <span className="bg-green-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                                                                        {chat.unreadCount}
                                                                    </span>
                                                                ) : null}
                                                            </div>
                                                            {chat.lastMessage && (
                                                                <p className="text-xs text-gray-500 truncate">
                                                                    {chat.lastMessage.senderId === currentUserId ? 'You: ' : ''}
                                                                    {chat.lastMessage.content}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </>
                        )}

                        {activeTab === 'teams' && (
                            <div className="p-4">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-medium text-gray-700">My Teams</h3>
                                    <button
                                        onClick={() => setShowCreateTeamModal(true)}
                                        className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
                                        title="Create Team"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                        </svg>
                                    </button>
                                </div>
                                {/* Search Bar */}
                                <div className="relative mb-4">
                                    <input
                                        type="text"
                                        placeholder="Search teams..."
                                        value={teamSearchTerm}
                                        onChange={(e) => setTeamSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M10 18a8 8 0 100-16 8 8 0 000 16z" />
                                        </svg>
                                    </span>
                                </div>
                                {teams.filter(team =>
                                    team.title?.toLowerCase().includes(teamSearchTerm.toLowerCase()) ||
                                    team.description?.toLowerCase().includes(teamSearchTerm.toLowerCase()) ||
                                    team.gameName?.toLowerCase().includes(teamSearchTerm.toLowerCase())
                                ).length === 0 ? (
                                    <div className="text-center text-gray-500 py-8">
                                        <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                        <p className="text-sm">
                                            {teamSearchTerm ? 'No teams found matching your search' : 'No teams yet'}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            {teamSearchTerm ? 'Try a different search term' : 'Create a team to start group conversations'}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {teams.filter(team =>
                                            team.title?.toLowerCase().includes(teamSearchTerm.toLowerCase()) ||
                                            team.description?.toLowerCase().includes(teamSearchTerm.toLowerCase()) ||
                                            team.gameName?.toLowerCase().includes(teamSearchTerm.toLowerCase())
                                        ).map((team) => (
                                            <div key={team.id} className="p-3 bg-gray-50 rounded-lg flex items-center space-x-3 hover:bg-gray-100 cursor-pointer transition-colors" onClick={() => selectTeam(team)}>
                                                <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
                                                    {team.photo ? (
                                                        <img src={team.photo} alt={team.title} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="text-gray-600 font-semibold text-sm">{team.title[0]?.toUpperCase()}</span>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-900 truncate">{team.title}</p>
                                                    <p className="text-xs text-gray-500 truncate">{team.description || 'No description'}</p>
                                                    <div className="flex items-center space-x-2 mt-1">
                                                        <span className="text-xs text-gray-500">{team.game?.name}</span>
                                                        {team.isPublic ? (
                                                            <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">Public</span>
                                                        ) : (
                                                            <span className="text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded-full">Private</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Resizable Handle for Main Sidebar */}
                    <div
                        className="absolute top-0 right-0 w-1 h-full bg-gray-300 hover:bg-blue-500 cursor-col-resize transition-colors"
                        onMouseDown={handleMainMouseDown}
                    />
                </div>

                {/* Desktop Chat Area */}
                <div className="flex-1 flex flex-col">
                    {selectedChat || selectedTeam ? (
                        <>
                            {/* Desktop Chat/Team Header */}
                            <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <button
                                        onClick={() => {
                                            setSelectedChat(null);
                                            setSelectedTeam(null);
                                        }}
                                        className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
                                        title="Go back to chat selection"
                                    >
                                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                        </svg>
                                    </button>
                                    <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
                                        {selectedChat ? (
                                            (() => {
                                                const otherUser = selectedChat ? getOtherUser(selectedChat!) : undefined;
                                                const displayName = otherUser?.displayName ?? '';
                                                const photoSrc = otherUser?.photo;
                                                if (photoSrc) {
                                                    return (
                                                        <img src={photoSrc} alt={displayName} className="w-full h-full object-cover" />
                                                    );
                                                }
                                                return (
                                                    <span className="text-gray-600 font-semibold">{displayName ? displayName[0]?.toUpperCase() : ''}</span>
                                                );
                                            })()
                                        ) : selectedTeam ? (
                                            <span className="text-gray-600 font-semibold">{selectedTeam.title[0]?.toUpperCase()}</span>
                                        ) : null}
                                    </div>
                                    {selectedTeam ? (
                                        <button
                                            onClick={() => setShowTeamDetails(!showTeamDetails)}
                                            className="text-left"
                                        >
                                            <h3 className="text-sm font-medium text-gray-900 hover:text-blue-600">
                                                {selectedTeam.title}
                                            </h3>
                                            <p className="text-xs text-gray-500">
                                                {selectedTeam?.members ? `${selectedTeam.members.length} members` : ''}
                                            </p>
                                        </button>
                                    ) : (
                                        <div>
                                            <h3 className="text-sm font-medium text-gray-900">
                                                {selectedChat ? getOtherUser(selectedChat!)?.displayName : null}
                                            </h3>
                                            <p className="text-xs text-gray-500"></p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Desktop Messages */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
                                {selectedChat ? (
                                    messages.map((message) => (
                                        <div
                                            key={message.id}
                                            className={`flex ${message.sender.user_id === currentUserId ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div
                                                className={`max-w-[70%] px-4 py-2 rounded-2xl ${message.sender.user_id === currentUserId
                                                    ? 'bg-blue-500 text-white rounded-br-md'
                                                    : 'bg-white text-gray-900 rounded-bl-md shadow-sm'
                                                    }`}
                                            >
                                                <p className="text-sm">{message.content}</p>
                                                <p className={`text-xs mt-1 ${message.sender.user_id === currentUserId ? 'text-blue-100' : 'text-gray-500'
                                                    }`}>
                                                    {new Date(message.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                ) : selectedTeam ? (
                                    teamMessages.map((message) => (
                                        <div
                                            key={message.id}
                                            className={`flex ${message.sender.user_id === currentUserId ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div
                                                className={`max-w-[70%] px-4 py-2 rounded-2xl ${message.sender.user_id === currentUserId
                                                    ? 'bg-blue-500 text-white rounded-br-md'
                                                    : 'bg-white text-gray-900 rounded-bl-md shadow-sm'
                                                    }`}
                                            >
                                                {message.sender.user_id !== currentUserId && (
                                                    <p className="text-xs font-medium text-gray-600 mb-1">
                                                        {message.sender.displayName}
                                                    </p>
                                                )}
                                                <p className="text-sm">{message.content}</p>
                                                <p className={`text-xs mt-1 ${message.sender.user_id === currentUserId ? 'text-blue-100' : 'text-gray-500'
                                                    }`}>
                                                    {new Date(message.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                ) : null}
                            </div>

                            {/* Desktop Message Input */}
                            <div className="bg-white border-t border-gray-200 p-4">
                                <div className="flex items-center space-x-3">
                                    <button className="p-2 text-gray-500 hover:text-gray-700">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                        </svg>
                                    </button>
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
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4-.8L3 20l.8-3.2A8.96 8.96 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">Chat & Teams</h3>
                                <p className="text-sm">Select a chat or team to start messaging</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Desktop Team Details Mini Window */}
                {showTeamDetails && selectedTeam && (
                    <div
                        className="absolute top-16 left-1/3 w-[900px] h-[600px] bg-white border border-gray-200 shadow-lg z-50 rounded-lg"
                        data-team-details
                    >
                        <div className="h-full flex flex-col">
                            {/* Mini Window Header */}
                            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                                <h3 className="text-xl font-semibold text-gray-900">Team Info</h3>
                                <button
                                    onClick={() => setShowTeamDetails(false)}
                                    className="p-2 hover:bg-gray-200 rounded-full"
                                >
                                    <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            {/* Mini Window Content - Resizable Sidebar Layout */}
                            <div className="flex-1 flex overflow-hidden">
                                {/* Left Sidebar - Navigation */}
                                <div
                                    className="bg-gray-50 border-r border-gray-200 flex flex-col relative"
                                    style={{ width: `${sidebarWidth}px` }}
                                >
                                    <div className="p-4">
                                        <h4 className="text-sm font-medium text-gray-700 mb-3">Navigation</h4>
                                        <nav className="space-y-1">
                                            <button
                                                onClick={() => setTeamDetailsActiveTab('overview')}
                                                className={`w-full text-left px-3 py-2 text-sm font-medium rounded-md transition-colors ${teamDetailsActiveTab === 'overview'
                                                    ? 'text-blue-600 bg-blue-50'
                                                    : 'text-gray-600 hover:bg-gray-100'
                                                    }`}
                                            >
                                                Overview
                                            </button>
                                            <button
                                                onClick={() => setTeamDetailsActiveTab('members')}
                                                className={`w-full text-left px-3 py-2 text-sm font-medium rounded-md transition-colors ${teamDetailsActiveTab === 'members'
                                                    ? 'text-blue-600 bg-blue-50'
                                                    : 'text-gray-600 hover:bg-gray-100'
                                                    }`}
                                            >
                                                Members
                                            </button>
                                        </nav>
                                    </div>

                                    {/* Team Photo in Sidebar */}
                                    <div className="p-4 border-t border-gray-200">
                                        <div className="flex justify-center mb-4">
                                            <div className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
                                                {selectedTeam.photo ? (
                                                    <img src={selectedTeam.photo} alt={selectedTeam.title} className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="text-gray-600 font-semibold text-lg">{selectedTeam.title[0]?.toUpperCase()}</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-center space-x-1">
                                            {editingField === 'teamName' ? (
                                                <input
                                                    type="text"
                                                    value={editValue}
                                                    onChange={(e) => setEditValue(e.target.value)}
                                                    onKeyPress={handleEditKeyPress}
                                                    onBlur={saveEdit}
                                                    className="text-sm font-medium text-gray-900 text-center bg-white border border-blue-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                    autoFocus
                                                />
                                            ) : (
                                                <>
                                                    <h5 className="text-sm font-medium text-gray-900 text-center">{selectedTeam.title}</h5>
                                                    {teamMembers.find(member => member.userId === currentUserId)?.isAdmin && (
                                                        <button
                                                            onClick={() => startEditing('teamName')}
                                                            className="p-1 hover:bg-gray-200 rounded-full"
                                                        >
                                                            <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                            </svg>
                                                        </button>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Resizable Handle */}
                                    <div
                                        className="absolute top-0 right-0 w-1 h-full bg-gray-300 hover:bg-blue-500 cursor-col-resize transition-colors"
                                        onMouseDown={handleMouseDown}
                                    />
                                </div>

                                {/* Right Content Area */}
                                <div className="flex-1 flex flex-col">
                                    {teamDetailsActiveTab === 'overview' ? (
                                        /* Overview Section */
                                        <div className="flex-1 p-6 overflow-y-auto">
                                            <div className="mb-6">
                                                <h4 className="text-lg font-medium text-gray-700">Overview</h4>
                                            </div>

                                            {/* Team Info */}
                                            <div className="space-y-4">
                                                <div className="bg-gray-50 rounded-lg p-4">
                                                    <h5 className="text-sm font-medium text-gray-600 mb-2">Game</h5>
                                                    <p className="text-gray-900">{selectedTeam.game?.name || 'No game specified'}</p>
                                                </div>

                                                <div className="bg-gray-50 rounded-lg p-4">
                                                    <h5 className="text-sm font-medium text-gray-600 mb-2">Created</h5>
                                                    <p className="text-gray-900">{new Date(selectedTeam.createdAt).toLocaleDateString()}</p>
                                                </div>

                                                <div className="bg-gray-50 rounded-lg p-4">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <h5 className="text-sm font-medium text-gray-600">Description</h5>
                                                        {teamMembers.find(member => member.userId === currentUserId)?.isAdmin && (
                                                            <button
                                                                onClick={() => startEditing('description')}
                                                                className="p-1 hover:bg-gray-200 rounded-full"
                                                            >
                                                                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                                </svg>
                                                            </button>
                                                        )}
                                                    </div>
                                                    {editingField === 'description' ? (
                                                        <textarea
                                                            value={editValue}
                                                            onChange={(e) => setEditValue(e.target.value)}
                                                            onKeyPress={handleEditKeyPress}
                                                            onBlur={saveEdit}
                                                            className="w-full text-gray-900 bg-white border border-blue-300 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                                                            rows={3}
                                                            autoFocus
                                                        />
                                                    ) : (
                                                        <p className="text-gray-900">{selectedTeam.description || 'No description provided'}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        /* Members Section */
                                        <div className="flex-1 p-6 overflow-y-auto">
                                            <div className="flex items-center justify-between mb-6">
                                                <h4 className="text-lg font-medium text-gray-700">Members</h4>
                                                <span className="text-sm text-gray-500">
                                                    {teamMembers.length} member{teamMembers.length !== 1 ? 's' : ''}
                                                </span>
                                            </div>

                                            {/* Search Bar */}
                                            <div className="relative mb-4">
                                                <input
                                                    type="text"
                                                    placeholder="Search members..."
                                                    value={membersSearchTerm}
                                                    onChange={(e) => setMembersSearchTerm(e.target.value)}
                                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                />
                                                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M10 18a8 8 0 100-16 8 8 0 000 16z" />
                                                    </svg>
                                                </span>
                                            </div>

                                            {/* Members List */}
                                            <div className="space-y-3">
                                                {teamMembers
                                                    .filter(member =>
                                                        member.displayName?.toLowerCase().includes(membersSearchTerm.toLowerCase())
                                                    )
                                                    .map((member) => (
                                                        <div key={member.id} className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg relative member-menu-container">
                                                            <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
                                                                {member.photo ? (
                                                                    <img src={member.photo} alt={member.displayName} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <span className="text-gray-600 font-semibold">{member.displayName[0]?.toUpperCase()}</span>
                                                                )}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-medium text-gray-900 truncate">
                                                                    {member.displayName}
                                                                    {member.userId === currentUserId && (
                                                                        <span className="text-blue-600 font-normal"> (you)</span>
                                                                    )}
                                                                </p>
                                                                <p className="text-xs text-gray-500">
                                                                    Joined {new Date(member.joinedAt).toLocaleDateString()}
                                                                </p>
                                                            </div>
                                                            <div className="flex items-center space-x-2">
                                                                {member.isAdmin && (
                                                                    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                                                                        Admin
                                                                    </span>
                                                                )}
                                                                {teamMembers.find(m => m.userId === currentUserId)?.isAdmin && member.userId !== currentUserId && (
                                                                    <button
                                                                        onClick={(e) => openMemberMenu(member, e)}
                                                                        className="p-1 hover:bg-gray-200 rounded-full"
                                                                    >
                                                                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                                                        </svg>
                                                                    </button>
                                                                )}
                                                            </div>

                                                            {/* Member Action Menu */}
                                                            {showMemberMenu === member.id && (
                                                                <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                                                                    <div className="py-1">
                                                                        {!member.isAdmin && (
                                                                            <button
                                                                                onClick={makeMemberAdmin}
                                                                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                                            >
                                                                                Make Admin
                                                                            </button>
                                                                        )}
                                                                        <button
                                                                            onClick={removeMemberFromGroup}
                                                                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                                                        >
                                                                            Remove from Group
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <CreateTeamModal
                    isOpen={showCreateTeamModal}
                    onClose={() => setShowCreateTeamModal(false)}
                    onCreateTeam={handleCreateTeam}
                />
            </div>
        );
    };
};
export default ChatPage;