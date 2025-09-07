import type { Server as HttpServer } from 'http';
import { Server, type Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { logger } from '../utils/logger';

type UserSocketMap = Map<string, Set<string>>;

class RealtimeServiceImpl {
    private io?: Server;
    private userSockets: UserSocketMap = new Map();

    initialize(server: HttpServer) {
        if (this.io) return this.io;
        const io = new Server(server, {
            cors: { origin: '*', methods: ['GET', 'POST'] },
        });

        io.use((socket, next) => {
            try {
                const token = socket.handshake.auth?.token as string | undefined
                    || (socket.handshake.headers['authorization']?.toString().split(' ')[1]);
                if (!token) return next(new Error('Unauthorized'));
                const decoded = jwt.verify(token, config.jwt.secret) as any;
                if (!decoded?.userId) return next(new Error('Unauthorized'));
                (socket as any).userId = decoded.userId as string;
                next();
            } catch (err) {
                next(new Error('Unauthorized'));
            }
        });

        io.on('connection', (socket: Socket) => {
            const userId = (socket as any).userId as string;
            if (!userId) return socket.disconnect(true);
            const set = this.userSockets.get(userId) ?? new Set<string>();
            set.add(socket.id);
            this.userSockets.set(userId, set);
            logger.info(`Socket connected: ${socket.id} for user ${userId}`);

            socket.on('disconnect', () => {
                const sockets = this.userSockets.get(userId);
                if (sockets) {
                    sockets.delete(socket.id);
                    if (sockets.size === 0) this.userSockets.delete(userId);
                }
                logger.info(`Socket disconnected: ${socket.id} for user ${userId}`);
            });
        });

        this.io = io;
        return io;
    }

    emitToUser(userId: string, event: string, payload: unknown) {
        if (!this.io) return;
        const sockets = this.userSockets.get(userId);
        if (!sockets?.size) return;
        for (const sid of sockets) {
            this.io.to(sid).emit(event, payload);
        }
    }
}

export const RealtimeService = new RealtimeServiceImpl();


