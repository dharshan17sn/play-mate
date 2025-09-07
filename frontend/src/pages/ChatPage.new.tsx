import React, { useEffect, useState } from 'react';

type Chat = {
    id: string;
    userAId: string;
    userBId: string;
    createdAt: string;
    updatedAt: string;
};

type Message = {
    id: string;
    chatId: string;
    content: string;
    sentAt: string;
    senderId: string;
};

type Friend = {
    user_id: string;
    displayName: string;
    photo?: string;
};

const ChatPage: React.FC = () => {
    const [isMobile, setIsMobile] = useState(false);
    const [loading, setLoading] = useState(false);
    const [selectedChatId, setSelectedChatId] = useState<string | null>(null);

    useEffect(() => {
        const syncViewport = () => setIsMobile(window.innerWidth < 768);
        syncViewport();
        window.addEventListener('resize', syncViewport);
        return () => window.removeEventListener('resize', syncViewport);
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
            </div>
        );
    }

    // Mobile: in-chat view
    if (isMobile && selectedChatId) {
        return (
            <div className="h-screen bg-gray-50 flex flex-col">
                <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center">
                    <button onClick={() => setSelectedChatId(null)} className="p-2 -ml-2">
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <h3 className="ml-2 text-sm font-medium text-gray-900">Mobile Chat</h3>
                </div>
                <div className="flex-1 overflow-y-auto p-4">{/* messages go here */}</div>
                <div className="bg-white border-t border-gray-200 p-4">
                    <input className="w-full border rounded px-3 py-2" placeholder="Type a message..." />
                </div>
            </div>
        );
    }

    // Mobile: chat list view
    if (isMobile) {
        return (
            <div className="h-screen bg-white flex flex-col">
                <div className="bg-white border-b border-gray-200 px-4 py-3">
                    <h1 className="text-lg font-semibold text-gray-900">Chats</h1>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                    <button
                        onClick={() => setSelectedChatId('demo')}
                        className="w-full p-3 text-left hover:bg-gray-50 rounded-lg border"
                    >
                        Open chat (demo)
                    </button>
                </div>
            </div>
        );
    }

    // Desktop layout
    return (
        <div className="h-screen bg-gray-100 flex">
            {/* Sidebar */}
            <div className="w-[320px] bg-white border-r border-gray-200 flex flex-col">
                <div className="px-4 py-3 border-b">
                    <h1 className="text-lg font-semibold text-gray-900">Chats</h1>
                </div>
                <div className="p-4 space-y-2 overflow-y-auto">
                    <button
                        onClick={() => setSelectedChatId('demo')}
                        className="w-full p-3 text-left hover:bg-gray-50 rounded-lg border"
                    >
                        Open chat (demo)
                    </button>
                </div>
            </div>

            {/* Chat area */}
            <div className="flex-1 flex flex-col">
                {selectedChatId ? (
                    <>
                        <div className="bg-white border-b border-gray-200 px-6 py-4">
                            <h3 className="text-sm font-medium text-gray-900">Desktop Chat</h3>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6">{/* messages go here */}</div>
                        <div className="bg-white border-t border-gray-200 p-4">
                            <input className="w-full border rounded px-3 py-2" placeholder="Type a message..." />
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center bg-gray-50">
                        <div className="text-center text-gray-500">
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Chat</h3>
                            <p className="text-sm">Select a chat to start messaging</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatPage;



