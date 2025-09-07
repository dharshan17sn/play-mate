import { prisma } from '../config/database';
import {
  NotFoundError,
  ConflictError
} from '../utils/errors';
import { logger } from '../utils/logger';

export interface CreateGameData {
  name: string;
}

export class GameService {
  private static normalizeGameName(rawName: string): string {
    const trimmed = rawName.trim().replace(/\s+/g, ' ');
    return trimmed
      .toLowerCase()
      .split(' ')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }
  /**
   * Create a new game
   */
  static async createGame(data: CreateGameData) {
    try {
      const standardizedName = this.normalizeGameName(data.name);
      const existingGame = await prisma.game.findUnique({
        where: { name: standardizedName }
      });

      if (existingGame) {
        throw new ConflictError('Game with this name already exists');
      }

      // Create game
      const game = await prisma.game.create({
        data: {
          name: standardizedName,
        }
      });

      logger.info(`Game created: ${game.name}`);
      return game;
    } catch (error) {
      logger.error('Error creating game:', error);
      throw error;
    }
  }

  /**
   * Get all games with pagination
   */
  static async getAllGames(page: number = 1, limit: number = 10) {
    try {
      const skip = (page - 1) * limit;

      const [games, total] = await Promise.all([
        prisma.game.findMany({
          orderBy: { name: 'asc' },
          skip,
          take: limit,
        }),
        prisma.game.count()
      ]);

      return {
        games,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error getting all games:', error);
      throw error;
    }
  }

  /**
   * Get game by name
   */
  static async getGameByName(gameName: string) {
    try {
      const standardizedName = this.normalizeGameName(gameName);
      const game = await prisma.game.findUnique({
        where: { name: standardizedName }
      });

      if (!game) {
        throw new NotFoundError('Game not found');
      }

      return game;
    } catch (error) {
      logger.error(`Error getting game by name ${gameName}:`, error);
      throw error;
    }
  }

  /**
   * Initialize default games if none exist
   */
  static async initializeDefaultGames() {
    try {
      const existingGames = await prisma.game.count();


      const defaultGames = [
        'Cricket',
        'Football',
        'Badminton',
        'Tennis',
        'Basketball',
        'Hockey',
        'Volleyball',
        'Kabaddi',
      ];

      for (const gameName of defaultGames) {
        await prisma.game.create({
          data: { name: this.normalizeGameName(gameName) }
        });
      }

      logger.info('Default games initialized successfully');

    } catch (error) {
      logger.error('Error initializing default games:', error);
    }
  }

  /**
   * Delete a game by name if it has no dependent references
   */
  static async deleteGameByName(gameName: string, options: { force?: boolean } = {}) {
    try {
      const game = await prisma.game.findUnique({ where: { name: gameName } });
      if (!game) {
        throw new NotFoundError('Game not found');
      }

      const [teamCount, tournamentCount, userPrefCount] = await Promise.all([
        prisma.team.count({ where: { gameName: gameName } }),
        prisma.tournament.count({ where: { gameId: gameName } }),
        prisma.userGame.count({ where: { gameName: gameName } }),
      ]);

      if (!options.force && (teamCount > 0 || tournamentCount > 0 || userPrefCount > 0)) {
        const details = { teams: teamCount, tournaments: tournamentCount, userPreferences: userPrefCount };
        logger.warn('Cannot delete game due to existing references', details);
        throw new ConflictError('Cannot delete game with existing references');
      }

      // Force cascade delete: remove references first in a transaction
      await prisma.$transaction(async (tx) => {
        if (options.force) {
          // Delete messages associated via teams and tournaments
          const teamIds = (await tx.team.findMany({ where: { gameName: gameName }, select: { id: true } })).map(t => t.id);
          const tournamentIds = (await tx.tournament.findMany({ where: { gameId: gameName }, select: { id: true } })).map(t => t.id);

          // Remove user preferences for this game
          await tx.userGame.deleteMany({ where: { gameName: gameName } });

          // Remove tournament-team relations first
          if (tournamentIds.length > 0) {
            await tx.tournamentTeam.deleteMany({ where: { tournamentId: { in: tournamentIds } } });
          }

          // Remove team memberships and invitations
          if (teamIds.length > 0) {
            await tx.teamMember.deleteMany({ where: { teamId: { in: teamIds } } });
            await tx.invitation.deleteMany({ where: { teamId: { in: teamIds } } });
          }

          // Remove messages linked to teams or tournaments
          if (teamIds.length > 0 || tournamentIds.length > 0) {
            await tx.message.deleteMany({ where: { OR: [{ teamId: { in: teamIds } }, { tournamentId: { in: tournamentIds } }] } });
          }

          // Delete tournaments and teams
          await tx.tournament.deleteMany({ where: { gameId: gameName } });
          await tx.team.deleteMany({ where: { gameName: gameName } });
        }

        // Finally delete the game
        await tx.game.delete({ where: { name: gameName } });
      });
      logger.info(`Game deleted: ${gameName}`);
      return { deleted: true };
    } catch (error) {
      logger.error('Error deleting game:', error);
      throw error;
    }
  }
}
