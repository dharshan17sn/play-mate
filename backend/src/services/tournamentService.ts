import { PrismaClient } from '../../generated/prisma';
import { ResponseBuilder } from '../utils/response';

const prisma = new PrismaClient();

export class TournamentService {
  /**
   * Create a new tournament
   */
  static async createTournament(data: {
    title: string;
    description?: string;
    gameId: string;
    photo?: string;
    startDate: string;
    location: string;
    noOfPlayersPerTeam?: number;
    creatorId: string;
  }) {
    try {
      // Verify the game exists
      const game = await prisma.game.findUnique({
        where: { name: data.gameId }
      });

      if (!game) {
        throw new Error('Game not found');
      }

      // Verify the creator exists
      const creator = await prisma.user.findUnique({
        where: { user_id: data.creatorId }
      });

      if (!creator) {
        throw new Error('Creator not found');
      }

      const tournament = await prisma.tournament.create({
        data: {
          title: data.title,
          description: data.description,
          gameId: data.gameId,
          photo: data.photo,
          startDate: new Date(data.startDate),
          location: data.location,
          noOfPlayersPerTeam: data.noOfPlayersPerTeam,
          creatorId: data.creatorId,
        },
        include: {
          game: true,
          creator: {
            select: {
              user_id: true,
              displayName: true,
              photo: true,
            },
          },
          teams: {
            include: {
              team: {
                select: {
                  id: true,
                  title: true,
                  photo: true,
                },
              },
            },
          },
        },
      });

      return tournament;
    } catch (error) {
      console.error('Error creating tournament:', error);
      throw error;
    }
  }

