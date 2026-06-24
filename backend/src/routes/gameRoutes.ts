import { Router } from 'express';
import { GameController } from '../controllers/gameController';
import { validateRequest, gameDeleteSchema, gameCreateSchema } from '../middleware/validation';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { uploadPhoto } from '../middleware/upload';

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
router.post('/delete', authenticateToken, requireAdmin, validateRequest(gameDeleteSchema), GameController.deleteGame);

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
// Admin routes (requires authentication and admin privilege)
router.post('/', authenticateToken, requireAdmin, validateRequest(gameCreateSchema), GameController.createGame);
router.post('/:name/banner', authenticateToken, requireAdmin, uploadPhoto.single('banner'), GameController.uploadGameBanner);

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
