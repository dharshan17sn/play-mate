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
  creatorId: string;
}

export interface UpdateTeamData {
  title?: string;
  description?: string;
  photo?: string;
}

export interface TeamWithMembers {
  id: string;
  title: string;
  description?: string | null;
  photo?: string | null;
  creatorId: string;
  gameName: string;
  members: Array<{
    id: string;
    userId: string;
    displayName: string;
    status: string;
    joinedAt: Date;
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
                  displayName: true,
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
        creatorId: team.creatorId,
        gameName: team.gameName,
        members: team.members.map(member => ({
          id: member.id,
          userId: member.userId,
          displayName: member.user.displayName,
          status: member.status,
          joinedAt: member.joinedAt,
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
  static async getAllTeams(page: number = 1, limit: number = 10, search?: string) {
    try {
      const skip = (page - 1) * limit;
      
      let where: any = {};
      
      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' as any } },
          { description: { contains: search, mode: 'insensitive' as any } },
        ];
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
          orderBy: { title: 'asc' },
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
}
