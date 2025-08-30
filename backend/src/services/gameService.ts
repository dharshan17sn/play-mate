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
  /**
   * Create a new game
   */
  static async createGame(data: CreateGameData) {
    try {
      const GameName = data.name.toLowerCase();
      const existingGame = await prisma.game.findFirst({
        where: { name: GameName }
      });

      if (existingGame) {
        throw new ConflictError('Game with this name already exists');
      }

      // Create game
      const game = await prisma.game.create({
        data: {
          name: data.name,
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
      const game = await prisma.game.findUnique({
        where: { name: gameName }
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
            data: { name: gameName }
          });
        }

        logger.info('Default games initialized successfully');
      
    } catch (error) {
      logger.error('Error initializing default games:', error);
    }
  }
}
