import { Router } from 'express';
import { ChatController } from '../controllers/chatController';
import { authenticateToken } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { z } from 'zod';

const router = Router();

// Chat validation schemas
const friendIdParamSchema = z.object({
    params: z.object({
        friendId: z.string().min(1, 'Friend ID is required'),
    }),
});

const chatIdParamSchema = z.object({
    params: z.object({
        chatId: z.string().uuid('Invalid chat ID format'),
    }),
});

const chatMessagesQuerySchema = z.object({
    query: z.object({
        limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).optional(),
        offset: z.string().transform(Number).pipe(z.number().min(0)).optional(),
    }),
});

const sendMessageSchema = z.object({
    params: z.object({
        chatId: z.string().uuid('Invalid chat ID format'),
    }),
    body: z.object({
        content: z.string().min(1, 'Content is required').max(1000, 'Content too long'),
    }),
});

/**
 * @openapi
 * tags:
 *   - name: Chat
 *     description: Chat and messaging functionality
 */

// All chat routes require authentication
router.use(authenticateToken);

/**
 * @openapi
 * /api/v1/chat/chats:
 *   get:
 *     summary: Get all chats for current user
 *     tags: [Chat]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Chats retrieved successfully }
 */
router.get('/chats', ChatController.getUserChats);

/**
 * @openapi
 * /api/v1/chat/friends/{friendId}:
 *   get:
 *     summary: Get or create a chat with a friend
 *     tags: [Chat]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: friendId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Chat retrieved successfully }
 */
router.get('/friends/:friendId',
    validateRequest(friendIdParamSchema),
    ChatController.getOrCreateChat
);

/**
 * @openapi
 * /api/v1/chat/{chatId}/messages:
 *   get:
 *     summary: Get messages for a specific chat
 *     tags: [Chat]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 100 }
 *       - in: query
 *         name: offset
 *         schema: { type: integer, minimum: 0 }
 *     responses:
 *       200: { description: Messages retrieved successfully }
 */
router.get('/:chatId/messages',
    validateRequest(chatIdParamSchema.merge(chatMessagesQuerySchema)),
    ChatController.getChatMessages
);

/**
 * @openapi
 * /api/v1/chat/{chatId}/messages:
 *   post:
 *     summary: Send a message in a chat
 *     tags: [Chat]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content]
 *             properties:
 *               content: { type: string, minLength: 1, maxLength: 1000 }
 *     responses:
 *       201: { description: Message sent successfully }
 *       400: { description: Validation error }
 */
router.post('/:chatId/messages',
    validateRequest(sendMessageSchema),
    ChatController.sendMessage
);

/**
 * @openapi
 * /api/v1/chat/{chatId}/read:
 *   put:
 *     summary: Mark messages as read in a chat
 *     tags: [Chat]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Messages marked as read }
 */
router.put('/:chatId/read',
    validateRequest(chatIdParamSchema),
    ChatController.markMessagesAsRead
);

export default router;
