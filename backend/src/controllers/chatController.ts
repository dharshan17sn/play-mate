import type { Request, Response } from 'express';
import { ChatService } from '../services/chatService';
import { ResponseBuilder } from '../utils/response';
import { asyncErrorHandler } from '../middleware/errorHandler';
import type { AuthenticatedRequest } from '../middleware/auth';

export class ChatController {
    /**
     * Get or create a chat with a friend
     */
    static getOrCreateChat = asyncErrorHandler(async (req: AuthenticatedRequest, res: Response) => {
        if (!req.user) {
            return res.status(401).json(
                ResponseBuilder.unauthorized('User not authenticated')
            );
        }

        const { friendId } = req.params;
        if (!friendId) {
            return res.status(400).json(
                ResponseBuilder.validationError('Friend ID is required')
            );
        }

        const chat = await ChatService.getOrCreateChat(req.user.user_id, friendId);

        res.status(200).json(
            ResponseBuilder.success(chat, 'Chat retrieved successfully')
        );
    });

    /**
     * Get all chats for the current user
     */
    static getUserChats = asyncErrorHandler(async (req: AuthenticatedRequest, res: Response) => {
        if (!req.user) {
            return res.status(401).json(
                ResponseBuilder.unauthorized('User not authenticated')
            );
        }

        const chats = await ChatService.getUserChats(req.user.user_id);

        res.status(200).json(
            ResponseBuilder.success(chats, 'Chats retrieved successfully')
        );
    });

    /**
     * Get messages for a specific chat
     */
    static getChatMessages = asyncErrorHandler(async (req: AuthenticatedRequest, res: Response) => {
        if (!req.user) {
            return res.status(401).json(
                ResponseBuilder.unauthorized('User not authenticated')
            );
        }

        const { chatId } = req.params;
        if (!chatId) {
            return res.status(400).json(
                ResponseBuilder.validationError('Chat ID is required')
            );
        }
        const limit = parseInt(req.query.limit as string) || 50;
        const offset = parseInt(req.query.offset as string) || 0;

        const messages = await ChatService.getChatMessages(chatId, req.user.user_id, limit, offset);

        res.status(200).json(
            ResponseBuilder.success(messages, 'Messages retrieved successfully')
        );
    });

    /**
     * Send a message in a chat
     */
    static sendMessage = asyncErrorHandler(async (req: AuthenticatedRequest, res: Response) => {
        if (!req.user) {
            return res.status(401).json(
                ResponseBuilder.unauthorized('User not authenticated')
            );
        }

        const { chatId } = req.params;
        if (!chatId) {
            return res.status(400).json(
                ResponseBuilder.validationError('Chat ID is required')
            );
        }
        const { content } = req.body;

        if (!content || content.trim().length === 0) {
            return res.status(400).json(
                ResponseBuilder.validationError('Message content is required')
            );
        }

        const message = await ChatService.sendMessage({
            chatId,
            senderId: req.user.user_id,
            content: content.trim(),
        });

        res.status(201).json(
            ResponseBuilder.created(message, 'Message sent successfully')
        );
    });

    /**
     * Mark messages as read in a chat
     */
    static markMessagesAsRead = asyncErrorHandler(async (req: AuthenticatedRequest, res: Response) => {
        if (!req.user) {
            return res.status(401).json(
                ResponseBuilder.unauthorized('User not authenticated')
            );
        }

        const { chatId } = req.params;
        if (!chatId) {
            return res.status(400).json(
                ResponseBuilder.validationError('Chat ID is required')
            );
        }

        const result = await ChatService.markMessagesAsRead(chatId, req.user.user_id);

        res.status(200).json(
            ResponseBuilder.success(result, 'Messages marked as read')
        );
    });
}
