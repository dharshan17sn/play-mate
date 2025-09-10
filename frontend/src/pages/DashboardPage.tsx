import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService, type Game } from '../services/api';
import { getSocket } from '../services/socket';

const DashboardPage: React.FC = () => {
    const navigate = useNavigate();

    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'notifications' | 'friends'>('notifications');
    const [incoming, setIncoming] = useState<any[]>([]);
    const [outgoing, setOutgoing] = useState<any[]>([]);
    const [teamJoinRequests, setTeamJoinRequests] = useState<any[]>([]);
    const [friends, setFriends] = useState<{ user_id: string; displayName: string; photo?: string }[]>([]);
    const [systemEvents, setSystemEvents] = useState<Array<{ id: string; title: string; startDate?: string; reason?: string; createdAt: string; read?: boolean }>>([]);

    // (Removed local dismissal persistence)

    const openNotificationPanel = () => setIsNotificationOpen(true);
    const closeNotificationPanel = () => setIsNotificationOpen(false);
    const handleNavigate = (path: string) => {
        navigate(path);
    };

    // Load notifications and friends
    useEffect(() => {
        let mounted = true;
        const load = async () => {
            try {
                const [inc, out, teamReqs, fr, persisted] = await Promise.all([
                    apiService.listFriendRequests('incoming'),
                    apiService.listFriendRequests('outgoing'),
                    apiService.listInvitations('received'),
                    apiService.listFriends(),
                    apiService.listNotifications()
                ]);
                if (!mounted) return;
                setIncoming(((inc as any).data as any[]) || []);
                setOutgoing(((out as any).data as any[]) || []);
                // Map team join requests to consistent format
                const teamRequests = ((teamReqs as any).data as any[]) || [];
                console.log('API team requests:', teamRequests);
                setTeamJoinRequests(teamRequests.map(req => {
                    const createdAt = req.sentAt ? new Date(req.sentAt).toISOString() :
                        req.createdAt ? new Date(req.createdAt).toISOString() :
                            new Date().toISOString();
                    console.log('API req createdAt:', createdAt);
                    return {
                        ...req,
                        createdAt: createdAt,
                        fromUser: req.fromUser || { user_id: req.fromUserId, displayName: req.fromUserDisplayName },
                        team: req.team || { title: req.teamTitle }
                    };
                }));
                setFriends(fr || []);
                const persistedList = ((persisted as any).data as any[]) || [];
                setSystemEvents(persistedList.map((n: any) => ({ id: n.id, title: n.data?.title || n.title, startDate: n.data?.startDate, reason: n.message, createdAt: n.createdAt, read: !!n.read })));
            } catch { }
        };
        load();
        const s = getSocket();
        const onReq = () => load();
        const onResp = () => load();
        const onTeamJoinRequest = (payload: any) => {
            console.log('Team join request payload:', payload);
            const createdAt = payload.sentAt ? new Date(payload.sentAt).toISOString() : new Date().toISOString();
            console.log('Processed createdAt:', createdAt);
            setTeamJoinRequests(prev => [{
                id: payload.id,
                fromUserId: payload.fromUser?.user_id,
                toUserId: payload.toUser?.user_id,
                status: payload.status,
                createdAt: createdAt,
                fromUser: payload.fromUser,
                toUser: payload.toUser,
                team: payload.team,
                type: 'team'
            }, ...prev]);
        };
        s.on('friend:request', onReq);
        s.on('friend:request:sent', onReq);
        s.on('friend:responded', onResp);
        s.on('team:join:request', onTeamJoinRequest);
        s.on('tournament:deleted', (payload: any) => {
            setSystemEvents(prev => [{
                id: payload.id,
                title: payload.title,
                startDate: payload.startDate,
                reason: 'Automatically removed (start time elapsed)',
                createdAt: new Date().toISOString(),
                read: false
            }, ...prev]);
        });
        return () => {
            mounted = false;
            s.off('friend:request', onReq);
            s.off('friend:request:sent', onReq);
            s.off('friend:responded', onResp);
            s.off('team:join:request', onTeamJoinRequest);
            s.off('tournament:deleted');
        };
    }, []);

    const friendRequests = useMemo(() => {
        const inc = (incoming || []).map(r => ({ ...r, direction: 'incoming' as const }));
        const out = (outgoing || []).map(r => ({ ...r, direction: 'outgoing' as const }));
        return [...inc, ...out].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [incoming, outgoing]);

    // Badge counts only actionable items (incoming pending), not outgoing
    const pendingFriendCount = incoming.filter(i => i.status === 'PENDING').length;
    const pendingTeamCount = teamJoinRequests.filter(t => t.status === 'PENDING').length;
    const systemUnreadCount = systemEvents.filter(ev => !ev.read).length;
    const pendingCount = pendingFriendCount + pendingTeamCount + systemUnreadCount;

    // Auto-mark system notifications as read when opening panel
    useEffect(() => {
        if (!isNotificationOpen) return;
        const hasUnread = systemEvents.some(ev => !ev.read);
        if (!hasUnread) return;
        (async () => {
            try {
                await apiService.markNotificationsRead();
                setSystemEvents(prev => prev.map(ev => ({ ...ev, read: true })));
            } catch {}
        })();
    }, [isNotificationOpen, systemEvents]);

    // Handle team join request actions
    const handleTeamJoinRequest = async (id: string, action: 'approve' | 'reject') => {
        try {
            if (action === 'approve') {
                await apiService.approveTeamJoinRequest(id);
            } else {
                await apiService.rejectTeamJoinRequest(id);
            }
            // Refresh data
            const [inc, out, teamReqs] = await Promise.all([
                apiService.listFriendRequests('incoming'),
                apiService.listFriendRequests('outgoing'),
                apiService.listInvitations('received')
            ]);
            setIncoming(((inc as any).data as any[]) || []);
            setOutgoing(((out as any).data as any[]) || []);
            // Map team join requests to consistent format
            const teamRequests = ((teamReqs as any).data as any[]) || [];
            setTeamJoinRequests(teamRequests.map(req => ({
                ...req,
                createdAt: req.sentAt || req.createdAt || new Date().toISOString(),
                fromUser: req.fromUser || { user_id: req.fromUserId, displayName: req.fromUserDisplayName },
                team: req.team || { title: req.teamTitle }
            })));
        } catch (error) {
            console.error('Failed to handle team join request:', error);
        }
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
                                <button onClick={() => handleNavigate('/dashboard')} className="text-gray-700 hover:text-blue-600 font-medium">Home</button>
                                <button onClick={() => handleNavigate('/chat')} className="text-gray-700 hover:text-blue-600 font-medium">Chats</button>
                                <button onClick={() => handleNavigate('/tournaments')} className="text-gray-700 hover:text-blue-600 font-medium">Tournaments</button>
                            </nav>
                        </div>
                        <div className="flex items-center space-x-3">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search"
                                    className="w-64 pl-10 pr-3 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M10 18a8 8 0 100-16 8 8 0 000 16z" />
                                    </svg>
                                </span>
                            </div>
                            <button
                                onClick={openNotificationPanel}
                                className="relative p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full"
                                title="Notifications"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                </svg>
                                {pendingCount > 0 && (
                                    <span className="absolute -top-0.5 -right-0.5 bg-red-600 text-white text-[10px] leading-none px-1.5 py-0.5 rounded-full">{pendingCount}</span>
                                )}
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

            {/* Mobile Top Bar */}
            <header className="md:hidden bg-white shadow sticky top-0 z-20">
                <div className="px-4">
                    <div className="flex items-center h-14 space-x-2">
                        <div className="relative flex-1">
                            <input
                                type="text"
                                placeholder="Search"
                                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M10 18a8 8 0 100-16 8 8 0 000 16z" />
                                </svg>
                            </span>
                        </div>
                        <button onClick={openNotificationPanel} className="relative p-2 text-gray-600 hover:text-blue-600 rounded-full" title="Notifications">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                            {pendingCount > 0 && (
                                <span className="absolute -top-0.5 -right-0.5 bg-red-600 text-white text-[10px] leading-none px-1.5 py-0.5 rounded-full">{pendingCount}</span>
                            )}
                        </button>
                        <button onClick={() => navigate('/profile-creation')} className="p-2 text-gray-600 hover:text-blue-600 rounded-full" title="Account">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content - Home */}
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 pb-20 md:pb-6">
                <div className="px-4 py-6 sm:px-0">
                    <div className="border-4 border-dashed border-gray-200 rounded-lg p-6">
                        <HomeGamesSection />
                    </div>
                </div>
            </main>
            {/* Mobile Bottom Navigation */}
            <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 z-20">
                <div className="flex justify-around items-center h-14">
                    <button onClick={() => handleNavigate('/chat')} className="flex flex-col items-center text-gray-600 hover:text-blue-600">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4-.8L3 20l.8-3.2A8.96 8.96 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <span className="text-xs">Chats</span>
                    </button>
                    <button onClick={() => handleNavigate('/dashboard')} className="-mt-6 bg-blue-600 text-white rounded-full p-4 shadow-lg">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M13 5v6a2 2 0 002 2h3m-9 4h6m-6 0a2 2 0 01-2-2v-3m8 5a2 2 0 002-2v-3m0 0l2-2m-2 2l-2 2" />
                        </svg>
                    </button>
                    <button onClick={() => handleNavigate('/tournaments')} className="flex flex-col items-center text-gray-600 hover:text-blue-600">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-xs">Tournaments</span>
                    </button>
                </div>
            </nav>

            {/* Notification Panel */}
            {isNotificationOpen && (
                <>
                    <div className="fixed inset-0 bg-black/30 z-40" onClick={closeNotificationPanel} />
                    <aside className="fixed right-0 top-0 bottom-0 w-80 max-w-[85vw] bg-white shadow-xl z-50 flex flex-col">
                        <div className="flex items-center justify-between px-4 py-3 border-b">
                            <h4 className="text-lg font-semibold text-gray-900">Notifications</h4>
                            <button onClick={closeNotificationPanel} className="p-2 rounded hover:bg-gray-100" aria-label="Close">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Tab Navigation */}
                        <div className="flex border-b">
                            <button
                                onClick={() => setActiveTab('notifications')}
                                className={`flex-1 px-4 py-3 text-sm font-medium ${activeTab === 'notifications'
                                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                Notifications
                            </button>
                            <button
                                onClick={() => setActiveTab('friends')}
                                className={`flex-1 px-4 py-3 text-sm font-medium ${activeTab === 'friends'
                                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                My Friends
                            </button>
                        </div>

                        {/* Tab Content */}
                        <div className="flex-1 overflow-y-auto">
                            {activeTab === 'notifications' && (
                                <div className="p-4 space-y-4">
                                    <div>
                                        <h5 className="font-medium mb-2">Friend Requests</h5>
                                        <div className="space-y-2 select-none">
                                            {friendRequests.map((r) => {
                                                const isIncoming = r.direction === 'incoming';
                                                const user = isIncoming ? (r.fromUser || { user_id: r.fromUserId, displayName: r.fromUserDisplayName }) : (r.toUser || { user_id: r.toUserId, displayName: r.toUserDisplayName });
                                                const initials = (user?.displayName?.[0]?.toUpperCase() || '?');
                                                // Date/Time hidden per requirements
                                                return (
                                                    <div
                                                        key={r.id}
                                                        className="relative overflow-hidden rounded-lg border"
                                                        onPointerDown={() => { /* swipe disabled */ }}
                                                        onPointerMove={(e) => {
                                                            if (e.buttons !== 1) return;
                                                            // swipe disabled
                                                        }}
                                                        onPointerUp={() => { /* keep or reset handled by move */ }}
                                                    >
                                                        {/* Trailing actions layer */}
                                                        {/* Trailing actions removed per request */}
                                                        {/* Foreground content that slides left */}
                                                        <div
                                                            className={`relative bg-white p-3 flex items-center justify-between shadow-sm select-none`}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-[11px] font-semibold text-gray-700">
                                                                    {initials}
                                                                </div>
                                                                <div>
                                                                    <button
                                                                        onClick={() => { closeNotificationPanel(); navigate(`/users/${user?.user_id}`); }}
                                                                        className="text-sm font-semibold text-left text-gray-900 hover:text-blue-600 hover:underline"
                                                                    >
                                                                        {user?.displayName || user?.user_id}
                                                                    </button>
                                                                    <div className="flex items-center gap-2 mt-0.5">
                                                                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${isIncoming ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}>{isIncoming ? 'Incoming' : 'Outgoing'}</span>
                                                                        {/* no date */}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                {isIncoming && r.status === 'PENDING' ? (
                                                                    <>
                                                                        <button
                                                                            onClick={async () => {
                                                                                await apiService.respondFriendRequest(r.id, 'accept');
                                                                                const [inc, out, fr] = await Promise.all([
                                                                                    apiService.listFriendRequests('incoming'),
                                                                                    apiService.listFriendRequests('outgoing'),
                                                                                    apiService.listFriends()
                                                                                ]);
                                                                                setIncoming(((inc as any).data as any[]) || []);
                                                                                setOutgoing(((out as any).data as any[]) || []);
                                                                                setFriends(fr || []);
                                                                            }}
                                                                            className="px-2 py-1 rounded bg-green-600 text-white text-xs hover:bg-green-700"
                                                                        >
                                                                            Accept
                                                                        </button>
                                                                        <button
                                                                            onClick={async () => {
                                                                                await apiService.respondFriendRequest(r.id, 'decline');
                                                                                const [inc, out, fr] = await Promise.all([
                                                                                    apiService.listFriendRequests('incoming'),
                                                                                    apiService.listFriendRequests('outgoing'),
                                                                                    apiService.listFriends()
                                                                                ]);
                                                                                setIncoming(((inc as any).data as any[]) || []);
                                                                                setOutgoing(((out as any).data as any[]) || []);
                                                                                setFriends(fr || []);
                                                                            }}
                                                                            className="px-2 py-1 rounded bg-red-600 text-white text-xs hover:bg-red-700"
                                                                        >
                                                                            Decline
                                                                        </button>
                                                                    </>
                                                                ) : (
                                                                    <span className={`px-2 py-0.5 rounded-full text-xs ${r.status === 'PENDING' ? 'bg-yellow-50 text-yellow-800' : r.status === 'ACCEPTED' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                                                                        {r.status}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            {friendRequests.length === 0 && <div className="text-xs text-gray-500">No friend requests</div>}
                                        </div>
                                    </div>
                                    <div>
                                        <h5 className="font-medium mb-2">Team Join Requests</h5>
                                        <div className="space-y-2">
                                            {teamJoinRequests.map((r) => (
                                                <div key={r.id} className="p-2 border rounded flex items-center justify-between">
                                                    <div>
                                                        <button
                                                            onClick={() => { closeNotificationPanel(); navigate(`/users/${r.fromUser?.user_id || r.fromUserId}`); }}
                                                            className="text-sm font-semibold text-left text-blue-600 hover:underline"
                                                        >
                                                            {r.fromUser?.displayName || r.fromUserId}
                                                        </button>
                                                        <div className="text-xs text-gray-500">
                                                            Wants to join <span className="font-medium">{r.team?.title}</span>
                                                        </div>
                                                        <div className="text-[11px] text-gray-500">{new Date(r.createdAt).toLocaleString()}</div>
                                                    </div>
                                                    {r.status === 'PENDING' ? (
                                                        <div className="flex gap-1">
                                                            <button
                                                                onClick={() => handleTeamJoinRequest(r.id, 'approve')}
                                                                className="px-2 py-1 rounded bg-green-600 text-white text-xs hover:bg-green-700"
                                                            >
                                                                Approve
                                                            </button>
                                                            <button
                                                                onClick={() => handleTeamJoinRequest(r.id, 'reject')}
                                                                className="px-2 py-1 rounded bg-red-600 text-white text-xs hover:bg-red-700"
                                                            >
                                                                Reject
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-gray-600">{r.status}</span>
                                                    )}
                                                </div>
                                            ))}
                                            {teamJoinRequests.length === 0 && <div className="text-xs text-gray-500">No team join requests</div>}
                                        </div>
                                    </div>
                                    <div>
                                        <h5 className="font-medium mb-2 mt-4">System</h5>
                                        <div className="space-y-2">
                                            {systemEvents.map(ev => (
                                                <div key={ev.id + ev.createdAt} className="p-2 border rounded bg-yellow-50 text-yellow-800 text-xs">
                                                    {`The tournament "${ev.title}" was automatically removed because its scheduled start time had already passed.`}
                                                </div>
                                            ))}
                                            {systemEvents.length === 0 && <div className="text-xs text-gray-500">No system notifications</div>}
                                            {systemEvents.some(ev => !ev.read) && (
                                                <div className="flex justify-end">
                                                    <button
                                                        onClick={async () => {
                                                            try {
                                                                await apiService.markNotificationsRead();
                                                                setSystemEvents(prev => prev.map(ev => ({ ...ev, read: true })));
                                                            } catch {}
                                                        }}
                                                        className="text-[11px] text-blue-700 hover:underline"
                                                    >
                                                        Mark system notifications as read
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    {/* Outgoing list removed in favor of unified Friend Requests above */}
                                </div>
                            )}

                            {activeTab === 'friends' && (
                                <div className="p-4 space-y-2">
                                    {friends.map(f => (
                                        <div key={f.user_id} className="p-2 border rounded flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
                                                    {f.photo ? <img src={f.photo} alt={f.displayName} className="w-full h-full object-cover" /> : <span className="text-[11px] text-gray-600 font-semibold">{f.displayName?.[0]?.toUpperCase() || '?'}</span>}
                                                </div>
                                                <div className="text-sm font-medium">{f.displayName}</div>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    closeNotificationPanel();
                                                    navigate(`/chat?friendId=${encodeURIComponent(f.user_id)}`);
                                                }}
                                                className="px-2 py-1 rounded bg-blue-600 text-white text-xs hover:bg-blue-700"
                                            >
                                                Chat
                                            </button>
                                        </div>
                                    ))}
                                    {friends.length === 0 && <div className="text-xs text-gray-500">No friends yet</div>}
                                </div>
                            )}
                        </div>

                        <div className="mt-auto p-3 border-t">
                            <button onClick={closeNotificationPanel} className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 rounded">Close</button>
                        </div>
                    </aside>
                </>
            )}
        </div>
    );
};

export default DashboardPage;

// Home section component for listing games
const HomeGamesSection: React.FC = () => {
    const [games, setGames] = useState<Game[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>('');

    useEffect(() => {
        let isMounted = true;
        (async () => {
            try {
                const data = await apiService.getGames();
                if (isMounted) {
                    setGames(data);
                }
            } catch (err: any) {
                if (isMounted) setError(err?.message || 'Failed to load games');
            } finally {
                if (isMounted) setIsLoading(false);
            }
        })();
        return () => { isMounted = false; };
    }, []);

    return (
        <section>
            <div className="mb-6">
                <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900">
                    Find Your <span className="text-blue-600">Playmate</span>
                </h2>
                <h3 className="mt-1 text-3xl md:text-5xl font-black text-gray-900">Games</h3>
            </div>

            {isLoading && (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                </div>
            )}

            {error && (
                <p className="text-center text-red-600">{error}</p>
            )}

            {!isLoading && !error && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                    {games.map((game, index) => (
                        <div onClick={() => window.location.href = `/games/${encodeURIComponent(game.name)}`} key={`${game.id || game.name}-${index}`} className="group bg-white rounded-2xl shadow hover:shadow-lg transition-shadow duration-200 p-4 flex items-center justify-center h-32 md:h-40 lg:h-48 cursor-pointer">
                            <span className="text-sm md:text-lg lg:text-xl font-bold text-gray-900 group-hover:text-blue-600 text-center leading-tight">
                                {game.name}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
};

// Legacy IncomingItem removed after unifying lists
