import type { Request, Response } from 'express';
import { GameService } from '../services/gameService';
import { logger } from '../utils/logger';
import { ResponseBuilder } from '../utils/response';
import { asyncErrorHandler } from '../middleware/errorHandler';
import { deletePhotoFile } from '../middleware/upload';

export class GameController {
  /**
   * Get all games
   */
  static getAllGames = asyncErrorHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await GameService.getAllGames(page, limit);

    logger.info('All games retrieved successfully');
    res.status(200).json(
      ResponseBuilder.paginated(
        result.games,
        page,
        limit,
        result.pagination.total,
        'Games retrieved successfully'
      )
    );
  });

  /**
   * Get game by name
   */
  static getGameById = asyncErrorHandler(async (req: Request, res: Response) => {
    const { name } = req.params;

    if (!name) {
      return res.status(400).json(
        ResponseBuilder.validationError('Game name is required')
      );
    }

    const game = await GameService.getGameByName(name);

    logger.info(`Game retrieved successfully: ${name}`);
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
   * Upload game background banner (admin only)
   */
  static uploadGameBanner = asyncErrorHandler(async (req: Request, res: Response) => {
    const { name } = req.params;
    const file = req.file;

    if (!name) {
      if (file) deletePhotoFile(file.filename);
      return res.status(400).json(
        ResponseBuilder.validationError('Game name parameter is required')
      );
    }

    if (!file) {
      return res.status(400).json(
        ResponseBuilder.validationError('No banner image file uploaded')
      );
    }

    // Retrieve existing game to check for old banner
    const existingGame = await GameService.getGameByName(name);
    const oldBanner = existingGame.banner;

    // Save banner to database
    const game = await GameService.updateGameBanner(name, file.filename);

    // Delete old banner if existed
    if (oldBanner) {
      deletePhotoFile(oldBanner);
    }

    logger.info(`Game banner uploaded successfully for ${name}: ${file.filename}`);
    res.status(200).json(
      ResponseBuilder.success(game, 'Game banner uploaded successfully')
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

  /**
   * Delete a game by name
   */
  static deleteGame = asyncErrorHandler(async (req: Request, res: Response) => {
    const { name, force } = req.body;

    await GameService.deleteGameByName(name, { force });

    logger.info(`Game deleted successfully: ${name}`);
    res.status(200).json(
      ResponseBuilder.success({ deleted: true }, 'Game deleted successfully')
    );
  });
}
