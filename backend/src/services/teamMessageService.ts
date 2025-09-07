import { prisma } from '../config/database';
import { RealtimeService } from './realtime';
import { NotFoundError, ValidationError, ForbiddenError } from '../utils/errors';
import { logger } from '../utils/logger';

export interface SendTeamMessageData {
    teamId: string;
    senderId: string;
    content: string;
}

export interface TeamMessageWithSender {
    id: string;
    teamId: string;
    content: string;
    sentAt: Date;
    readAt?: Date | null;
    sender: {
        user_id: string;
        displayName: string;
        photo?: string | null;
    };
}

export class TeamMessageService {
    /**
     * Send a message to a team
     */
    static async sendTeamMessage(data: SendTeamMessageData): Promise<TeamMessageWithSender> {
        try {
            const { teamId, senderId, content } = data;

            // Validate input
            if (!content.trim()) {
                throw new ValidationError('Message content cannot be empty');
            }

            // Check if team exists
            const team = await prisma.team.findUnique({
                where: { id: teamId },
                include: {
                    members: {
                        where: { userId: senderId, status: 'ACCEPTED' }
                    }
                }
            });

            if (!team) {
                throw new NotFoundError('Team not found');
            }

            // Check if user is a member of the team
            if (team.members.length === 0) {
                throw new ForbiddenError('You are not a member of this team');
            }

            // Create the message
            const message = await prisma.teamMessage.create({
                data: {
                    teamId,
                    senderId,
                    content: content.trim()
                },
                include: {
                    sender: {
                        select: {
                            user_id: true,
                            displayName: true,
                            photo: true
                        }
                    }
                }
            });

            // Get all team members for real-time notification
            const teamMembers = await prisma.teamMember.findMany({
                where: {
                    teamId,
                    status: 'ACCEPTED'
                },
                select: {
                    userId: true
                }
            });

            // Emit real-time notification to all team members
            const { RealtimeService } = await import('./realtime');
            teamMembers.forEach(member => {
                RealtimeService.emitToUser(member.userId, 'team:message', {
                    id: message.id,
                    teamId: message.teamId,
                    content: message.content,
                    sentAt: message.sentAt,
                    sender: message.sender
                });
            });

            logger.info(`Team message sent by ${senderId} to team ${teamId}`);

            return {
                id: message.id,
                teamId: message.teamId,
                content: message.content,
                sentAt: message.sentAt,
                readAt: message.readAt,
                sender: message.sender
            };
        } catch (error) {
            logger.error(`Error sending team message:`, error);
            throw error;
        }
    }

    /**
     * Get messages for a team
     */
    static async getTeamMessages(teamId: string, userId: string, page: number = 1, limit: number = 50): Promise<TeamMessageWithSender[]> {
        try {
            // Check if user is a member of the team
            const teamMember = await prisma.teamMember.findFirst({
                where: {
                    teamId,
                    userId,
                    status: 'ACCEPTED'
                }
            });

            if (!teamMember) {
                throw new ForbiddenError('You are not a member of this team');
            }

            // Get messages with pagination
            const messages = await prisma.teamMessage.findMany({
                where: { teamId },
                include: {
                    sender: {
                        select: {
                            user_id: true,
                            displayName: true,
                            photo: true
                        }
                    }
                },
                orderBy: { sentAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit
            });

            return messages.map(message => ({
                id: message.id,
                teamId: message.teamId,
                content: message.content,
                sentAt: message.sentAt,
                readAt: message.readAt,
                sender: message.sender
            }));
        } catch (error) {
            logger.error(`Error getting team messages for team ${teamId}:`, error);
            throw error;
        }
    }

    /**
     * Mark team messages as read
     */
    static async markTeamMessagesAsRead(teamId: string, userId: string): Promise<void> {
        try {
            // Check if user is a member of the team
            const teamMember = await prisma.teamMember.findFirst({
                where: {
                    teamId,
                    userId,
                    status: 'ACCEPTED'
                }
            });

            if (!teamMember) {
                throw new ForbiddenError('You are not a member of this team');
            }

            // Mark all unread messages as read
            await prisma.teamMessage.updateMany({
                where: {
                    teamId,
                    senderId: { not: userId }, // Don't mark own messages as read
                    readAt: null
                },
                data: {
                    readAt: new Date()
                }
            });

            logger.info(`Team messages marked as read for user ${userId} in team ${teamId}`);
        } catch (error) {
            logger.error(`Error marking team messages as read:`, error);
            throw error;
        }
    }
}
