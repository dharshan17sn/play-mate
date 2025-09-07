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
        isPublic: true
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

      // Check if the member exists in the team
      const member = await prisma.teamMember.findFirst({
        where: {
          teamId,
          userId: memberId
        }
      });

      if (!member) {
        throw new NotFoundError('Member not found in team');
      }

      if (member.isAdmin) {
        throw new ConflictError('Member is already an admin');
      }

      // Update the member to be an admin
      const updatedMember = await prisma.teamMember.update({
        where: {
          id: member.id
        },
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

      // Check if the member exists in the team
      const member = await prisma.teamMember.findFirst({
        where: {
          teamId,
          userId: memberId
        },
        include: {
          user: {
            select: {
              displayName: true
            }
          }
        }
      });

      if (!member) {
        throw new NotFoundError('Member not found in team');
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
}
