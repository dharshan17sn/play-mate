import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiService, type TeamSummary } from '../services/api';
import { getSocket } from '../services/socket';

type ChatListItem = {
    id: string;
    userAId: string;
    userBId: string;
    createdAt: string | Date;
    updatedAt: string | Date;
    userA: { user_id: string; displayName: string; photo?: string | null };
    userB: { user_id: string; displayName: string; photo?: string | null };
    lastMessage?: { id: string; content: string; sentAt: string | Date; senderId: string };
    unreadCount?: number;
};

type DirectMessage = {
    id: string;
    chatId: string;
    content: string;
    sentAt: string | Date;
    sender: { user_id: string; displayName: string; photo?: string | null } | string;
};

type TeamMessage = {
    id: string;
    teamId: string;
    content: string;
    sentAt: string | Date;
    sender: { user_id: string; displayName: string; photo?: string | null } | string;
};

export default function ChatPage() {
    const navigate = useNavigate();
    const { chatId: routeChatId, teamId: routeTeamId } = useParams();
    // Responsive state
    const [viewportWidth, setViewportWidth] = useState<number>(typeof window !== 'undefined' ? window.innerWidth : 1024);
    const isMobile = viewportWidth <= 768;
    const isTablet = viewportWidth > 768 && viewportWidth < 1200;
    const [activeTab, setActiveTab] = useState<'messages' | 'teams'>(() => {
        const url = new URL(window.location.href);
        const tab = url.searchParams.get('tab');
        return tab === 'teams' ? 'teams' : 'messages';
    });
    const [loadingChats, setLoadingChats] = useState(false);
    const [loadingTeams, setLoadingTeams] = useState(false);
    const [chats, setChats] = useState<ChatListItem[]>([]);
    const [teams, setTeams] = useState<TeamSummary[]>([]);
    const [error, setError] = useState<string | null>(null);

    const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
    const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
    const [conversation, setConversation] = useState<(DirectMessage | TeamMessage)[]>([]);
    const [isLoadingConversation, setIsLoadingConversation] = useState(false);
    const [messageInput, setMessageInput] = useState('');

    // Create Team modal state
    const [isCreateTeamOpen, setIsCreateTeamOpen] = useState(false);
    const [isCreatingTeam, setIsCreatingTeam] = useState(false);
    const [createTeamForm, setCreateTeamForm] = useState({
        title: '',
        gameName: '',
        description: '',
        photo: '',
        noOfPlayers: '' as string | number,
        isPublic: true,
    });
    const [createTeamPhotoPreview, setCreateTeamPhotoPreview] = useState<string | null>(null);
    const [availableGames, setAvailableGames] = useState<{ id?: string; name: string }[]>([]);
    const [isLoadingGames, setIsLoadingGames] = useState(false);

    // Friends dropdown for starting new chat
    const [isFriendsDropdownOpen, setIsFriendsDropdownOpen] = useState(false);
    const [isLoadingFriends, setIsLoadingFriends] = useState(false);
    const [friends, setFriends] = useState<Array<{ user_id: string; displayName: string; photo?: string }>>([]);
    const [friendSearch, setFriendSearch] = useState('');

    // Search state
    const [messageSearch, setMessageSearch] = useState('');
    const [teamSearch, setTeamSearch] = useState('');

    const scrollRef = useRef<HTMLDivElement | null>(null);

    const currentUserId = useMemo(() => apiService.getUserIdFromToken(), []);

    useEffect(() => {
        // Load both in parallel on first mount
        let cancelled = false;
        async function load() {
            setError(null);
            setLoadingChats(true);
            setLoadingTeams(true);
            try {
                const [chatsRes, myTeams] = await Promise.all([
                    apiService.getUserChats(),
                    apiService.getMyTeams(),
                ]);
                if (!cancelled) {
                    const chatItems = (chatsRes.data as ChatListItem[]) || [];
                    setChats(chatItems);
                    setTeams(myTeams || []);
                }
            } catch (e: any) {
                if (!cancelled) setError(e?.message || 'Failed to load data');
            } finally {
                if (!cancelled) {
                    setLoadingChats(false);
                    setLoadingTeams(false);
                }
            }
        }
        load();
        return () => {
            cancelled = true;
        };
    }, []);

    // If friendId is present in query, open or create chat with that friend
    useEffect(() => {
        const url = new URL(window.location.href);
        const friendId = url.searchParams.get('friendId');
        if (!friendId) return;
        (async () => {
            try {
                const res = await apiService.getOrCreateChat(friendId);
                const chat = (res as any).data || res;
                const chatsRes = await apiService.getUserChats();
                const chatItems = (chatsRes as any).data || [];
                setChats(chatItems);
                setActiveTab('messages');
                setSelectedTeamId(null);
                setSelectedChatId(chat.id || chat.chatId || chat.chat?.id);
                setConversation([]);
            } catch (e: any) {
                setError(e?.message || 'Failed to start chat');
            } finally {
                // Clean the query param to avoid repeat
                const cleaned = new URL(window.location.href);
                cleaned.searchParams.delete('friendId');
                window.history.replaceState({}, document.title, cleaned.toString());
            }
        })();
    }, []);

    // Keep the tab in the URL so refresh preserves current tab (only when not in a specific chat/team route)
    useEffect(() => {
        const url = new URL(window.location.href);
        // If viewing specific chat/team via path, don't change URL params here
        if (routeChatId || routeTeamId) return;
        if (activeTab === 'teams') {
            url.searchParams.set('tab', 'teams');
        } else {
            url.searchParams.delete('tab');
        }
        window.history.replaceState({}, document.title, url.toString());
    }, [activeTab, routeChatId, routeTeamId]);

    // On small screens, navigate to dedicated routes when a chat/team is selected
    useEffect(() => {
        const isMobile = window.matchMedia('(max-width: 768px)').matches;
        if (!isMobile) return;
        if (activeTab === 'messages' && selectedChatId) {
            navigate(`/chat/c/${encodeURIComponent(selectedChatId)}`, { replace: true });
        } else if (activeTab === 'teams' && selectedTeamId) {
            navigate(`/chat/t/${encodeURIComponent(selectedTeamId)}`, { replace: true });
        }
    }, [activeTab, selectedChatId, selectedTeamId]);

    // Track viewport size for responsive layout adjustments
    useEffect(() => {
        function onResize() {
            setViewportWidth(window.innerWidth);
        }
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    // If route contains a chatId or teamId, select it (useful for mobile deep links). This persists on refresh too.
    useEffect(() => {
        if (routeChatId) {
            setActiveTab('messages');
            setSelectedTeamId(null);
            setSelectedChatId(routeChatId as string);
        } else if (routeTeamId) {
            setActiveTab('teams');
            setSelectedChatId(null);
            setSelectedTeamId(routeTeamId as string);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [routeChatId, routeTeamId]);

    // Load conversation when selection changes
    useEffect(() => {
        let cancelled = false;
        async function loadConversation() {
            if (!selectedChatId && !selectedTeamId) return;
            setIsLoadingConversation(true);
            try {
                if (selectedChatId) {
                    const res = await apiService.getChatMessages(selectedChatId, 50, 0);
                    if (!cancelled) setConversation((res.data as DirectMessage[]) || []);
                } else if (selectedTeamId) {
                    const res = await apiService.getTeamMessages(selectedTeamId);
                    if (!cancelled) setConversation((res.data as TeamMessage[]) || []);
                }
            } catch (e: any) {
                if (!cancelled) setError(e?.message || 'Failed to load conversation');
            } finally {
                if (!cancelled) setIsLoadingConversation(false);
            }
        }
        loadConversation();
        return () => {
            cancelled = true;
        };
    }, [selectedChatId, selectedTeamId]);

    // Load games when create team modal opens
    useEffect(() => {
        let cancelled = false;
        async function loadGames() {
            if (!isCreateTeamOpen) return;
            setIsLoadingGames(true);
            try {
                const games = await apiService.getGames();
                if (!cancelled) setAvailableGames(games || []);
            } catch (e) {
                if (!cancelled) setAvailableGames([]);
            } finally {
                if (!cancelled) setIsLoadingGames(false);
            }
        }
        loadGames();
        return () => { cancelled = true; };
    }, [isCreateTeamOpen]);

    // Socket listeners
    useEffect(() => {
        const socket = getSocket();

        function onChatMessage(payload: any) {
            // If the incoming message belongs to currently open chat, append
            if (selectedChatId && payload?.chatId === selectedChatId) {
                setConversation(prev => [
                    ...prev,
                    {
                        id: payload.id,
                        chatId: payload.chatId,
                        content: payload.content,
                        sentAt: payload.sentAt,
                        sender: payload.sender,
                    } as DirectMessage,
                ]);
            }
            // Update chat list lastMessage
            setChats(prev => prev.map(c => c.id === payload.chatId ? {
                ...c,
                lastMessage: {
                    id: payload.id,
                    content: payload.content,
                    sentAt: payload.sentAt,
                    senderId: typeof payload.sender === 'string' ? payload.sender : payload.sender?.user_id,
                },
                updatedAt: payload.sentAt,
            } : c));
        }

        function onChatMessageSent(payload: any) {
            if (selectedChatId && payload?.chatId === selectedChatId) {
                setConversation(prev => prev.map(m => m.id === payload.id ? {
                    ...(m as any),
                    // ensure fields reflect server copy if needed
                    sentAt: payload.sentAt,
                } : m));
            }
        }

        function onTeamMessage(payload: any) {
            if (selectedTeamId && payload?.teamId === selectedTeamId) {
                setConversation(prev => [
                    ...prev,
                    {
                        id: payload.id,
                        teamId: payload.teamId,
                        content: payload.content,
                        sentAt: payload.sentAt,
                        sender: payload.sender,
                    } as TeamMessage,
                ]);
            }
        }

        socket.on('chat:message', onChatMessage);
        socket.on('chat:message:sent', onChatMessageSent);
        socket.on('team:message', onTeamMessage);

        return () => {
            socket.off('chat:message', onChatMessage);
            socket.off('chat:message:sent', onChatMessageSent);
            socket.off('team:message', onTeamMessage);
        };
    }, [selectedChatId, selectedTeamId]);

    // Auto-scroll to bottom when conversation updates
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [conversation]);

    // ESC key to exit active conversation back to list
    useEffect(() => {
        function onKeyDown(e: KeyboardEvent) {
            if (e.key === 'Escape') {
                if (selectedChatId || selectedTeamId) {
                    setSelectedChatId(null);
                    setSelectedTeamId(null);
                    navigate('/chat', { replace: true });
                }
            }
        }
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [selectedChatId, selectedTeamId]);

    const recentChats = useMemo(() => {
        // Map chats to show the other participant and last message
        return chats.map(c => {
            const other = c.userA.user_id === currentUserId ? c.userB : c.userA;
            return {
                id: c.id,
                name: other.displayName,
                photo: other.photo || undefined,
                lastMessage: c.lastMessage?.content || '',
                lastAt: c.lastMessage?.sentAt || c.updatedAt,
                unreadCount: (c as any).unreadCount || 0,
            };
        });
    }, [chats, currentUserId]);

    const filteredRecentChats = useMemo(() => {
        const q = messageSearch.trim().toLowerCase();
        if (!q) return recentChats;
        return recentChats.filter(rc =>
            rc.name?.toLowerCase().includes(q) || rc.lastMessage?.toLowerCase().includes(q)
        );
    }, [recentChats, messageSearch]);

    const filteredTeams = useMemo(() => {
        const q = teamSearch.trim().toLowerCase();
        if (!q) return teams;
        return teams.filter(t =>
            t.title?.toLowerCase().includes(q) || (t.gameName || '').toLowerCase().includes(q)
        );
    }, [teams, teamSearch]);

    const selectedHeader = useMemo(() => {
        if (activeTab === 'messages' && selectedChatId) {
            const chat = chats.find(c => c.id === selectedChatId);
            if (!chat) return { title: 'Chat' };
            const other = chat.userA.user_id === currentUserId ? chat.userB : chat.userA;
            return { title: other.displayName, photo: other.photo || undefined };
        }
        if (activeTab === 'teams' && selectedTeamId) {
            const team = teams.find(t => t.id === selectedTeamId);
            if (!team) return { title: 'Team' };
            return { title: team.title };
        }
        return null;
    }, [activeTab, selectedChatId, selectedTeamId, chats, teams, currentUserId]);

    // no-op placeholder removed

    async function handleSend() {
        const text = messageInput.trim();
        if (!text) return;

        try {
            if (activeTab === 'messages' && selectedChatId) {
                // optimistic append with temp id
                const tempId = `temp-${Date.now()}`;
                const optimistic: DirectMessage = {
                    id: tempId,
                    chatId: selectedChatId,
                    content: text,
                    sentAt: new Date().toISOString(),
                    sender: currentUserId || 'me',
                } as any;
                setConversation(prev => [...prev, optimistic]);
                setMessageInput('');

                const res = await apiService.sendMessage(selectedChatId, text);
                const saved = res.data;
                // replace temp if ids differ
                setConversation(prev => prev.map(m => (m as any).id === tempId ? {
                    id: saved.id,
                    chatId: saved.chatId,
                    content: saved.content,
                    sentAt: saved.sentAt,
                    sender: saved.sender,
                } as DirectMessage : m));
            } else if (activeTab === 'teams' && selectedTeamId) {
                const tempId = `temp-${Date.now()}`;
                const optimistic: TeamMessage = {
                    id: tempId,
                    teamId: selectedTeamId,
                    content: text,
                    sentAt: new Date().toISOString(),
                    sender: currentUserId || 'me',
                } as any;
                setConversation(prev => [...prev, optimistic]);
                setMessageInput('');

                const res = await apiService.sendTeamMessage(selectedTeamId, text);
                const saved = res.data;
                setConversation(prev => prev.map(m => (m as any).id === tempId ? {
                    id: saved.id,
                    teamId: saved.teamId,
                    content: saved.content,
                    sentAt: saved.sentAt,
                    sender: saved.sender,
                } as TeamMessage : m));
            }
        } catch (e: any) {
            setError(e?.message || 'Failed to send message');
        }
    }

    const hasActiveConversation = !!selectedHeader || !!routeChatId || !!routeTeamId;
    const showListPanel = !(isMobile && hasActiveConversation);

    return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#f5f6f6' }}>

            {error && (
                <div style={{ color: '#b91c1c', padding: '8px 16px' }}>{error}</div>
            )}

            <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
                {/* Left list - hidden on mobile when a conversation is open */}
                {showListPanel && (
                    <div style={{ width: isMobile ? '100%' : (isTablet ? 320 : 360), borderRight: isMobile ? 'none' : '1px solid #eee', display: 'flex', flexDirection: 'column', background: '#fff' }}>
                        <div style={{ padding: 14, borderBottom: '1px solid #f2f2f2', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, position: 'relative' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <button onClick={() => navigate('/dashboard')} title="Back" style={{ border: '1px solid #e5e7eb', background: '#fff', borderRadius: 6, width: 28, height: 28, lineHeight: '26px', textAlign: 'center', cursor: 'pointer' }}>{'←'}</button>
                                <span style={{ fontSize: 18 }}>Chats</span>
                            </div>
                            {activeTab === 'messages' && (
                                <div>
                                    <button
                                        onClick={async () => {
                                            setIsFriendsDropdownOpen(prev => !prev);
                                            if (!isFriendsDropdownOpen && friends.length === 0) {
                                                setIsLoadingFriends(true);
                                                try {
                                                    const list = await apiService.listFriends();
                                                    setFriends(list || []);
                                                } catch (e) {
                                                    setError((e as any)?.message || 'Failed to load friends');
                                                } finally {
                                                    setIsLoadingFriends(false);
                                                }
                                            }
                                        }}
                                        title="New chat"
                                        style={{
                                            border: '1px solid #e5e7eb',
                                            background: '#fff',
                                            borderRadius: 6,
                                            width: 28,
                                            height: 28,
                                            lineHeight: '26px',
                                            textAlign: 'center',
                                            cursor: 'pointer',
                                            color: '#111827',
                                            fontWeight: 700,
                                        }}
                                    >
                                        {isFriendsDropdownOpen ? '×' : '+'}
                                    </button>
                                    {isFriendsDropdownOpen && (
                                        <div style={{ position: 'absolute', top: 44, left: 12, right: 12, background: '#fff', border: '1px solid #eee', boxShadow: '0 8px 20px rgba(0,0,0,0.08)', borderRadius: 8, zIndex: 40, maxHeight: 280, overflowY: 'auto' }}>
                                            <div style={{ padding: 8, borderBottom: '1px solid #f2f2f2', fontWeight: 600, color: '#6b7280' }}>Start new chat</div>
                                            <div style={{ padding: 8, borderBottom: '1px solid #f2f2f2' }}>
                                                <input
                                                    value={friendSearch}
                                                    onChange={(e) => setFriendSearch(e.target.value)}
                                                    placeholder="Search friends"
                                                    style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 10px', fontSize: 14 }}
                                                />
                                            </div>
                                            {isLoadingFriends ? (
                                                <div style={{ padding: 12 }}>Loading…</div>
                                            ) : friends.length === 0 ? (
                                                <div style={{ padding: 12, color: '#6b7280' }}>No friends found</div>
                                            ) : (
                                                <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                                                    {(friends.filter(f => {
                                                        const q = friendSearch.trim().toLowerCase();
                                                        if (!q) return true;
                                                        return (f.displayName || '').toLowerCase().includes(q);
                                                    })).length === 0 ? (
                                                        <li style={{ padding: 12, color: '#6b7280' }}>No matches</li>
                                                    ) : (friends.filter(f => {
                                                        const q = friendSearch.trim().toLowerCase();
                                                        if (!q) return true;
                                                        return (f.displayName || '').toLowerCase().includes(q);
                                                    })).map(f => (
                                                        <li key={f.user_id}
                                                            onClick={async () => {
                                                                try {
                                                                    const res = await apiService.getOrCreateChat(f.user_id);
                                                                    const chat = (res.data as any) || res;
                                                                    const chatsRes = await apiService.getUserChats();
                                                                    const chatItems = (chatsRes.data as any[]) || [];
                                                                    setChats(chatItems);
                                                                    setActiveTab('messages');
                                                                    setSelectedTeamId(null);
                                                                    setSelectedChatId(chat.id || chat.chatId || chat.chat?.id);
                                                                    setConversation([]);
                                                                    setIsFriendsDropdownOpen(false);
                                                                    setFriendSearch('');
                                                                } catch (e) {
                                                                    setError((e as any)?.message || 'Failed to start chat');
                                                                }
                                                            }}
                                                            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', cursor: 'pointer', borderBottom: '1px solid #f6f6f6' }}
                                                        >
                                                            <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                                                {f.photo ? (
                                                                    <img src={f.photo} alt={f.displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                                ) : (
                                                                    <span style={{ fontWeight: 600 }}>{f.displayName?.[0] ?? '?'}</span>
                                                                )}
                                                            </div>
                                                            <div style={{ fontWeight: 600 }}>{f.displayName}</div>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid #f2f2f2' }}>
                            <button
                                onClick={() => { setActiveTab('messages'); setSelectedTeamId(null); setSelectedChatId(null); setConversation([]); }}
                                style={{
                                    flex: 1,
                                    padding: '10px 12px',
                                    border: 'none',
                                    borderRight: '1px solid #f2f2f2',
                                    background: activeTab === 'messages' ? '#e9f2ff' : '#fff',
                                    color: activeTab === 'messages' ? '#1d4ed8' : '#6b7280',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                }}
                            >
                                Messaging
                            </button>
                            <button
                                onClick={() => { setActiveTab('teams'); setSelectedChatId(null); setConversation([]); }}
                                style={{
                                    flex: 1,
                                    padding: '10px 12px',
                                    border: 'none',
                                    background: activeTab === 'teams' ? '#e9f2ff' : '#fff',
                                    color: activeTab === 'teams' ? '#1d4ed8' : '#6b7280',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                }}
                            >
                                Teams
                            </button>
                        </div>
                        <div style={{ overflowY: 'auto' }}>
                            {activeTab === 'messages' && (
                                <>
                                    <div style={{ padding: '8px 12px', borderBottom: '1px solid #f2f2f2', background: '#fff' }}>
                                        <input
                                            value={messageSearch}
                                            onChange={(e) => setMessageSearch(e.target.value)}
                                            placeholder="Search chats"
                                            style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 10px', fontSize: 14 }}
                                        />
                                    </div>
                                    <div style={{ padding: '10px 12px', color: '#6b7280', fontWeight: 700, borderBottom: '1px solid #f2f2f2', fontSize: 14 }}>Recent chats</div>
                                    {loadingChats ? (
                                        <div style={{ padding: 12 }}>Loading…</div>
                                    ) : filteredRecentChats.length === 0 ? (
                                        <div style={{ padding: 12 }}>No recent chats</div>
                                    ) : (
                                        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                            {filteredRecentChats.map(item => (
                                                <li
                                                    key={item.id}
                                                    style={{
                                                        display: 'flex', alignItems: 'center', gap: 12,
                                                        padding: '10px 12px', borderBottom: '1px solid #f6f6f6',
                                                        background: selectedChatId === item.id ? '#f9fafb' : 'transparent',
                                                        cursor: 'pointer',
                                                    }}
                                                    onClick={async () => {
                                                        setSelectedChatId(item.id);
                                                        setSelectedTeamId(null);
                                                        try {
                                                            await apiService.markMessagesAsRead(item.id);
                                                            setChats(prev => prev.map(c => c.id === item.id ? { ...c, unreadCount: 0 } : c));
                                                        } catch { }
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            width: 40, height: 40, borderRadius: '50%', background: '#e5e7eb',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0,
                                                        }}
                                                    >
                                                        {item.photo ? (
                                                            <img src={item.photo} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                        ) : (
                                                            <span style={{ fontWeight: 600 }}>{item.name?.[0] ?? '?'}</span>
                                                        )}
                                                    </div>
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                                                            <div style={{ fontWeight: 700, fontSize: 16, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</div>
                                                            {item.unreadCount && item.unreadCount >= 1 ? (
                                                                <span style={{ background: '#ef4444', color: '#fff', fontSize: 12, borderRadius: 9999, padding: '2px 8px', minWidth: 20, textAlign: 'center', fontWeight: 700 }}>
                                                                    {item.unreadCount}
                                                                </span>
                                                            ) : null}
                                                        </div>
                                                        <div style={{ color: '#6b7280', fontSize: 15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.lastMessage}</div>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </>
                            )}

                            {activeTab === 'teams' && (
                                <>
                                    <div style={{ padding: '8px 12px', borderBottom: '1px solid #f2f2f2', background: '#fff' }}>
                                        <input
                                            value={teamSearch}
                                            onChange={(e) => setTeamSearch(e.target.value)}
                                            placeholder="Search teams"
                                            style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 10px', fontSize: 14 }}
                                        />
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', color: '#6b7280', fontWeight: 600, borderBottom: '1px solid #f2f2f2' }}>
                                        <span>My Teams</span>
                                        <button
                                            onClick={() => setIsCreateTeamOpen(true)}
                                            title="Create team"
                                            style={{
                                                border: '1px solid #e5e7eb',
                                                background: '#fff',
                                                borderRadius: 6,
                                                width: 28,
                                                height: 28,
                                                lineHeight: '26px',
                                                textAlign: 'center',
                                                cursor: 'pointer',
                                                color: '#111827',
                                                fontWeight: 700,
                                            }}
                                        >
                                            +
                                        </button>
                                    </div>
                                    {loadingTeams ? (
                                        <div style={{ padding: 12 }}>Loading…</div>
                                    ) : filteredTeams.length === 0 ? (
                                        <div style={{ padding: 12 }}>No teams</div>
                                    ) : (
                                        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                            {filteredTeams.map(team => (
                                                <li
                                                    key={team.id}
                                                    style={{
                                                        padding: '10px 12px', borderBottom: '1px solid #f6f6f6',
                                                        background: selectedTeamId === team.id ? '#f9fafb' : 'transparent',
                                                        cursor: 'pointer',
                                                    }}
                                                    onClick={() => { setSelectedTeamId(team.id); setSelectedChatId(null); }}
                                                >
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                                                        <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                                                            <span>{team.title}</span>
                                                            {(((team as any).isPublic === false) || ((team as any).privacy === 'PRIVATE')) ? (
                                                                <span title="Private team" aria-label="Private team">🔒</span>
                                                            ) : null}
                                                        </div>
                                                        {(team as any).unreadCount && (team as any).unreadCount >= 1 ? (
                                                            <span style={{ background: '#ef4444', color: '#fff', fontSize: 12, borderRadius: 9999, padding: '2px 8px', minWidth: 20, textAlign: 'center', fontWeight: 700 }}>
                                                                {(team as any).unreadCount}
                                                            </span>
                                                        ) : null}
                                                    </div>
                                                    {((team as any).gameName || (team as any).game?.name) ? (
                                                        <div style={{ color: '#6b7280', fontSize: 14 }}>
                                                            Game: {((team as any).gameName || (team as any).game?.name)}
                                                        </div>
                                                    ) : null}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* Right conversation - hidden entirely on mobile unless a conversation is active */}
                {(!isMobile || hasActiveConversation) && (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: '#f5f6f6' }}>
                        {selectedHeader ? (
                            <>
                                <div style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 12, background: '#fff', borderBottom: '1px solid #eee' }}>
                                    {/* Mobile-only back button to list (go to chat list) */}
                                    <button onClick={() => { setSelectedChatId(null); setSelectedTeamId(null); navigate('/chat', { replace: true }); }} style={{ display: isMobile ? 'inline-flex' : 'none', border: '1px solid #e5e7eb', background: '#fff', borderRadius: 6, width: 28, height: 28, lineHeight: '26px', textAlign: 'center', cursor: 'pointer' }}>{'←'}</button>
                                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#e5e7eb', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {selectedHeader.photo ? (
                                            <img src={selectedHeader.photo as any} alt={selectedHeader.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <span style={{ fontWeight: 700 }}>
                                                {selectedHeader.title?.[0]?.toUpperCase() || '?'}
                                            </span>
                                        )}
                                    </div>
                                    <div style={{ fontWeight: 800, fontSize: 18 }}>{selectedHeader.title}</div>
                                </div>

                                <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: 14, background: '#f5f6f6' }}>
                                    {isLoadingConversation ? (
                                        <div>Loading conversation…</div>
                                    ) : conversation.length === 0 ? (
                                        <div style={{ color: '#6b7280', fontSize: 15 }}>No messages yet</div>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                            {conversation.map((m: any) => {
                                                const isMine = typeof m.sender === 'string' ? m.sender === currentUserId : m.sender?.user_id === currentUserId;
                                                return (
                                                    <div key={m.id} style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start' }}>
                                                        <div style={{
                                                            maxWidth: '72%', padding: '10px 14px', borderRadius: 14,
                                                            background: isMine ? '#dcf8c6' : '#fff',
                                                            border: '1px solid #e5e7eb',
                                                            whiteSpace: 'pre-wrap',
                                                            wordBreak: 'break-word', fontSize: 15,
                                                        }}>
                                                            {m.content}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                <div style={{ padding: 12, borderTop: '1px solid #eee', display: 'flex', gap: 10, background: '#f5f6f6' }}>
                                    <input
                                        value={messageInput}
                                        onChange={(e) => setMessageInput(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
                                        placeholder={'Type a message'}
                                        style={{ flex: 1, border: '1px solid #ddd', borderRadius: 22, padding: '12px 16px', fontSize: 15 }}
                                    />
                                    <button onClick={handleSend} disabled={!messageInput.trim()} style={{ padding: '12px 18px', borderRadius: 22, border: '1px solid #111827', background: '#111827', color: '#fff', fontWeight: 600 }}>
                                        Send
                                    </button>
                                </div>
                            </>
                        ) : (
                            isMobile ? (
                                <div style={{ flex: 1, background: '#f5f6f6' }} />
                            ) : (
                                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f6f6' }}>
                                    <div style={{ textAlign: 'center', color: '#4b5563', padding: 24 }}>
                                        <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Start a conversation</div>
                                        <div style={{ fontSize: 14 }}>Select a chat from the left or tap the + to start a new one.</div>
                                    </div>
                                </div>
                            )
                        )}
                    </div>
                )}
            </div>
            {/* Create Team Modal */}
            {isCreateTeamOpen && (
                <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, left: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
                    <div style={{ width: 420, background: '#fff', borderRadius: 8, boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
                        <div style={{ padding: 16, borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ fontWeight: 700 }}>Create Team</div>
                            <button onClick={() => setIsCreateTeamOpen(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 18 }}>×</button>
                        </div>
                        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <label style={{ fontSize: 14, color: '#374151' }}>Title<span style={{ color: '#b91c1c' }}> *</span></label>
                                <input
                                    value={createTeamForm.title}
                                    onChange={(e) => setCreateTeamForm(prev => ({ ...prev, title: e.target.value }))}
                                    placeholder="Team title"
                                    style={{ border: '1px solid #ddd', borderRadius: 6, padding: '10px 12px' }}
                                />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <label style={{ fontSize: 14, color: '#374151' }}>Game<span style={{ color: '#b91c1c' }}> *</span></label>
                                <select
                                    value={createTeamForm.gameName}
                                    onChange={(e) => setCreateTeamForm(prev => ({ ...prev, gameName: e.target.value }))}
                                    style={{ border: '1px solid #ddd', borderRadius: 6, padding: '10px 12px', background: '#fff' }}
                                >
                                    <option value="" disabled>{isLoadingGames ? 'Loading games…' : 'Select a game'}</option>
                                    {availableGames.map(g => (
                                        <option key={g.id || g.name} value={g.name}>{g.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <label style={{ fontSize: 14, color: '#374151' }}>Description</label>
                                <textarea
                                    value={createTeamForm.description}
                                    onChange={(e) => setCreateTeamForm(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder="What is this team about?"
                                    rows={3}
                                    style={{ border: '1px solid #ddd', borderRadius: 6, padding: '10px 12px', resize: 'vertical' }}
                                />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <label style={{ fontSize: 14, color: '#374151' }}>Team Photo</label>
                                {createTeamPhotoPreview && (
                                    <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#e5e7eb', overflow: 'hidden', marginBottom: 8 }}>
                                        <img src={createTeamPhotoPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    </div>
                                )}
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;
                                        const reader = new FileReader();
                                        reader.onload = () => {
                                            const dataUrl = String(reader.result || '');
                                            setCreateTeamForm(prev => ({ ...prev, photo: dataUrl }));
                                            setCreateTeamPhotoPreview(dataUrl);
                                        };
                                        reader.readAsDataURL(file);
                                    }}
                                    style={{ border: '1px solid #ddd', borderRadius: 6, padding: '8px 10px' }}
                                />
                                <div style={{ fontSize: 12, color: '#6b7280' }}>Upload a team image (JPG, PNG). Optional.</div>
                            </div>
                            <div style={{ display: 'flex', gap: 12 }}>
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    <label style={{ fontSize: 14, color: '#374151' }}>Number of Players</label>
                                    <input
                                        type="number"
                                        min={1}
                                        value={createTeamForm.noOfPlayers}
                                        onChange={(e) => setCreateTeamForm(prev => ({ ...prev, noOfPlayers: e.target.value }))}
                                        placeholder="e.g., 5"
                                        style={{ border: '1px solid #ddd', borderRadius: 6, padding: '10px 12px' }}
                                    />
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <input
                                        id="isPublic"
                                        type="checkbox"
                                        checked={createTeamForm.isPublic}
                                        onChange={(e) => setCreateTeamForm(prev => ({ ...prev, isPublic: e.target.checked }))}
                                    />
                                    <label htmlFor="isPublic" style={{ color: '#374151' }}>Public team</label>
                                </div>
                            </div>
                        </div>
                        <div style={{ padding: 16, borderTop: '1px solid #eee', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                            <button
                                onClick={() => setIsCreateTeamOpen(false)}
                                disabled={isCreatingTeam}
                                style={{ padding: '8px 12px', border: '1px solid #e5e7eb', background: '#fff', borderRadius: 6, cursor: 'pointer' }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={async () => {
                                    const title = createTeamForm.title.trim();
                                    const gameName = createTeamForm.gameName.trim();
                                    if (!title || !gameName) {
                                        setError('Title and Game Name are required');
                                        return;
                                    }
                                    setIsCreatingTeam(true);
                                    try {
                                        await apiService.createTeam({
                                            title,
                                            gameName,
                                            description: createTeamForm.description.trim() || undefined,
                                            photo: createTeamForm.photo.trim() || undefined,
                                            noOfPlayers: createTeamForm.noOfPlayers ? Number(createTeamForm.noOfPlayers) : undefined,
                                            isPublic: createTeamForm.isPublic,
                                        });
                                        const myTeams = await apiService.getMyTeams();
                                        setTeams(myTeams || []);
                                        setIsCreateTeamOpen(false);
                                        setCreateTeamForm({ title: '', gameName: '', description: '', photo: '', noOfPlayers: '', isPublic: true });
                                        setCreateTeamPhotoPreview(null);
                                    } catch (e: any) {
                                        setError(e?.message || 'Failed to create team');
                                    } finally {
                                        setIsCreatingTeam(false);
                                    }
                                }}
                                disabled={isCreatingTeam}
                                style={{ padding: '8px 12px', border: '1px solid #111827', background: '#111827', color: '#fff', borderRadius: 6, cursor: 'pointer' }}
                            >
                                {isCreatingTeam ? 'Creating…' : 'Create Team'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
