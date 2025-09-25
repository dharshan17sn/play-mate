import { prisma } from '../config/database';
import {
  NotFoundError,
  ConflictError,
  ValidationError,
  ForbiddenError
} from '../utils/errors';
import { logger } from '../utils/logger';

export interface CreateTeamData {
  title: string;
  description?: string;
  photo?: string;
  gameName: string;
  noOfPlayers?: number;
  isPublic?: boolean;
  creatorId: string;
}

export interface UpdateTeamData {
  title?: string;
  description?: string;
  photo?: string;
  noOfPlayers?: number;
  isPublic?: boolean;
}

export interface TeamWithMembers {
  id: string;
  title: string;
  description?: string | null;
  photo?: string | null;
  gameName: string;
  noOfPlayers?: number | null;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  creatorId: string;
  members: Array<{
    id: string;
    userId: string;
    displayName: string;
    photo?: string | null;
    status: string;
    joinedAt: Date;
    isAdmin: boolean;
  }>;
  game: {
    name: string;
  };
}

export class TeamService {
  /**
   * Resolve a team member by identifier which can be either the user's user_id or the teamMember.id
   */
  private static async resolveTeamMember(teamId: string, memberIdentifier: string) {
    // Try composite key (user_id + teamId)
    const byComposite = await prisma.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId: memberIdentifier,
          teamId
        }
      },
      include: {
        user: {
          select: { user_id: true, displayName: true, photo: true }
        }
      }
    });

    if (byComposite) return byComposite;

    // Fallback: consider memberIdentifier is the teamMember primary id
    const byMemberId = await prisma.teamMember.findFirst({
      where: { id: memberIdentifier, teamId },
      include: {
        user: {
          select: { user_id: true, displayName: true, photo: true }
        }
      }
    });

    return byMemberId;
  }
  /**
   * Create a new team
   */
  static async createTeam(data: CreateTeamData) {
    try {
      // Verify the game exists
      const game = await prisma.game.findUnique({
        where: { name: data.gameName }
      });

      if (!game) {
        throw new NotFoundError('Game not found');
      }

      // Create team and add creator as first member with admin privileges
      const team = await prisma.team.create({
        data: {
          title: data.title,
          description: data.description,
          photo: data.photo,
          gameName: data.gameName,
          noOfPlayers: data.noOfPlayers,
          isPublic: data.isPublic ?? true, // Default to public if not specified
          creatorId: data.creatorId,
          members: {
            create: {
              userId: data.creatorId,
              status: 'ACCEPTED',
              isAdmin: true, // Creator is automatically an admin
            }
          }
        },
        include: {
          game: {
            select: {
              name: true,
            }
          },
          members: {
            include: {
              user: {
                select: {
                  displayName: true,
                }
              }
            }
          }
        }
      });

      logger.info(`Team created: ${team.title} by user ${data.creatorId}`);
      return team;
    } catch (error) {
      logger.error('Error creating team:', error);
      throw error;
    }
  }

  /**
   * Get team by ID with members
   */
  static async getTeamById(teamId: string): Promise<TeamWithMembers> {
    try {
      const team = await prisma.team.findUnique({
        where: { id: teamId },
        include: {
          game: {
            select: {
              name: true,
            }
          },
          members: {
            include: {
              user: {
                select: {
                  user_id: true,
                  displayName: true,
                  photo: true
                }
              }
            }
          }
        }
      });

      if (!team) {
        throw new NotFoundError('Team not found');
      }

      // Transform the data to match the interface
      const transformedTeam: TeamWithMembers = {
        id: team.id,
        title: team.title,
        description: team.description,
        photo: team.photo,
        gameName: team.gameName,
        noOfPlayers: team.noOfPlayers,
        isPublic: team.isPublic,
        createdAt: team.createdAt,
        updatedAt: team.updatedAt,
        creatorId: team.creatorId,
        members: team.members.map(member => ({
          id: member.id,
          userId: member.userId,
          displayName: member.user.displayName,
          photo: member.user.photo,
          status: member.status,
          joinedAt: member.joinedAt,
          isAdmin: member.isAdmin,
        })),
        game: team.game,
      };

      return transformedTeam;
    } catch (error) {
      logger.error(`Error getting team by ID ${teamId}:`, error);
      throw error;
    }
  }

  /**
   * Update team
   */
  static async updateTeam(teamId: string, userId: string, data: UpdateTeamData) {
    try {
      // Check if user is team creator or member
      const teamMember = await prisma.teamMember.findUnique({
        where: {
          userId_teamId: {
            userId,
            teamId,
          }
        }
      });

      if (!teamMember) {
        throw new ForbiddenError('You are not a member of this team');
      }

      const team = await prisma.team.update({
        where: { id: teamId },
        data,
        include: {
          game: {
            select: {
              name: true,
            }
          }
        }
      });

      logger.info(`Team updated: ${team.title} by user ${userId}`);
      return team;
    } catch (error) {
      logger.error(`Error updating team ${teamId}:`, error);
      throw error;
    }
  }

  /**
   * Delete team
   */
  static async deleteTeam(teamId: string, userId: string) {
    try {
      // Check if user is team creator
      const team = await prisma.team.findUnique({
        where: { id: teamId }
      });

      if (!team) {
        throw new NotFoundError('Team not found');
      }

      if (team.creatorId !== userId) {
        throw new ForbiddenError('Only team creator can delete the team');
      }

      // Delete related records first to avoid FK constraint violations
      await prisma.$transaction([
        prisma.teamMessage.deleteMany({ where: { teamId } }),
        prisma.tournamentTeam.deleteMany({ where: { teamId } }),
        prisma.teamMember.deleteMany({ where: { teamId } }),
        prisma.invitation.deleteMany({ where: { teamId } }),
      ]);

      // Delete team
      await prisma.team.delete({
        where: { id: teamId }
      });

      logger.info(`Team deleted: ${team.title} by user ${userId}`);
      return { success: true };
    } catch (error) {
      logger.error(`Error deleting team ${teamId}:`, error);
      throw error;
    }
  }

  /**
   * Get teams by user ID
   */
  static async getTeamsByUserId(userId: string) {
    try {
      const teams = await prisma.teamMember.findMany({
        where: { userId },
        include: {
          team: {
            include: {
              game: {
                select: {
                  name: true,
                }
              }
            }
          }
        },
        orderBy: { joinedAt: 'desc' }
      });

      return teams.map(tm => ({
        id: tm.team.id,
        title: tm.team.title,
        description: tm.team.description,
        photo: tm.team.photo,
        isPublic: tm.team.isPublic,
        status: tm.status,
        joinedAt: tm.joinedAt,
        game: tm.team.game,
      }));
    } catch (error) {
      logger.error(`Error getting teams for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Check if user is team member
   */
  static async isTeamMember(userId: string, teamId: string): Promise<boolean> {
    try {
      const member = await prisma.teamMember.findUnique({
        where: {
          userId_teamId: {
            userId,
            teamId,
          }
        }
      });

      return !!member && member.status === 'ACCEPTED';
    } catch (error) {
      logger.error(`Error checking team membership for user ${userId} in team ${teamId}:`, error);
      return false;
    }
  }

  /**
   * Get all teams with pagination
   */
  static async getAllTeams(page: number = 1, limit: number = 10, search?: string, isPublic?: boolean) {
    try {
      const skip = (page - 1) * limit;

      let where: any = {};

      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' as any } },
          { description: { contains: search, mode: 'insensitive' as any } },
        ];
      }

      // Filter by public/private if specified
      if (isPublic !== undefined) {
        where.isPublic = isPublic;
      }

      const [teams, total] = await Promise.all([
        prisma.team.findMany({
          where,
          include: {
            game: {
              select: {
                name: true,
              }
            },
            _count: {
              select: {
                members: true
              }
            }
          },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.team.count({ where }),
      ]);

      return {
        teams,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      logger.error('Error getting all teams:', error);
      throw error;
    }
  }

  /**
   * Get public teams only (for active teams display)
   */
  static async getPublicTeams(page: number = 1, limit: number = 10, gameName?: string) {
    try {
      const skip = (page - 1) * limit;

      let where: any = {
        isPublic: true,
        // Only teams that currently have at least one accepted member
        members: {
          some: {
            status: 'ACCEPTED'
          }
        }
      };

      if (gameName) {
        where.gameName = gameName;
      }

      const [teams, total] = await Promise.all([
        prisma.team.findMany({
          where,
          include: {
            game: {
              select: {
                name: true,
              }
            },
            creator: {
              select: {
                user_id: true,
                displayName: true,
                photo: true,
              }
            },
            _count: {
              select: {
                members: true
              }
            }
          },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.team.count({ where }),
      ]);

      return {
        teams,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      logger.error('Error getting public teams:', error);
      throw error;
    }
  }

  /**
   * Join a team directly (used for invite links). Idempotent.
   */
  static async joinTeamDirect(userId: string, teamId: string) {
    try {
      const team = await prisma.team.findUnique({ where: { id: teamId } });
      if (!team) {
        throw new NotFoundError('Team not found');
      }

      const existing = await prisma.teamMember.findUnique({
        where: { userId_teamId: { userId, teamId } },
      });

      if (existing) {
        // Ensure status is ACCEPTED for existing membership
        if (existing.status !== 'ACCEPTED') {
          await prisma.teamMember.update({ where: { id: existing.id }, data: { status: 'ACCEPTED' } });
        }
        return { joined: false, alreadyMember: true };
      }

      await prisma.teamMember.create({
        data: { userId, teamId, status: 'ACCEPTED', isAdmin: false },
      });

      return { joined: true };
    } catch (error) {
      logger.error(`Error joining team directly ${teamId} by ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Request to join a team
   */
  static async requestToJoinTeam(userId: string, teamId: string) {
    try {
      // Check if team exists
      const team = await prisma.team.findUnique({
        where: { id: teamId },
        include: { creator: true }
      });

      if (!team) {
        throw new NotFoundError('Team not found');
      }

      // Check if user is already a member
      const existingMember = await prisma.teamMember.findUnique({
        where: { userId_teamId: { userId, teamId } }
      });

      if (existingMember) {
        throw new ConflictError('You are already a member of this team');
      }

      // Check if there's already a pending invitation
      const existingInvitation = await prisma.invitation.findFirst({
        where: { fromUserId: userId, teamId, status: 'PENDING' }
      });

      if (existingInvitation) {
        throw new ConflictError('You already have a pending request to join this team');
      }

      // Create join request (invitation from user to team)
      const invitation = await prisma.invitation.create({
        data: {
          fromUserId: userId,
          toUserId: team.creatorId, // Send to team creator for now
          teamId,
          status: 'PENDING'
        },
        include: {
          fromUser: {
            select: { user_id: true, displayName: true, photo: true }
          },
          team: {
            select: { id: true, title: true }
          }
        }
      });

      // Emit realtime notification to team creator and admins
      const { RealtimeService } = await import('./realtime');
      RealtimeService.emitToUser(team.creatorId, 'team:join:request', {
        id: invitation.id,
        fromUser: invitation.fromUser,
        team: invitation.team,
        status: invitation.status,
        sentAt: invitation.sentAt
      });

      return invitation;
    } catch (error) {
      logger.error(`Error requesting to join team ${teamId}:`, error);
      throw error;
    }
  }

  /**
   * Get team members
   */
  static async getTeamMembers(teamId: string) {
    try {
      const members = await prisma.teamMember.findMany({
        where: { teamId, status: 'ACCEPTED' },
        include: {
          user: {
            select: { user_id: true, displayName: true, photo: true }
          }
        },
        orderBy: { joinedAt: 'asc' }
      });

      return members.map(member => ({
        id: member.id,
        userId: member.userId,
        displayName: member.user.displayName,
        photo: member.user.photo,
        isAdmin: member.isAdmin,
        joinedAt: member.joinedAt
      }));
    } catch (error) {
      logger.error(`Error getting team members for team ${teamId}:`, error);
      throw error;
    }
  }

  /**
   * Make a team member an admin
   */
  static async makeMemberAdmin(teamId: string, memberId: string, requesterId: string) {
    try {
      logger.info(`makeMemberAdmin called with teamId=${teamId}, memberId=${memberId}, requesterId=${requesterId}`);
      // First, verify the requester is an admin of the team
      const requesterMembership = await prisma.teamMember.findFirst({
        where: {
          teamId,
          userId: requesterId,
          isAdmin: true
        }
      });

      if (!requesterMembership) {
        throw new ForbiddenError('Only team admins can promote members to admin');
      }

      // Check if the member exists in the team (accept user_id or teamMember.id)
      const member = await this.resolveTeamMember(teamId, memberId);

      if (!member) {
        // Check if user exists for clearer error
        const userExists = await prisma.user.findUnique({ where: { user_id: memberId }, select: { user_id: true } });
        if (!userExists) {
          throw new NotFoundError('User not found');
        }
        throw new NotFoundError('User is not a member of this team');
      }

      if (member.isAdmin) {
        throw new ConflictError('Member is already an admin');
      }

      // Update the member to be an admin
      const updatedMember = await prisma.teamMember.update({
        where: { id: member.id },
        data: {
          isAdmin: true
        },
        include: {
          user: {
            select: {
              user_id: true,
              displayName: true,
              photo: true
            }
          }
        }
      });

      logger.info(`Member ${memberId} promoted to admin in team ${teamId} by ${requesterId}`);

      return {
        id: updatedMember.id,
        userId: updatedMember.userId,
        displayName: updatedMember.user.displayName,
        photo: updatedMember.user.photo,
        status: updatedMember.status,
        joinedAt: updatedMember.joinedAt,
        isAdmin: updatedMember.isAdmin
      };
    } catch (error) {
      logger.error(`Error making member ${memberId} admin in team ${teamId}:`, error);
      throw error;
    }
  }

  /**
   * Demote an admin to regular member
   */
  static async removeMemberAdmin(teamId: string, memberId: string, requesterId: string) {
    try {
      logger.info(`removeMemberAdmin called with teamId=${teamId}, memberId=${memberId}, requesterId=${requesterId}`);
      // Get team for creator check
      const team = await prisma.team.findUnique({ where: { id: teamId }, select: { creatorId: true } });

      // Immediately forbid demoting the team creator, regardless of teamMember row state
      if (team && memberId === team.creatorId) {
        throw new ForbiddenError('Cannot demote the team creator');
      }

      // Verify the requester is creator or an admin of the team
      const requesterIsCreator = !!team && team.creatorId === requesterId;
      const requesterMembership = await prisma.teamMember.findUnique({
        where: {
          userId_teamId: {
            userId: requesterId,
            teamId
          }
        },
        select: { isAdmin: true }
      });

      const requesterIsAdmin = requesterMembership?.isAdmin === true;
      if (!requesterIsCreator && !requesterIsAdmin) {
        throw new ForbiddenError('Only team creator or admins can demote admins');
      }

      // Check if the member exists in the team (accept user_id or teamMember.id)
      const member = await this.resolveTeamMember(teamId, memberId);

      if (!member) {
        // Check if user exists for clearer error
        const userExists = await prisma.user.findUnique({ where: { user_id: memberId }, select: { user_id: true } });
        if (!userExists) {
          throw new NotFoundError('User not found');
        }
        throw new NotFoundError('User is not a member of this team');
      }

      // If the member is not an admin, nothing to demote
      if (!member.isAdmin) {
        throw new ConflictError('Member is not an admin');
      }

      // Prevent demoting the team creator
      if (team && team.creatorId === member.userId) {
        throw new ForbiddenError('Cannot demote the team creator');
      }

      // Prevent admins from demoting themselves (creator can still demote self if needed)
      if (!requesterIsCreator && member.userId === requesterId) {
        throw new ForbiddenError('Admins cannot demote themselves');
      }

      // Update the member to remove admin
      const updatedMember = await prisma.teamMember.update({
        where: { id: member.id },
        data: { isAdmin: false },
        include: {
          user: {
            select: {
              user_id: true,
              displayName: true,
              photo: true
            }
          }
        }
      });

      logger.info(`Member ${memberId} demoted from admin in team ${teamId} by ${requesterId}`);

      return {
        id: updatedMember.id,
        userId: updatedMember.userId,
        displayName: updatedMember.user.displayName,
        photo: updatedMember.user.photo,
        status: updatedMember.status,
        joinedAt: updatedMember.joinedAt,
        isAdmin: updatedMember.isAdmin
      };
    } catch (error) {
      logger.error(`Error demoting admin ${memberId} in team ${teamId}:`, error);
      throw error;
    }
  }

  /**
   * Remove a member from team
   */
  static async removeMemberFromTeam(teamId: string, memberId: string, requesterId: string) {
    try {
      // First, verify the requester is an admin of the team
      const requesterMembership = await prisma.teamMember.findFirst({
        where: {
          teamId,
          userId: requesterId,
          isAdmin: true
        }
      });

      if (!requesterMembership) {
        throw new ForbiddenError('Only team admins can remove members from team');
      }

      // Check if the member exists in the team (accept user_id or teamMember.id)
      const member = await this.resolveTeamMember(teamId, memberId);

      if (!member) {
        // More specific errors
        const userExists = await prisma.user.findUnique({ where: { user_id: memberId }, select: { user_id: true } });
        if (!userExists) {
          throw new NotFoundError('User not found');
        }
        throw new NotFoundError('User is not a member of this team');
      }

      // Prevent removing the team creator
      const team = await prisma.team.findUnique({
        where: { id: teamId },
        select: { creatorId: true }
      });

      if (team && member.userId === team.creatorId) {
        throw new ForbiddenError('Cannot remove the team creator');
      }

      // Prevent admins from removing themselves
      if (member.userId === requesterId) {
        throw new ForbiddenError('Admins cannot remove themselves from the team');
      }

      // Remove the member from the team
      await prisma.teamMember.delete({
        where: {
          id: member.id
        }
      });

      logger.info(`Member ${memberId} (${member.user.displayName}) removed from team ${teamId} by ${requesterId}`);

      return true;
    } catch (error) {
      logger.error(`Error removing member ${memberId} from team ${teamId}:`, error);
      throw error;
    }
  }

  /**
   * Leave team with admin transfer logic.
   * - If the leaver is creator/admin and no other admin exists, promote next member by alphabetical displayName.
   * - If other admins exist, just leave.
   */
  static async leaveTeam(teamId: string, userId: string) {
    try {
      const team = await prisma.team.findUnique({
        where: { id: teamId },
        include: {
          members: {
            where: { status: 'ACCEPTED' },
            include: { user: { select: { user_id: true, displayName: true } } },
            orderBy: { joinedAt: 'asc' }
          }
        }
      });

      if (!team) throw new NotFoundError('Team not found');

      const me = team.members.find(m => m.userId === userId);
      if (!me) {
        // Allow the creator to leave even if not listed as a member (e.g., solo team created via tournament)
        if (team.creatorId !== userId) {
          throw new ForbiddenError('You are not a member of this team');
        }

        const otherMembers = team.members;
        const otherAdmins = otherMembers.filter(m => m.isAdmin === true);
        if (otherAdmins.length === 0 && otherMembers.length > 0) {
          const nextAdmin = [...otherMembers].sort((a, b) => {
            const an = (a.user?.displayName || '').toLowerCase();
            const bn = (b.user?.displayName || '').toLowerCase();
            if (an < bn) return -1;
            if (an > bn) return 1;
            return 0;
          })[0];
          if (nextAdmin) {
            await prisma.teamMember.update({ where: { id: nextAdmin.id }, data: { isAdmin: true } });
          }
        }

        // If no members remain, delete team
        const remainingCount = await prisma.teamMember.count({ where: { teamId } });
        if (remainingCount === 0) {
          // Clean related data before deleting team
          await prisma.$transaction([
            prisma.teamMessage.deleteMany({ where: { teamId } }),
            prisma.tournamentTeam.deleteMany({ where: { teamId } }),
            prisma.teamMember.deleteMany({ where: { teamId } }),
            prisma.invitation.deleteMany({ where: { teamId } }),
          ]);
          await prisma.team.delete({ where: { id: teamId } });
          return { deleted: true };
        }

        return { deleted: false };
      }

      const otherMembers = team.members.filter(m => m.userId !== userId);

      // If leaving member is creator or admin, check other admins
      const leavingIsCreator = team.creatorId === userId;
      const leavingIsAdmin = me.isAdmin === true;

      if (leavingIsCreator || leavingIsAdmin) {
        const otherAdmins = otherMembers.filter(m => m.isAdmin === true);
        if (otherAdmins.length === 0 && otherMembers.length > 0) {
          // Promote next member by alphabetical order of displayName
          const nextAdmin = [...otherMembers].sort((a, b) => {
            const an = (a.user?.displayName || '').toLowerCase();
            const bn = (b.user?.displayName || '').toLowerCase();
            if (an < bn) return -1;
            if (an > bn) return 1;
            return 0;
          })[0];

          if (nextAdmin) {
            await prisma.teamMember.update({
              where: { id: nextAdmin.id },
              data: { isAdmin: true }
            });
          }
        }
      }

      // Remove the leaving member
      await prisma.teamMember.delete({ where: { id: me.id } });

      // If creator leaves and there are no members left, delete team
      if (leavingIsCreator) {
        const remaining = await prisma.teamMember.count({ where: { teamId } });
        if (remaining === 0) {
          await prisma.$transaction([
            prisma.teamMessage.deleteMany({ where: { teamId } }),
            prisma.tournamentTeam.deleteMany({ where: { teamId } }),
            prisma.teamMember.deleteMany({ where: { teamId } }),
            prisma.invitation.deleteMany({ where: { teamId } }),
          ]);
          await prisma.team.delete({ where: { id: teamId } });
          return { deleted: true };
        }
      }

      return { deleted: false };
    } catch (error) {
      logger.error(`Error leaving team ${teamId} by ${userId}:`, error);
      throw error;
    }
  }
}
