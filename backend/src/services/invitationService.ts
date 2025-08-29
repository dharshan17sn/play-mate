import { prisma } from '../config/database';
import { 
  NotFoundError, 
  ConflictError, 
  ValidationError,
  ForbiddenError 
} from '../utils/errors';
import { logger } from '../utils/logger';
import { TeamService } from './teamService';

export interface CreateInvitationData {
  fromUserId: string;
  toUserId: string;
  teamId: string;
}

export interface InvitationWithDetails {
  id: string;
  fromUserId: string;
  fromUserDisplayName: string;
  toUserId: string;
  toUserDisplayName: string;
  teamId: string;
  teamTitle: string;
  status: string;
  sentAt: Date;
}

export class InvitationService {
  /**
   * Send invitation to join a team
   */
  static async sendInvitation(data: CreateInvitationData) {
    try {
      // Check if the sender is a member of the team
      const isMember = await TeamService.isTeamMember(data.fromUserId, data.teamId);
      if (!isMember) {
        throw new ForbiddenError('Only team members can send invitations');
      }

      // Check if the target user exists
      const targetUser = await prisma.user.findUnique({
        where: { user_id: data.toUserId }
      });

      if (!targetUser) {
        throw new NotFoundError('Target user not found');
      }

      // Check if the team exists
      const team = await prisma.team.findUnique({
        where: { id: data.teamId }
      });

      if (!team) {
        throw new NotFoundError('Team not found');
      }

      // Check if user is already a member of the team
      const existingMember = await prisma.teamMember.findUnique({
        where: {
          userId_teamId: {
            userId: data.toUserId,
            teamId: data.teamId,
          }
        }
      });

      if (existingMember) {
        throw new ConflictError('User is already a member of this team');
      }

      // Check if there's already a pending invitation
      const existingInvitation = await prisma.invitation.findFirst({
        where: {
          fromUserId: data.fromUserId,
          toUserId: data.toUserId,
          teamId: data.teamId,
          status: 'PENDING'
        }
      });

      if (existingInvitation) {
        throw new ConflictError('Invitation already sent to this user');
      }

      // Create the invitation
      const invitation = await prisma.invitation.create({
        data: {
          fromUserId: data.fromUserId,
          toUserId: data.toUserId,
          teamId: data.teamId,
        },
        include: {
          fromUser: {
            select: {
              displayName: true,
            }
          },
          toUser: {
            select: {
              displayName: true,
            }
          },
          team: {
            select: {
              title: true,
            }
          }
        }
      });

      logger.info(`Invitation sent from ${data.fromUserId} to ${data.toUserId} for team ${data.teamId}`);
      return invitation;
    } catch (error) {
      logger.error('Error sending invitation:', error);
      throw error;
    }
  }

  /**
   * Accept invitation
   */
  static async acceptInvitation(invitationId: string, userId: string) {
    try {
      // Find the invitation
      const invitation = await prisma.invitation.findUnique({
        where: { id: invitationId },
        include: {
          team: true
        }
      });

      if (!invitation) {
        throw new NotFoundError('Invitation not found');
      }

      // Check if the invitation is for the correct user
      if (invitation.toUserId !== userId) {
        throw new ForbiddenError('You can only accept invitations sent to you');
      }

      // Check if the invitation is still pending
      if (invitation.status !== 'PENDING') {
        throw new ValidationError('Invitation has already been processed');
      }

      // Use transaction to update invitation and add team member
      const result = await prisma.$transaction(async (tx) => {
        // Update invitation status
        const updatedInvitation = await tx.invitation.update({
          where: { id: invitationId },
          data: { status: 'ACCEPTED' }
        });

        // Add user to team
        const teamMember = await tx.teamMember.create({
          data: {
            userId: userId,
            teamId: invitation.teamId,
            status: 'ACCEPTED',
          }
        });

        return { invitation: updatedInvitation, teamMember };
      });

      logger.info(`Invitation accepted: ${invitationId} by user ${userId}`);
      return result;
    } catch (error) {
      logger.error(`Error accepting invitation ${invitationId}:`, error);
      throw error;
    }
  }

