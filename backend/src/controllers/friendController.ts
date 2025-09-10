import type { Request, Response } from 'express';
import { FriendService } from '../services/friendService';
import { asyncErrorHandler } from '../middleware/errorHandler';
import { ResponseBuilder } from '../utils/response';
import type { AuthenticatedRequest } from '../middleware/auth';
// Removed SSE publishing

export class FriendController {
    static sendRequest = asyncErrorHandler(async (req: AuthenticatedRequest, res: Response) => {
        if (!req.user) return res.status(401).json(ResponseBuilder.unauthorized('Not authenticated'));
        const { toUserId } = req.body as { toUserId: string };
        const result = await FriendService.sendRequest(req.user.user_id, toUserId);
        res.status(201).json(ResponseBuilder.created(result, 'Friend request sent'));
    });

    static listRequests = asyncErrorHandler(async (req: AuthenticatedRequest, res: Response) => {
        if (!req.user) return res.status(401).json(ResponseBuilder.unauthorized('Not authenticated'));
        const box = (req.query.box as 'incoming' | 'outgoing') || 'incoming';
        const data = await FriendService.listRequests(req.user.user_id, box);
        res.status(200).json(ResponseBuilder.success(data, 'Friend requests'));
    });

    static respond = asyncErrorHandler(async (req: AuthenticatedRequest, res: Response) => {
        if (!req.user) return res.status(401).json(ResponseBuilder.unauthorized('Not authenticated'));
        const { requestId } = req.params as { requestId: string };
        const { action } = req.body as { action: 'accept' | 'decline' };
        const result = await FriendService.respond(requestId, req.user.user_id, action);
        res.status(200).json(ResponseBuilder.success(result, 'Friend request updated'));
    });

    // static cancel = asyncErrorHandler(async (req: AuthenticatedRequest, res: Response) => {
    //     if (!req.user) return res.status(401).json(ResponseBuilder.unauthorized('Not authenticated'));
    //     const { requestId } = req.params as { requestId: string };
    //     const result = await FriendService.cancel(requestId, req.user.user_id);
    //     res.status(200).json(ResponseBuilder.success(result, 'Friend request withdrawn'));
    // });

    static listFriends = asyncErrorHandler(async (req: AuthenticatedRequest, res: Response) => {
        if (!req.user) return res.status(401).json(ResponseBuilder.unauthorized('Not authenticated'));
        const data = await FriendService.listFriends(req.user.user_id);
        res.status(200).json(ResponseBuilder.success(data, 'Friends'));
    });

    static sendRequestsToAll = asyncErrorHandler(async (req: AuthenticatedRequest, res: Response) => {
        if (!req.user) return res.status(401).json(ResponseBuilder.unauthorized('Not authenticated'));
        const created = await FriendService.sendRequestsToAllActivePlayers(req.user.user_id);
        res.status(201).json(ResponseBuilder.created(created, `Sent ${created.length} friend requests`));
    });
}