  /**
   * Get all tournaments with pagination
   */
  static async getTournaments(params: {
    page?: number;
    limit?: number;
    gameId?: string;
  } = {}) {
    try {
      const { page = 1, limit = 10, gameId } = params;
      const skip = (page - 1) * limit;

      const where: any = {};
      if (gameId) {
        where.gameId = gameId;
      }

      const [tournaments, total] = await Promise.all([
        prisma.tournament.findMany({
          where,
          skip,
          take: limit,
          include: {
            game: true,
            creator: {
              select: {
                user_id: true,
                displayName: true,
                photo: true,
              },
            },
            teams: {
              include: {
                team: {
                  select: {
                    id: true,
                    title: true,
                    photo: true,
                  },
                },
              },
            },
          },
          orderBy: {
            startDate: 'asc',
          },
        }),
        prisma.tournament.count({ where }),
      ]);

      return {
        tournaments,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error('Error fetching tournaments:', error);
      throw error;
    }
  }

  /**
   * Get tournament by ID
   */
  static async getTournamentById(tournamentId: string) {
    try {
      const tournament = await prisma.tournament.findUnique({
        where: { id: tournamentId },
        include: {
          game: true,
          creator: {
            select: {
              user_id: true,
              displayName: true,
              photo: true,
            },
          },
          teams: {
            include: {
              team: {
                select: {
                  id: true,
                  title: true,
                  photo: true,
                  members: {
                    include: {
                      user: {
                        select: {
                          user_id: true,
                          displayName: true,
                          photo: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!tournament) {
        throw new Error('Tournament not found');
      }

      return tournament;
    } catch (error) {
      console.error('Error fetching tournament by ID:', error);
      throw error;
    }
  }

  /**
   * Update tournament
   */
  static async updateTournament(
    tournamentId: string,
    creatorId: string,
    data: {
      title?: string;
      description?: string;
      photo?: string;
      startDate?: string;
      location?: string;
      noOfPlayersPerTeam?: number;
    }
  ) {
    try {
      // Verify tournament exists and user is creator
      const existingTournament = await prisma.tournament.findUnique({
        where: { id: tournamentId },
        select: { creatorId: true },
      });

      if (!existingTournament) {
        throw new Error('Tournament not found');
      }

      if (existingTournament.creatorId !== creatorId) {
        throw new Error('Unauthorized: Only the creator can update this tournament');
      }

      const updateData: any = {};
      if (data.title !== undefined) updateData.title = data.title;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.photo !== undefined) updateData.photo = data.photo;
      if (data.startDate !== undefined) updateData.startDate = new Date(data.startDate);
      if (data.location !== undefined) updateData.location = data.location;
      if (data.noOfPlayersPerTeam !== undefined) updateData.noOfPlayersPerTeam = data.noOfPlayersPerTeam;

      const tournament = await prisma.tournament.update({
        where: { id: tournamentId },
        data: updateData,
        include: {
          game: true,
          creator: {
            select: {
              user_id: true,
              displayName: true,
              photo: true,
            },
          },
          teams: {
            include: {
              team: {
                select: {
                  id: true,
                  title: true,
                  photo: true,
                },
              },
            },
          },
        },
      });

      return tournament;
    } catch (error) {
      console.error('Error updating tournament:', error);
      throw error;
    }
  }

  /**
   * Delete tournament
   */
  static async deleteTournament(tournamentId: string, creatorId: string) {
    try {
      // Verify tournament exists and user is creator
      const existingTournament = await prisma.tournament.findUnique({
        where: { id: tournamentId },
        select: { creatorId: true },
      });

      if (!existingTournament) {
        throw new Error('Tournament not found');
      }

      if (existingTournament.creatorId !== creatorId) {
        throw new Error('Unauthorized: Only the creator can delete this tournament');
      }

      await prisma.tournament.delete({
        where: { id: tournamentId },
      });

      return { message: 'Tournament deleted successfully' };
    } catch (error) {
      console.error('Error deleting tournament:', error);
      throw error;
    }
  }

  /**
   * Register team for tournament
   */
  static async registerTeamForTournament(tournamentId: string, teamId: string, userId: string) {
    try {
      // Verify tournament exists
      const tournament = await prisma.tournament.findUnique({
        where: { id: tournamentId },
        include: { game: true },
      });

      if (!tournament) {
        throw new Error('Tournament not found');
      }

      // Verify team exists and user is a member
      const team = await prisma.team.findUnique({
        where: { id: teamId },
        include: {
          members: {
            where: {
              userId: userId,
              status: 'ACCEPTED',
            },
          },
        },
      });

      if (!team) {
        throw new Error('Team not found');
      }

      if (team.members.length === 0) {
        throw new Error('You must be a member of the team to register it');
      }

      // Check if team's game matches tournament's game
      if (team.gameName !== tournament.gameId) {
        throw new Error('Team game does not match tournament game');
      }

      // Check if team is already registered
      const existingRegistration = await prisma.tournamentTeam.findUnique({
        where: {
          tournamentId_teamId: {
            tournamentId,
            teamId,
          },
        },
      });

      if (existingRegistration) {
        throw new Error('Team is already registered for this tournament');
      }

      // Register the team
      const tournamentTeam = await prisma.tournamentTeam.create({
        data: {
          tournamentId,
          teamId,
        },
        include: {
          team: {
            select: {
              id: true,
              title: true,
              photo: true,
            },
          },
        },
      });

      return tournamentTeam;
    } catch (error) {
      console.error('Error registering team for tournament:', error);
      throw error;
    }
  }

  /**
   * Unregister team from tournament
   */
  static async unregisterTeamFromTournament(tournamentId: string, teamId: string, userId: string) {
    try {
      // Verify tournament exists
      const tournament = await prisma.tournament.findUnique({
        where: { id: tournamentId },
      });

      if (!tournament) {
        throw new Error('Tournament not found');
      }

      // Verify team exists and user is a member
      const team = await prisma.team.findUnique({
        where: { id: teamId },
        include: {
          members: {
            where: {
              userId: userId,
              status: 'ACCEPTED',
            },
          },
        },
      });

      if (!team) {
        throw new Error('Team not found');
      }

      if (team.members.length === 0) {
        throw new Error('You must be a member of the team to unregister it');
      }

      // Check if team is registered
      const existingRegistration = await prisma.tournamentTeam.findUnique({
        where: {
          tournamentId_teamId: {
            tournamentId,
            teamId,
          },
        },
      });

      if (!existingRegistration) {
        throw new Error('Team is not registered for this tournament');
      }

      // Unregister the team
      await prisma.tournamentTeam.delete({
        where: {
          tournamentId_teamId: {
            tournamentId,
            teamId,
          },
        },
      });

      return { message: 'Team unregistered successfully' };
    } catch (error) {
      console.error('Error unregistering team from tournament:', error);
      throw error;
    }
  }

  /**
   * Get tournament teams
   */
  static async getTournamentTeams(tournamentId: string) {
    try {
      // Verify tournament exists
      const tournament = await prisma.tournament.findUnique({
        where: { id: tournamentId },
      });

      if (!tournament) {
        throw new Error('Tournament not found');
      }

      const tournamentTeams = await prisma.tournamentTeam.findMany({
        where: { tournamentId },
        include: {
          team: {
            select: {
              id: true,
              title: true,
              photo: true,
              description: true,
              members: {
                include: {
                  user: {
                    select: {
                      user_id: true,
                      displayName: true,
                      photo: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: {
          registeredAt: 'asc',
        },
      });

      return tournamentTeams;
    } catch (error) {
      console.error('Error fetching tournament teams:', error);
      throw error;
    }
  }
}
