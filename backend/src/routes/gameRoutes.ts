import { Router } from 'express';
import { GameController } from '../controllers/gameController';
import { validateRequest, gameDeleteSchema } from '../middleware/validation';
import {
  gameCreateSchema,
} from '../middleware/validation';

const router = Router();

/**
 * @openapi
 * tags:
 *   - name: Games
 *     description: Game catalog
 */

/**
 * @openapi
 * /api/v1/games:
 *   get:
 *     summary: List all games
 *     tags: [Games]
 *     responses:
 *       200:
 *         description: OK
 */
// Public game routes (no authentication required)
router.get('/', GameController.getAllGames);

/**
 * @openapi
 * /api/v1/games/{name}:
 *   get:
 *     summary: Get game by name
 *     tags: [Games]
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: OK
 *       404:
 *         description: Not found
 */
router.get('/:name', GameController.getGameById);
/**
 * @openapi
 * /api/v1/games/delete:
 *   post:
 *     summary: Delete a game by name (requires no dependencies)
 *     tags: [Games]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *                 description: Game name to delete
 *               force:
 *                 type: boolean
 *                 description: Cascade delete related data
 *     responses:
 *       200:
 *         description: Deleted
 *       400:
 *         description: Bad request
 *       404:
 *         description: Not found
 *       409:
 *         description: Conflict (existing references)
 */
router.post('/delete', validateRequest(gameDeleteSchema), GameController.deleteGame);

/**
 * @openapi
 * /api/v1/games:
 *   post:
 *     summary: Create a new game
 *     tags: [Games]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string }
 *     responses:
 *       201:
 *         description: Created
 *       409:
 *         description: Conflict
 */
// Admin routes (no authentication for now, but could be added later)
router.post('/', validateRequest(gameCreateSchema), GameController.createGame);

/**
 * @openapi
 * /api/v1/games/init:
 *   post:
 *     summary: Initialize default games
 *     tags: [Games]
 *     responses:
 *       200:
 *         description: OK
 */
router.post('/init', GameController.initializeDefaultGames);

export default router;
