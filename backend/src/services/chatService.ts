import { prisma } from '../config/database';
import { RealtimeService } from './realtime';
import { NotFoundError, ValidationError } from '../utils/errors';
import { logger } from '../utils/logger';

export interface CreateChatData {
    userAId: string;
    userBId: string;
}

export interface SendMessageData {
    chatId: string;
    senderId: string;
    content: string;
}

export interface ChatWithParticipants {
    id: string;
    userAId: string;
    userBId: string;
    createdAt: Date;
    updatedAt: Date;
    userA: { user_id: string; displayName: string; photo?: string | null };
    userB: { user_id: string; displayName: string; photo?: string | null };
    lastMessage?: {
        id: string;
        content: string;
        sentAt: Date;
        senderId: string;
    };
    unreadCount?: number;
}

export class ChatService {
    /**
     * Get or create a chat between two users
     */
    static async getOrCreateChat(userAId: string, userBId: string) {
        try {
            if (userAId === userBId) {
                throw new ValidationError('Cannot create chat with yourself');
            }

            // Ensure consistent ordering for unique constraint
            const [a, b] = userAId < userBId ? [userAId, userBId] : [userBId, userAId];

            // Check if chat already exists
            let chat = await prisma.chat.findUnique({
                where: {
                    userAId_userBId: {
                        userAId: a,
                        userBId: b,
                    },
                },
                include: {
                    userA: {
                        select: {
                            user_id: true,
                            displayName: true,
                            photo: true,
                        },
                    },
                    userB: {
                        select: {
                            user_id: true,
                            displayName: true,
                            photo: true,
                        },
                    },
                },
            });

            // Create chat if it doesn't exist
            if (!chat) {
                chat = await prisma.chat.create({
                    data: {
                        userAId: a,
                        userBId: b,
                    },
                    include: {
                        userA: {
                            select: {
                                user_id: true,
                                displayName: true,
                                photo: true,
                            },
                        },
                        userB: {
                            select: {
                                user_id: true,
                                displayName: true,
                                photo: true,
                            },
                        },
                    },
                });

                logger.info(`Chat created between ${userAId} and ${userBId}`);
            }

            return chat;
        } catch (error) {
            logger.error('Error getting or creating chat:', error);
            throw error;
        }
    }

    /**
     * Get all chats for a user with last message and unread count
     */
    static async getUserChats(userId: string): Promise<ChatWithParticipants[]> {
        try {
            const chats = await prisma.chat.findMany({
                where: {
                    OR: [
                        { userAId: userId },
                        { userBId: userId },
                    ],
                },
                include: {
                    userA: {
                        select: {
                            user_id: true,
                            displayName: true,
                            photo: true,
                        },
                    },
                    userB: {
                        select: {
                            user_id: true,
                            displayName: true,
                            photo: true,
                        },
                    },
                    messages: {
                        orderBy: { sentAt: 'desc' },
                        take: 1,
                        select: {
                            id: true,
                            content: true,
                            sentAt: true,
                            senderId: true,
                        },
                    },
                },
                orderBy: { updatedAt: 'desc' },
            });

            // Get unread counts for each chat
            const chatsWithUnread = await Promise.all(
                chats.map(async (chat) => {
                    const unreadCount = await prisma.chatMessage.count({
                        where: {
                            chatId: chat.id,
                            senderId: { not: userId },
                            readAt: null,
                        },
                    });

                    return {
                        ...chat,
                        lastMessage: chat.messages[0] || undefined,
                        unreadCount,
                    };
                })
            );

            return chatsWithUnread;
        } catch (error) {
            logger.error('Error getting user chats:', error);
            throw error;
        }
    }

    /**
     * Get messages for a specific chat
     */
    static async getChatMessages(chatId: string, userId: string, limit: number = 50, offset: number = 0) {
        try {
            // Verify user has access to this chat
            const chat = await prisma.chat.findFirst({
                where: {
                    id: chatId,
                    OR: [
                        { userAId: userId },
                        { userBId: userId },
                    ],
                },
            });

            if (!chat) {
                throw new NotFoundError('Chat not found or access denied');
            }

            const messages = await prisma.chatMessage.findMany({
                where: { chatId },
                include: {
                    sender: {
                        select: {
                            user_id: true,
                            displayName: true,
                            photo: true,
                        },
                    },
                },
                orderBy: { sentAt: 'desc' },
                take: limit,
                skip: offset,
            });

            return messages.reverse(); // Return in chronological order
        } catch (error) {
            logger.error('Error getting chat messages:', error);
            throw error;
        }
    }

    /**
     * Send a message in a chat
     */
    static async sendMessage(data: SendMessageData) {
        try {
            // Verify user has access to this chat
            const chat = await prisma.chat.findFirst({
                where: {
                    id: data.chatId,
                    OR: [
                        { userAId: data.senderId },
                        { userBId: data.senderId },
                    ],
                },
                include: {
                    userA: {
                        select: {
                            user_id: true,
                            displayName: true,
                        },
                    },
                    userB: {
                        select: {
                            user_id: true,
                            displayName: true,
                        },
                    },
                },
            });

            if (!chat) {
                throw new NotFoundError('Chat not found or access denied');
            }

            // Create message
            const message = await prisma.chatMessage.create({
                data: {
                    chatId: data.chatId,
                    senderId: data.senderId,
                    content: data.content,
                },
                include: {
                    sender: {
                        select: {
                            user_id: true,
                            displayName: true,
                            photo: true,
                        },
                    },
                },
            });

            // Update chat's updatedAt timestamp
            await prisma.chat.update({
                where: { id: data.chatId },
                data: { updatedAt: new Date() },
            });

            // Determine recipient
            const recipientId = chat.userAId === data.senderId ? chat.userBId : chat.userAId;

            // Emit realtime event to recipient
            RealtimeService.emitToUser(recipientId, 'chat:message', {
                id: message.id,
                chatId: message.chatId,
                content: message.content,
                sentAt: message.sentAt,
                sender: message.sender,
            });

            // Also emit to sender for confirmation
            RealtimeService.emitToUser(data.senderId, 'chat:message:sent', {
                id: message.id,
                chatId: message.chatId,
                content: message.content,
                sentAt: message.sentAt,
                sender: message.sender,
            });

            logger.info(`Message sent in chat ${data.chatId} by ${data.senderId}`);
            return message;
        } catch (error) {
            logger.error('Error sending message:', error);
            throw error;
        }
    }

    /**
     * Mark messages as read
     */
    static async markMessagesAsRead(chatId: string, userId: string) {
        try {
            // Verify user has access to this chat
            const chat = await prisma.chat.findFirst({
                where: {
                    id: chatId,
                    OR: [
                        { userAId: userId },
                        { userBId: userId },
                    ],
                },
            });

            if (!chat) {
                throw new NotFoundError('Chat not found or access denied');
            }

            // Mark all unread messages as read
            await prisma.chatMessage.updateMany({
                where: {
                    chatId,
                    senderId: { not: userId },
                    readAt: null,
                },
                data: {
                    readAt: new Date(),
                },
            });

            logger.info(`Messages marked as read in chat ${chatId} by ${userId}`);
            return { success: true };
        } catch (error) {
            logger.error('Error marking messages as read:', error);
            throw error;
        }
    }
}