  /**
   * Reject invitation
   */
  static async rejectInvitation(invitationId: string, userId: string) {
    try {
      // Find the invitation
      const invitation = await prisma.invitation.findUnique({
        where: { id: invitationId }
      });

      if (!invitation) {
        throw new NotFoundError('Invitation not found');
      }

      // Check if the invitation is for the correct user
      if (invitation.toUserId !== userId) {
        throw new ForbiddenError('You can only reject invitations sent to you');
      }

      // Check if the invitation is still pending
      if (invitation.status !== 'PENDING') {
        throw new ValidationError('Invitation has already been processed');
      }

      // Update invitation status
      const updatedInvitation = await prisma.invitation.update({
        where: { id: invitationId },
        data: { status: 'REJECTED' }
      });

      logger.info(`Invitation rejected: ${invitationId} by user ${userId}`);
      return updatedInvitation;
    } catch (error) {
      logger.error(`Error rejecting invitation ${invitationId}:`, error);
      throw error;
    }
  }

  /**
   * Cancel invitation (only sender can cancel)
   */
  static async cancelInvitation(invitationId: string, userId: string) {
    try {
      // Find the invitation
      const invitation = await prisma.invitation.findUnique({
        where: { id: invitationId }
      });

      if (!invitation) {
        throw new NotFoundError('Invitation not found');
      }

      // Check if the user is the sender
      if (invitation.fromUserId !== userId) {
        throw new ForbiddenError('Only the sender can cancel an invitation');
      }

      // Check if the invitation is still pending
      if (invitation.status !== 'PENDING') {
        throw new ValidationError('Can only cancel pending invitations');
      }

      // Delete the invitation
      await prisma.invitation.delete({
        where: { id: invitationId }
      });

      logger.info(`Invitation cancelled: ${invitationId} by user ${userId}`);
      return { success: true };
    } catch (error) {
      logger.error(`Error cancelling invitation ${invitationId}:`, error);
      throw error;
    }
  }

  /**
   * Get invitations sent by a user
   */
  static async getInvitationsSent(userId: string) {
    try {
      const invitations = await prisma.invitation.findMany({
        where: { fromUserId: userId },
        include: {
          toUser: {
            select: {
              displayName: true,
            }
          },
          team: {
            select: {
              title: true,
            }
          }
        },
        orderBy: { sentAt: 'desc' }
      });

      return invitations.map(inv => ({
        id: inv.id,
        toUserId: inv.toUserId,
        toUserDisplayName: inv.toUser.displayName,
        teamId: inv.teamId,
        teamTitle: inv.team.title,
        status: inv.status,
        sentAt: inv.sentAt,
      }));
    } catch (error) {
      logger.error(`Error getting invitations sent by user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get invitations received by a user
   */
  static async getInvitationsReceived(userId: string) {
    try {
      const invitations = await prisma.invitation.findMany({
        where: { toUserId: userId },
        include: {
          fromUser: {
            select: {
              displayName: true,
            }
          },
          team: {
            select: {
              title: true,
            }
          }
        },
        orderBy: { sentAt: 'desc' }
      });

      return invitations.map(inv => ({
        id: inv.id,
        fromUserId: inv.fromUserId,
        fromUserDisplayName: inv.fromUser.displayName,
        teamId: inv.teamId,
        teamTitle: inv.team.title,
        status: inv.status,
        sentAt: inv.sentAt,
      }));
    } catch (error) {
      logger.error(`Error getting invitations received by user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get invitation by ID with details
   */
  static async getInvitationById(invitationId: string): Promise<InvitationWithDetails> {
    try {
      const invitation = await prisma.invitation.findUnique({
        where: { id: invitationId },
        include: {
          fromUser: {
            select: {
              displayName: true,
            }
          },
          toUser: {
            select: {
              displayName: true,
            }
          },
          team: {
            select: {
              title: true,
            }
          }
        }
      });

      if (!invitation) {
        throw new NotFoundError('Invitation not found');
      }

      return {
        id: invitation.id,
        fromUserId: invitation.fromUserId,
        fromUserDisplayName: invitation.fromUser.displayName,
        toUserId: invitation.toUserId,
        toUserDisplayName: invitation.toUser.displayName,
        teamId: invitation.teamId,
        teamTitle: invitation.team.title,
        status: invitation.status,
        sentAt: invitation.sentAt,
      };
    } catch (error) {
      logger.error(`Error getting invitation by ID ${invitationId}:`, error);
      throw error;
    }
  }
}
