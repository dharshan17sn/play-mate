import { Router } from 'express';
import { TeamController } from '../controllers/teamController';
import { authenticateToken } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import {
  teamCreateSchema,
  teamUpdateSchema,
  paginationSchema,
  searchSchema,
  teamIdParamSchema,
} from '../middleware/validation';

const router = Router();

/**
 * @openapi
 * tags:
 *   - name: Teams
 *     description: Team management
 */

// All team routes require authentication
router.use(authenticateToken);

/**
 * @openapi
 * /api/v1/teams:
 *   post:
 *     summary: Create a team
 *     tags: [Teams]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, gameName]
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               photo: { type: string }
 *               gameName: { type: string }
 *     responses:
 *       201:
 *         description: Created
 */
// Team CRUD operations
router.post('/', validateRequest(teamCreateSchema), TeamController.createTeam);

/**
 * @openapi
 * /api/v1/teams/my:
 *   get:
 *     summary: Get my teams
 *     tags: [Teams]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: OK
 */
router.get('/my', TeamController.getMyTeams);

/**
 * @openapi
 * /api/v1/teams/all:
 *   get:
 *     summary: List all teams
 *     tags: [Teams]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 100 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: OK
 */
router.get('/all', validateRequest(paginationSchema), validateRequest(searchSchema), TeamController.getAllTeams);

/**
 * @openapi
 * /api/v1/teams/{teamId}:
 *   get:
 *     summary: Get team by ID
 *     tags: [Teams]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: OK }
 *       404: { description: Not found }
 *   put:
 *     summary: Update team
 *     tags: [Teams]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               photo: { type: string }
 *     responses:
 *       200: { description: Updated }
 *   delete:
 *     summary: Delete team (creator only)
 *     tags: [Teams]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Deleted }
 */
// Team operations by ID
router.get('/:teamId', validateRequest(teamIdParamSchema), TeamController.getTeamById);
router.put('/:teamId', validateRequest(teamIdParamSchema), validateRequest(teamUpdateSchema), TeamController.updateTeam);
router.delete('/:teamId', validateRequest(teamIdParamSchema), TeamController.deleteTeam);

/**
 * @openapi
 * /api/v1/teams/user/{userId}:
 *   get:
 *     summary: Get teams by user ID (public)
 *     tags: [Teams]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: OK }
 */
// Public team routes (no authentication required)
router.get('/user/:userId', TeamController.getTeamsByUserId);

export default router;
