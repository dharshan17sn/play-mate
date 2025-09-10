import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSocket } from '../services/socket';
import { apiService, type ApiResponse } from '../services/api';

type RequestItem = {
    id: string;
    fromUserId: string;
    toUserId: string;
    status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
    createdAt: string;
    fromUser?: { user_id: string; displayName: string; photo?: string };
    toUser?: { user_id: string; displayName: string; photo?: string };
    team?: { id: string; title: string };
    type?: 'friend' | 'team';
};

const NotificationsPage: React.FC = () => {
    const navigate = useNavigate();
    const [incoming, setIncoming] = useState<RequestItem[]>([]);
    const [outgoing, setOutgoing] = useState<RequestItem[]>([]);
    const [teamJoinRequests, setTeamJoinRequests] = useState<RequestItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'friends' | 'teams'>('friends');

    const load = async () => {
        setLoading(true);
        try {
            const [inc, out, teamReqs] = await Promise.all([
                apiService.listFriendRequests('incoming'),
                apiService.listFriendRequests('outgoing'),
                apiService.listInvitations('received')
            ]);
            setIncoming(((inc as ApiResponse).data as any[]) || []);
            setOutgoing(((out as ApiResponse).data as any[]) || []);
            setTeamJoinRequests(((teamReqs as ApiResponse).data as any[]) || []);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
        const s = getSocket();
        const onRequest = (payload: any) => {
            setIncoming(prev => [{
                id: payload.id,
                fromUserId: payload.fromUser?.user_id,
                toUserId: payload.toUser?.user_id,
                status: payload.status,
                createdAt: payload.createdAt,
                fromUser: payload.fromUser,
                toUser: payload.toUser,
            }, ...prev]);
        };
        const onResponded = () => {
            // Refresh both lists as state changes may affect both
            load();
        };
        const onOutgoing = (payload: any) => {
            setOutgoing(prev => [{
                id: payload.id,
                fromUserId: payload.fromUser?.user_id,
                toUserId: payload.toUser?.user_id,
                status: payload.status,
                createdAt: payload.createdAt,
                fromUser: payload.fromUser,
                toUser: payload.toUser,
            }, ...prev]);
        };
        const onTeamJoinRequest = (payload: any) => {
            setTeamJoinRequests(prev => [{
                id: payload.id,
                fromUserId: payload.fromUser?.user_id,
                toUserId: payload.toUser?.user_id,
                status: payload.status,
                createdAt: payload.sentAt,
                fromUser: payload.fromUser,
                toUser: payload.toUser,
                team: payload.team,
                type: 'team'
            }, ...prev]);
        };
        s.on('friend:request', onRequest);
        s.on('friend:responded', onResponded);
        s.on('friend:request:sent', onOutgoing);
        s.on('team:join:request', onTeamJoinRequest);
        return () => {
            s.off('friend:request', onRequest);
            s.off('friend:responded', onResponded);
            s.off('friend:request:sent', onOutgoing);
            s.off('team:join:request', onTeamJoinRequest);
        };
    }, []);

    const respond = async (id: string, action: 'accept' | 'decline') => {
        await apiService.respondFriendRequest(id, action);
        await load();
    };

    const respondToTeamJoinRequest = async (id: string, action: 'approve' | 'reject') => {
        if (action === 'approve') {
            await apiService.approveTeamJoinRequest(id);
        } else {
            await apiService.rejectTeamJoinRequest(id);
        }
        await load();
    };

    if (loading) return <div className="p-6">Loading...</div>;

    return (
        <div className="max-w-3xl mx-auto p-6">
            <h2 className="text-xl font-semibold mb-4">Notifications</h2>

            {/* Tab Navigation */}
            <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
                <button
                    onClick={() => setActiveTab('friends')}
                    className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${activeTab === 'friends'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Friend Requests
                </button>
                <button
                    onClick={() => setActiveTab('teams')}
                    className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${activeTab === 'teams'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Team Join Requests
                </button>
            </div>

            {activeTab === 'friends' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <section>
                        <h3 className="font-medium mb-2">Incoming Requests</h3>
                        <div className="space-y-3">
                            {incoming.map(r => (
                                <div key={r.id} className="p-3 rounded border bg-white flex items-center justify-between">
                                    <div>
                                        <button onClick={() => navigate(`/users/${r.fromUser?.user_id || r.fromUserId}`)} className="font-semibold text-left text-blue-600 hover:underline">
                                            {r.fromUser?.displayName || r.fromUserId}
                                        </button>
                                        <div className="text-xs text-gray-500">{new Date(r.createdAt).toLocaleString()}</div>
                                    </div>
                                    {r.status === 'PENDING' ? (
                                        <div className="flex gap-2">
                                            <button onClick={() => respond(r.id, 'accept')} className="px-3 py-1 rounded bg-green-600 text-white text-sm">Accept</button>
                                            <button onClick={() => respond(r.id, 'decline')} className="px-3 py-1 rounded bg-red-600 text-white text-sm">Decline</button>
                                        </div>
                                    ) : (
                                        <span className="text-sm text-gray-600">{r.status}</span>
                                    )}
                                </div>
                            ))}
                            {incoming.length === 0 && <div className="text-sm text-gray-500">No incoming requests</div>}
                        </div>
                    </section>
                    <section>
                        <h3 className="font-medium mb-2">Outgoing Requests</h3>
                        <div className="space-y-3">
                            {outgoing.map(r => (
                                <div key={r.id} className="p-3 rounded border bg-white flex items-center justify-between">
                                    <div>
                                        <button onClick={() => navigate(`/users/${r.toUser?.user_id || r.toUserId}`)} className="font-semibold text-left text-blue-600 hover:underline">
                                            {r.toUser?.displayName || r.toUserId}
                                        </button>
                                        <div className="text-xs text-gray-500">{new Date(r.createdAt).toLocaleString()}</div>
                                    </div>
                                    <span className="text-sm text-gray-600">{r.status}</span>
                                </div>
                            ))}
                            {outgoing.length === 0 && <div className="text-sm text-gray-500">No outgoing requests</div>}
                        </div>
                    </section>
                </div>
            ) : (
                <div className="space-y-4">
                    <section>
                        <h3 className="font-medium mb-2">Team Join Requests</h3>
                        <div className="space-y-3">
                            {teamJoinRequests.map(r => (
                                <div key={r.id} className="p-3 rounded border bg-white flex items-center justify-between">
                                    <div>
                                        <button onClick={() => navigate(`/users/${r.fromUser?.user_id || r.fromUserId}`)} className="font-semibold text-left text-blue-600 hover:underline">
                                            {r.fromUser?.displayName || r.fromUserId}
                                        </button>
                                        <div className="text-xs text-gray-500">
                                            Wants to join <span className="font-medium">{r.team?.title}</span>
                                        </div>
                                        <div className="text-xs text-gray-500">{new Date(r.createdAt).toLocaleString()}</div>
                                    </div>
                                    {r.status === 'PENDING' ? (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => respondToTeamJoinRequest(r.id, 'approve')}
                                                className="px-3 py-1 rounded bg-green-600 text-white text-sm hover:bg-green-700"
                                            >
                                                Approve
                                            </button>
                                            <button
                                                onClick={() => respondToTeamJoinRequest(r.id, 'reject')}
                                                className="px-3 py-1 rounded bg-red-600 text-white text-sm hover:bg-red-700"
                                            >
                                                Reject
                                            </button>
                                        </div>
                                    ) : (
                                        <span className="text-sm text-gray-600">{r.status}</span>
                                    )}
                                </div>
                            ))}
                            {teamJoinRequests.length === 0 && <div className="text-sm text-gray-500">No team join requests</div>}
                        </div>
                    </section>
                </div>
            )}
        </div>
    );
};

export default NotificationsPage;


