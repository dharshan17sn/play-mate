import { prisma } from '../config/database';
import {
  NotFoundError,
  ConflictError,
  ValidationError,
  ForbiddenError
} from '../utils/errors';
import { logger } from '../utils/logger';
import { TeamService } from './teamService';

export interface CreateJoinRequestData {
  fromUserId: string;
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
   * Send request to join a team
   */
  static async sendJoinRequest(data: CreateJoinRequestData) {
    try {
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
            userId: data.fromUserId,
            teamId: data.teamId,
          }
        }
      });

      if (existingMember) {
        throw new ConflictError('You are already a member of this team');
      }

      // Check if there's already a pending join request
      const existingRequest = await prisma.invitation.findFirst({
        where: {
          fromUserId: data.fromUserId,
          teamId: data.teamId,
          status: 'PENDING'
        }
      });

      if (existingRequest) {
        throw new ConflictError('Join request already sent to this team');
      }

      // Get team admins (members with isAdmin=true)
      const teamAdmins = await this.getTeamAdmins(data.teamId);
      if (teamAdmins.length === 0) {
        throw new NotFoundError('No team admins found');
      }

      // Create join requests for all team admins
      const invitations = await Promise.all(
        teamAdmins.map(admin =>
          prisma.invitation.create({
            data: {
              fromUserId: data.fromUserId,
              toUserId: admin.userId,
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
          })
        )
      );

      logger.info(`Join request sent from ${data.fromUserId} to team ${data.teamId}`);
      return invitations[0]; // Return the first invitation for consistency
    } catch (error) {
      logger.error('Error sending join request:', error);
      throw error;
    }
  }

  /**
   * Accept join request (admin only)
   */
  static async acceptJoinRequest(invitationId: string, adminUserId: string) {
    try {
      // Find the invitation
      const invitation = await prisma.invitation.findUnique({
        where: { id: invitationId },
        include: {
          team: true
        }
      });

      if (!invitation) {
        throw new NotFoundError('Join request not found');
      }

      // Check if the user is a team admin
      const isAdmin = await this.isTeamAdmin(adminUserId, invitation.teamId);
      if (!isAdmin) {
        throw new ForbiddenError('Only team admins can accept join requests');
      }

      // Check if the invitation is still pending
      if (invitation.status !== 'PENDING') {
        throw new ValidationError('Join request has already been processed');
      }

      // Use transaction to update all related invitations and add team member
      const result = await prisma.$transaction(async (tx) => {
        // Update all pending invitations for this user-team combination
        await tx.invitation.updateMany({
          where: {
            fromUserId: invitation.fromUserId,
            teamId: invitation.teamId,
            status: 'PENDING'
          },
          data: { status: 'ACCEPTED' }
        });

        // Add user to team
        const teamMember = await tx.teamMember.create({
          data: {
            userId: invitation.fromUserId,
            teamId: invitation.teamId,
            status: 'ACCEPTED',
            isAdmin: false, // New members are not admins by default
          }
        });

        return { teamMember };
      });

      logger.info(`Join request accepted: ${invitationId} by admin ${adminUserId}`);
      return result;
    } catch (error) {
      logger.error(`Error accepting join request ${invitationId}:`, error);
      throw error;
    }
  }

  /**
   * Reject join request (admin only)
   */
  static async rejectJoinRequest(invitationId: string, adminUserId: string) {
    try {
      // Find the invitation
      const invitation = await prisma.invitation.findUnique({
        where: { id: invitationId }
      });

      if (!invitation) {
        throw new NotFoundError('Join request not found');
      }

      // Check if the user is a team admin
      const isAdmin = await this.isTeamAdmin(adminUserId, invitation.teamId);
      if (!isAdmin) {
        throw new ForbiddenError('Only team admins can reject join requests');
      }

      // Check if the invitation is still pending
      if (invitation.status !== 'PENDING') {
        throw new ValidationError('Join request has already been processed');
      }

      // Update all pending invitations for this user-team combination
      const updatedInvitations = await prisma.invitation.updateMany({
        where: {
          fromUserId: invitation.fromUserId,
          teamId: invitation.teamId,
          status: 'PENDING'
        },
        data: { status: 'REJECTED' }
      });

      logger.info(`Join request rejected: ${invitationId} by admin ${adminUserId}`);
      return { updatedCount: updatedInvitations.count };
    } catch (error) {
      logger.error(`Error rejecting join request ${invitationId}:`, error);
      throw error;
    }
  }

  /**
   * Cancel join request (only requester can cancel)
   */
  static async cancelJoinRequest(invitationId: string, userId: string) {
    try {
      // Find the invitation
      const invitation = await prisma.invitation.findUnique({
        where: { id: invitationId }
      });

      if (!invitation) {
        throw new NotFoundError('Join request not found');
      }

      // Check if the user is the requester
      if (invitation.fromUserId !== userId) {
        throw new ForbiddenError('Only the requester can cancel a join request');
      }

      // Check if the invitation is still pending
      if (invitation.status !== 'PENDING') {
        throw new ValidationError('Can only cancel pending join requests');
      }

      // Delete all pending invitations for this user-team combination
      await prisma.invitation.deleteMany({
        where: {
          fromUserId: userId,
          teamId: invitation.teamId,
          status: 'PENDING'
        }
      });

      logger.info(`Join request cancelled: ${invitationId} by user ${userId}`);
      return { success: true };
    } catch (error) {
      logger.error(`Error cancelling join request ${invitationId}:`, error);
      throw error;
    }
  }

  /**
   * Get join requests sent by a user
   */
  static async getJoinRequestsSent(userId: string) {
    try {
      const invitations = await prisma.invitation.findMany({
        where: {
          fromUserId: userId,
          // Only get one invitation per team to avoid duplicates
        },
        include: {
          team: {
            select: {
              title: true,
            }
          }
        },
        orderBy: { sentAt: 'desc' },
        distinct: ['teamId', 'fromUserId']
      });

      return invitations.map(inv => ({
        id: inv.id,
        teamId: inv.teamId,
        teamTitle: inv.team.title,
        status: inv.status,
        sentAt: inv.sentAt,
      }));
    } catch (error) {
      logger.error(`Error getting join requests sent by user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get join requests received by team admins
   */
  static async getJoinRequestsReceived(adminUserId: string) {
    try {
      // Get teams where user is admin
      const adminTeams = await prisma.teamMember.findMany({
        where: {
          userId: adminUserId,
          isAdmin: true
        },
        select: { teamId: true }
      });

      const teamIds = adminTeams.map(member => member.teamId);

      const invitations = await prisma.invitation.findMany({
        where: {
          toUserId: adminUserId,
          teamId: { in: teamIds },
          status: 'PENDING'
        },
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
      logger.error(`Error getting join requests received by admin ${adminUserId}:`, error);
      throw error;
    }
  }

  /**
   * Get join request by ID with details
   */
  static async getJoinRequestById(invitationId: string): Promise<InvitationWithDetails> {
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
        throw new NotFoundError('Join request not found');
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
      logger.error(`Error getting join request by ID ${invitationId}:`, error);
      throw error;
    }
  }

  /**
   * Check if user is a team admin
   */
  static async isTeamAdmin(userId: string, teamId: string): Promise<boolean> {
    try {
      // Check if user is team creator
      const team = await prisma.team.findUnique({
        where: { id: teamId },
        select: { creatorId: true }
      });

      if (!team) {
        return false;
      }

      if (team.creatorId === userId) {
        return true;
      }

      // Check if user is a team member with admin privileges
      const adminMember = await prisma.teamMember.findUnique({
        where: {
          userId_teamId: {
            userId,
            teamId
          }
        },
        select: { isAdmin: true }
      });

      return adminMember?.isAdmin || false;
    } catch (error) {
      logger.error(`Error checking if user ${userId} is admin of team ${teamId}:`, error);
      return false;
    }
  }

  /**
   * Get team admins
   */
  static async getTeamAdmins(teamId: string) {
    try {
      // Get team creator
      const team = await prisma.team.findUnique({
        where: { id: teamId },
        include: {
          creator: {
            select: {
              user_id: true,
              displayName: true,
            }
          }
        }
      });

      if (!team) {
        throw new NotFoundError('Team not found');
      }

      // Get team members with admin privileges
      const adminMembers = await prisma.teamMember.findMany({
        where: {
          teamId,
          isAdmin: true
        },
        include: {
          user: {
            select: {
              user_id: true,
              displayName: true,
            }
          }
        }
      });

      const admins = [
        {
          userId: team.creator.user_id,
          displayName: team.creator.displayName,
          isCreator: true,
          addedAt: new Date() // Creator is added when team is created
        },
        ...adminMembers.map(member => ({
          userId: member.user.user_id,
          displayName: member.user.displayName,
          isCreator: false,
          addedAt: member.joinedAt
        }))
      ];

      return admins;
    } catch (error) {
      logger.error(`Error getting team admins for team ${teamId}:`, error);
      throw error;
    }
  }

  /**
   * Add team admin (creator or existing admin only)
   */
  static async addTeamAdmin(teamId: string, userId: string, adminUserId: string) {
    try {
      // Check if the user is authorized to add admins
      const isAuthorized = await this.isTeamAdmin(adminUserId, teamId);
      if (!isAuthorized) {
        throw new ForbiddenError('Only team admins can add other admins');
      }

      // Check if the target user exists
      const targetUser = await prisma.user.findUnique({
        where: { user_id: userId }
      });

      if (!targetUser) {
        throw new NotFoundError('Target user not found');
      }

      // Check if the target user is already a team member
      const existingMember = await prisma.teamMember.findUnique({
        where: {
          userId_teamId: {
            userId,
            teamId
          }
        }
      });

      if (!existingMember) {
        throw new NotFoundError('User is not a member of this team');
      }

      // Check if the target user is already an admin
      if (existingMember.isAdmin) {
        throw new ConflictError('User is already a team admin');
      }

      // Update the team member to be an admin
      const updatedMember = await prisma.teamMember.update({
        where: {
          userId_teamId: {
            userId,
            teamId
          }
        },
        data: { isAdmin: true },
        include: {
          user: {
            select: {
              user_id: true,
              displayName: true,
            }
          }
        }
      });

      logger.info(`Team admin added: ${userId} to team ${teamId} by ${adminUserId}`);
      return {
        userId: updatedMember.user.user_id,
        displayName: updatedMember.user.displayName,
        addedAt: updatedMember.joinedAt
      };
    } catch (error) {
      logger.error(`Error adding team admin ${userId} to team ${teamId}:`, error);
      throw error;
    }
  }

  /**
   * Remove team admin (creator only)
   */
  static async removeTeamAdmin(teamId: string, userId: string, creatorUserId: string) {
    try {
      // Check if the user is the team creator
      const team = await prisma.team.findUnique({
        where: { id: teamId },
        select: { creatorId: true }
      });

      if (!team) {
        throw new NotFoundError('Team not found');
      }

      if (team.creatorId !== creatorUserId) {
        throw new ForbiddenError('Only team creator can remove admins');
      }

      // Check if trying to remove the creator
      if (userId === creatorUserId) {
        throw new ValidationError('Cannot remove team creator as admin');
      }

      // Update the team member to remove admin privileges
      await prisma.teamMember.update({
        where: {
          userId_teamId: {
            userId,
            teamId
          }
        },
        data: { isAdmin: false }
      });

      logger.info(`Team admin removed: ${userId} from team ${teamId} by creator ${creatorUserId}`);
      return { success: true };
    } catch (error) {
      logger.error(`Error removing team admin ${userId} from team ${teamId}:`, error);
      throw error;
    }
  }

  /**
   * Approve team join request
   */
  static async approveTeamJoinRequest(invitationId: string, approverUserId: string) {
    try {
      // Get the invitation
      const invitation = await prisma.invitation.findUnique({
        where: { id: invitationId },
        include: {
          team: {
            include: { creator: true }
          },
          fromUser: true
        }
      });

      if (!invitation) {
        throw new NotFoundError('Invitation not found');
      }

      // Check if the approver is the team creator or an admin
      const teamMember = await prisma.teamMember.findUnique({
        where: {
          userId_teamId: {
            userId: approverUserId,
            teamId: invitation.teamId
          }
        }
      });

      const isCreator = invitation.team.creatorId === approverUserId;
      const isAdmin = teamMember?.isAdmin || false;

      if (!isCreator && !isAdmin) {
        throw new ForbiddenError('Only team creators or admins can approve join requests');
      }

      if (invitation.status !== 'PENDING') {
        throw new ValidationError('Invitation is not pending');
      }

      // Update invitation status
      await prisma.invitation.update({
        where: { id: invitationId },
        data: { status: 'ACCEPTED' }
      });

      // Add user to team
      await prisma.teamMember.create({
        data: {
          userId: invitation.fromUserId,
          teamId: invitation.teamId,
          status: 'ACCEPTED',
          isAdmin: false
        }
      });

      // Emit realtime notification to the user who requested to join
      const { RealtimeService } = await import('./realtime');
      RealtimeService.emitToUser(invitation.fromUserId, 'team:join:approved', {
        invitationId,
        team: {
          id: invitation.team.id,
          title: invitation.team.title
        },
        status: 'ACCEPTED'
      });

      logger.info(`Team join request approved: ${invitationId} by ${approverUserId}`);
      return { success: true };
    } catch (error) {
      logger.error(`Error approving team join request ${invitationId}:`, error);
      throw error;
    }
  }

  /**
   * Reject team join request
   */
  static async rejectTeamJoinRequest(invitationId: string, rejectorUserId: string) {
    try {
      // Get the invitation
      const invitation = await prisma.invitation.findUnique({
        where: { id: invitationId },
        include: {
          team: {
            include: { creator: true }
          },
          fromUser: true
        }
      });

      if (!invitation) {
        throw new NotFoundError('Invitation not found');
      }

      // Check if the rejector is the team creator or an admin
      const teamMember = await prisma.teamMember.findUnique({
        where: {
          userId_teamId: {
            userId: rejectorUserId,
            teamId: invitation.teamId
          }
        }
      });

      const isCreator = invitation.team.creatorId === rejectorUserId;
      const isAdmin = teamMember?.isAdmin || false;

      if (!isCreator && !isAdmin) {
        throw new ForbiddenError('Only team creators or admins can reject join requests');
      }

      if (invitation.status !== 'PENDING') {
        throw new ValidationError('Invitation is not pending');
      }

      // Update invitation status
      await prisma.invitation.update({
        where: { id: invitationId },
        data: { status: 'REJECTED' }
      });

      // Emit realtime notification to the user who requested to join
      const { RealtimeService } = await import('./realtime');
      RealtimeService.emitToUser(invitation.fromUserId, 'team:join:rejected', {
        invitationId,
        team: {
          id: invitation.team.id,
          title: invitation.team.title
        },
        status: 'REJECTED'
      });

      logger.info(`Team join request rejected: ${invitationId} by ${rejectorUserId}`);
      return { success: true };
    } catch (error) {
      logger.error(`Error rejecting team join request ${invitationId}:`, error);
      throw error;
    }
  }
}
