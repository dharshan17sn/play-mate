import type { Request, Response } from 'express';
import { GameService } from '../services/gameService';
import { logger } from '../utils/logger';
import { ResponseBuilder } from '../utils/response';
import { asyncErrorHandler } from '../middleware/errorHandler';

export class GameController {
  /**
   * Get all games
   */
  static getAllGames = asyncErrorHandler(async (req: Request, res: Response) => {
    const games = await GameService.getAllGames();

    logger.info('All games retrieved successfully');
    res.status(200).json(
      ResponseBuilder.success(games, 'Games retrieved successfully')
    );
  });

  /**
   * Get game by name
   */
  static getGameById = asyncErrorHandler(async (req: Request, res: Response) => {
    const { gameId } = req.params;
    
    if (!gameId) {
      return res.status(400).json(
        ResponseBuilder.validationError('Game name is required')
      );
    }

    const game = await GameService.getGameByName(gameId);

    logger.info(`Game retrieved successfully: ${gameId}`);
    res.status(200).json(
      ResponseBuilder.success(game, 'Game retrieved successfully')
    );
  });

  /**
   * Create a new game (admin only)
   */
  static createGame = asyncErrorHandler(async (req: Request, res: Response) => {
    const { name } = req.body;

    const game = await GameService.createGame({ name });

    logger.info(`Game created successfully: ${game.name}`);
    res.status(201).json(
      ResponseBuilder.created(game, 'Game created successfully')
    );
  });

  /**
   * Initialize default games
   */
  static initializeDefaultGames = asyncErrorHandler(async (req: Request, res: Response) => {
    await GameService.initializeDefaultGames();

    logger.info('Default games initialized successfully');
    res.status(200).json(
      ResponseBuilder.success(undefined, 'Default games initialized successfully')
    );
  });
}
