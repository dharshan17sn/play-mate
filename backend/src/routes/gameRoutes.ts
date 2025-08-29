import { Router } from 'express';
import { GameController } from '../controllers/gameController';
import { validateRequest } from '../middleware/validation';
import {
  gameCreateSchema,
} from '../middleware/validation';

const router = Router();

// Public game routes (no authentication required)
router.get('/', GameController.getAllGames);
router.get('/:gameId', GameController.getGameById);

// Admin routes (no authentication for now, but could be added later)
router.post('/', validateRequest(gameCreateSchema), GameController.createGame);
router.post('/init', GameController.initializeDefaultGames);

export default router;
