import { io, type Socket } from 'socket.io-client';
import { apiService } from './api';

let socket: Socket | null = null;

export function getSocket(): Socket {
    if (socket && socket.connected) return socket;
    const token = apiService.getAuthToken();
    socket = io('http://localhost:3000', {
        transports: ['websocket', 'polling'],
        auth: { token },
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
    });
    return socket;
}

export function disconnectSocket() {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
}


