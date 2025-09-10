import { prisma } from '../config/database';
import { RealtimeService } from './realtime';

export class FriendService {
    static async sendRequest(fromUserId: string, toUserId: string) {
        if (fromUserId === toUserId) {
            throw new Error('Cannot send request to self');
        }
        // Ensure consistent ordering for Friend unique constraint
        const [a, b] = fromUserId < toUserId ? [fromUserId, toUserId] : [toUserId, fromUserId];

        const db: any = prisma as any;
        const existingFriend = await db.friend?.findFirst({ where: { userAId: a, userBId: b } });
        if (existingFriend) {
            throw new Error('Already friends');
        }

        // Upsert without relying on composite unique constraint name
        const existingReq = await db.friendRequest?.findFirst({ where: { fromUserId, toUserId } });
        let req;
        if (existingReq) {
            req = await db.friendRequest.update({ where: { id: existingReq.id }, data: { status: 'PENDING' }, include: { fromUser: { select: { user_id: true, displayName: true, photo: true } }, toUser: { select: { user_id: true, displayName: true, photo: true } } } });
        } else {
            req = await db.friendRequest.create({ data: { fromUserId, toUserId, status: 'PENDING' }, include: { fromUser: { select: { user_id: true, displayName: true, photo: true } }, toUser: { select: { user_id: true, displayName: true, photo: true } } } });
        }
        // Emit realtime notification to receiver and sender (outgoing)
        RealtimeService.emitToUser(toUserId, 'friend:request', {
            id: req.id,
            fromUser: req.fromUser,
            toUser: req.toUser,
            status: req.status,
            createdAt: req.createdAt,
        });
        RealtimeService.emitToUser(fromUserId, 'friend:request:sent', {
            id: req.id,
            fromUser: req.fromUser,
            toUser: req.toUser,
            status: req.status,
            createdAt: req.createdAt,
        });
        return req;
    }

    static async listRequests(userId: string, box: 'incoming' | 'outgoing' = 'incoming') {
        const db: any = prisma as any;
        if (box === 'incoming') {
            return db.friendRequest.findMany({
                where: { toUserId: userId },
                orderBy: { createdAt: 'desc' },
                include: { fromUser: true, toUser: true },
            });
        }
        return db.friendRequest.findMany({
            where: { fromUserId: userId },
            orderBy: { createdAt: 'desc' },
            include: { fromUser: true, toUser: true },
        });
    }

    static async respond(requestId: string, userId: string, action: 'accept' | 'decline') {
        const db: any = prisma as any;
        const req = await db.friendRequest.findUnique({ where: { id: requestId } });
        if (!req) throw new Error('Request not found');
        if (req.toUserId !== userId) throw new Error('Not authorized to respond');

        if (action === 'decline') {
            const updated = await db.friendRequest.update({ where: { id: requestId }, data: { status: 'REJECTED' } });
            // Notify sender
            RealtimeService.emitToUser(req.fromUserId, 'friend:responded', { id: requestId, status: 'REJECTED' });
            return updated;
        }

        // accept: ensure friendship and mark all cross requests accepted
        const [a, b] = req.fromUserId < req.toUserId ? [req.fromUserId, req.toUserId] : [req.toUserId, req.fromUserId];
        const result = await prisma.$transaction(async (tx: any) => {
            // Create friend if not exists (idempotent)
            const existing = await tx.friend.findFirst({ where: { userAId: a, userBId: b } });
            if (!existing) {
                await tx.friend.create({ data: { userAId: a, userBId: b } });
            }
            // Mark both directions requests as ACCEPTED
            await tx.friendRequest.updateMany({
                where: {
                    OR: [
                        { fromUserId: req.fromUserId, toUserId: req.toUserId, status: 'PENDING' },
                        { fromUserId: req.toUserId, toUserId: req.fromUserId, status: 'PENDING' },
                    ],
                },
                data: { status: 'ACCEPTED' },
            });
            // Return the original request updated state
            return tx.friendRequest.update({ where: { id: requestId }, data: { status: 'ACCEPTED' } });
        });
        // Notify both users
        RealtimeService.emitToUser(req.fromUserId, 'friend:responded', { id: requestId, status: 'ACCEPTED' });
        RealtimeService.emitToUser(req.toUserId, 'friend:responded', { id: requestId, status: 'ACCEPTED' });
        return result;
    }

    // static async cancel(requestId: string, userId: string) {
    //     const db: any = prisma as any;
    //     const req = await db.friendRequest.findUnique({ where: { id: requestId } });
    //     if (!req) throw new Error('Request not found');
    //     if (req.fromUserId !== userId) throw new Error('Not authorized to cancel');
    //     if (req.status !== 'PENDING') throw new Error('Only pending requests can be withdrawn');
    //     await db.friendRequest.delete({ where: { id: requestId } });
    //     // notify receiver
    //     RealtimeService.emitToUser(req.toUserId, 'friend:request:withdrawn', { id: requestId });
    //     return { id: requestId, deleted: true };
    // }

    static async listFriends(userId: string) {
        const db: any = prisma as any;
        const asA = await db.friend.findMany({ where: { userAId: userId }, include: { userB: true } });
        const asB = await db.friend.findMany({ where: { userBId: userId }, include: { userA: true } });
        const users = [
            ...asA.map((f: any) => f.userB),
            ...asB.map((f: any) => f.userA),
        ].map((u: any) => ({ user_id: u.user_id, displayName: u.displayName, photo: u.photo }));
        return users;
    }

    static async sendRequestsToAllActivePlayers(fromUserId: string) {
        const db: any = prisma as any;

        // Active players = all users except the sender (for now)
        const allUsers: Array<{ user_id: string }> = await db.user.findMany({
            select: { user_id: true },
        });
        const targetIds = new Set<string>(allUsers.map(u => u.user_id).filter((id) => id !== fromUserId));

        if (targetIds.size === 0) return [] as any[];

        // Exclude users already friends
        const existingFriendsA = await db.friend.findMany({ where: { userAId: fromUserId }, select: { userBId: true } });
        const existingFriendsB = await db.friend.findMany({ where: { userBId: fromUserId }, select: { userAId: true } });
        for (const f of existingFriendsA) targetIds.delete(f.userBId);
        for (const f of existingFriendsB) targetIds.delete(f.userAId);

        if (targetIds.size === 0) return [] as any[];

        // Exclude existing outgoing requests
        const existingOutgoing = await db.friendRequest.findMany({ where: { fromUserId, toUserId: { in: Array.from(targetIds) } }, select: { toUserId: true } });
        for (const r of existingOutgoing) targetIds.delete(r.toUserId);

        if (targetIds.size === 0) return [] as any[];

        const created: any[] = [];
        // Create requests sequentially to avoid overwhelming DB; could batch if needed
        for (const toUserId of targetIds) {
            const req = await db.friendRequest.create({
                data: { fromUserId, toUserId, status: 'PENDING' },
                include: {
                    fromUser: { select: { user_id: true, displayName: true, photo: true } },
                    toUser: { select: { user_id: true, displayName: true, photo: true } },
                },
            });
            created.push(req);
        }

        return created;
    }
}


