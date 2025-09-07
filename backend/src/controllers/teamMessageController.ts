import type { Response } from 'express';
import { TeamMessageService } from '../services/teamMessageService';
import { logger } from '../utils/logger';
import { ResponseBuilder } from '../utils/response';
import type { AuthenticatedRequest } from '../middleware/auth';

export class TeamMessageController {
    /**
     * Send a message to a team
     */
    static async sendTeamMessage(req: AuthenticatedRequest, res: Response) {
        try {
            const { teamId } = req.params;
            const { content } = req.body;
            const userId = req.user?.user_id;

            if (!userId) {
                return res.status(401).json(ResponseBuilder.error('Unauthorized'));
            }

            if (!teamId) {
                return res.status(400).json(ResponseBuilder.error('Team ID is required'));
            }

            if (!content) {
                return res.status(400).json(ResponseBuilder.error('Message content is required'));
            }

            const message = await TeamMessageService.sendTeamMessage({
                teamId,
                senderId: userId,
                content
            });

            res.status(201).json(ResponseBuilder.success(message, 'Message sent successfully'));
        } catch (error: any) {
            logger.error('Error in sendTeamMessage controller:', error);

            if (error.name === 'ValidationError') {
                return res.status(400).json(ResponseBuilder.error(error.message));
            }

            if (error.name === 'NotFoundError') {
                return res.status(404).json(ResponseBuilder.error(error.message));
            }

            if (error.name === 'ForbiddenError') {
                return res.status(403).json(ResponseBuilder.error(error.message));
            }

            res.status(500).json(ResponseBuilder.error('Internal server error'));
        }
    }

    /**
     * Get messages for a team
     */
    static async getTeamMessages(req: AuthenticatedRequest, res: Response) {
        try {
            const { teamId } = req.params;
            const userId = req.user?.user_id;
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 50;

            if (!userId) {
                return res.status(401).json(ResponseBuilder.error('Unauthorized'));
            }

            if (!teamId) {
                return res.status(400).json(ResponseBuilder.error('Team ID is required'));
            }

            const messages = await TeamMessageService.getTeamMessages(teamId, userId, page, limit);

            res.status(200).json(ResponseBuilder.success(messages, 'Messages retrieved successfully'));
        } catch (error: any) {
            logger.error('Error in getTeamMessages controller:', error);

            if (error.name === 'NotFoundError') {
                return res.status(404).json(ResponseBuilder.error(error.message));
            }

            if (error.name === 'ForbiddenError') {
                return res.status(403).json(ResponseBuilder.error(error.message));
            }

            res.status(500).json(ResponseBuilder.error('Internal server error'));
        }
    }

    /**
     * Mark team messages as read
     */
    static async markTeamMessagesAsRead(req: AuthenticatedRequest, res: Response) {
        try {
            const { teamId } = req.params;
            const userId = req.user?.user_id;

            if (!userId) {
                return res.status(401).json(ResponseBuilder.error('Unauthorized'));
            }

            if (!teamId) {
                return res.status(400).json(ResponseBuilder.error('Team ID is required'));
            }

            await TeamMessageService.markTeamMessagesAsRead(teamId, userId);

            res.status(200).json(ResponseBuilder.success(null, 'Messages marked as read'));
        } catch (error: any) {
            logger.error('Error in markTeamMessagesAsRead controller:', error);

            if (error.name === 'NotFoundError') {
                return res.status(404).json(ResponseBuilder.error(error.message));
            }

            if (error.name === 'ForbiddenError') {
                return res.status(403).json(ResponseBuilder.error(error.message));
            }

            res.status(500).json(ResponseBuilder.error('Internal server error'));
        }
    }
}
