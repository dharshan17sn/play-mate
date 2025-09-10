import { Router } from 'express';
import { TournamentController } from '../controllers/tournamentController';
import { authenticateToken } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import {
  tournamentCreateSchema,
  tournamentUpdateSchema,
  tournamentIdParamSchema,
  tournamentTeamRegistrationSchema,
  paginationSchema,
} from '../middleware/validation';

const router = Router();

/**
 * @openapi
 * tags:
 *   - name: Tournaments
 *     description: Tournament management and team registration
 */

// Public routes
/**
 * @openapi
 * /api/v1/tournaments:
 *   get:
 *     summary: Get all tournaments with pagination
 *     tags: [Tournaments]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 100 }
 *       - in: query
 *         name: gameId
 *         schema: { type: string }
 *     responses:
 *       200: { description: OK }
 */
router.get('/', validateRequest(paginationSchema), TournamentController.getTournaments);

/**
 * @openapi
 * /api/v1/tournaments/{tournamentId}:
 *   get:
 *     summary: Get tournament by ID
 *     tags: [Tournaments]
 *     parameters:
 *       - in: path
 *         name: tournamentId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: OK }
 *       404: { description: Tournament not found }
 */
router.get('/:tournamentId', validateRequest(tournamentIdParamSchema), TournamentController.getTournamentById);

/**
 * @openapi
 * /api/v1/tournaments/{tournamentId}/teams:
 *   get:
 *     summary: Get tournament teams
 *     tags: [Tournaments]
 *     parameters:
 *       - in: path
 *         name: tournamentId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: OK }
 *       404: { description: Tournament not found }
 */
router.get('/:tournamentId/teams', validateRequest(tournamentIdParamSchema), TournamentController.getTournamentTeams);

// Protected routes
/**
 * @openapi
 * /api/v1/tournaments:
 *   post:
 *     summary: Create a new tournament
 *     tags: [Tournaments]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, gameId, startDate, location, noOfPlayersPerTeam]
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 example: "Valorant Championship 2024"
 *               description:
 *                 type: string
 *                 maxLength: 500
 *                 example: "A competitive Valorant tournament for skilled players"
 *               gameId:
 *                 type: string
 *                 example: "valorant-game-id"
 *               startDate:
 *                 type: string
 *                 format: date-time
 *                 example: "2024-12-01T18:00:00Z"
 *               location:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 example: "Online"
 *               photo:
 *                 type: string
 *                 format: uri
 *                 example: "https://example.com/tournament-photo.jpg"
 *               noOfPlayersPerTeam:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 50
 *                 example: 5
 *     responses:
 *       201: { description: Tournament created successfully }
 *       400: { description: Validation error }
 *       401: { description: Unauthorized }
 */
router.post('/', authenticateToken, validateRequest(tournamentCreateSchema), TournamentController.createTournament);

/**
 * @openapi
 * /api/v1/tournaments/{tournamentId}:
 *   put:
 *     summary: Update tournament
 *     tags: [Tournaments]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: tournamentId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 example: "Updated Tournament Title"
 *               description:
 *                 type: string
 *                 maxLength: 500
 *                 example: "Updated tournament description"
 *               startDate:
 *                 type: string
 *                 format: date-time
 *                 example: "2024-12-15T18:00:00Z"
 *               location:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 example: "Updated Location"
 *               photo:
 *                 type: string
 *                 format: uri
 *                 example: "https://example.com/updated-photo.jpg"
 *               noOfPlayersPerTeam:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 50
 *                 example: 6
 *     responses:
 *       200: { description: Tournament updated successfully }
 *       400: { description: Validation error }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden - not tournament creator }
 *       404: { description: Tournament not found }
 */
router.put('/:tournamentId', authenticateToken, validateRequest(tournamentIdParamSchema), validateRequest(tournamentUpdateSchema), TournamentController.updateTournament);

/**
 * @openapi
 * /api/v1/tournaments/{tournamentId}:
 *   delete:
 *     summary: Delete tournament
 *     tags: [Tournaments]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: tournamentId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Tournament deleted successfully }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden - not tournament creator }
 *       404: { description: Tournament not found }
 */
router.delete('/:tournamentId', authenticateToken, validateRequest(tournamentIdParamSchema), TournamentController.deleteTournament);

/**
 * @openapi
 * /api/v1/tournaments/{tournamentId}/register:
 *   post:
 *     summary: Register team for tournament
 *     tags: [Tournaments]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: tournamentId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [teamId]
 *             properties:
 *               teamId:
 *                 type: string
 *                 format: uuid
 *                 example: "123e4567-e89b-12d3-a456-426614174000"
 *     responses:
 *       201: { description: Team registered for tournament successfully }
 *       400: { description: Validation error or team ID required }
 *       401: { description: Unauthorized }
 *       404: { description: Tournament or team not found }
 *       409: { description: Team already registered }
 */
router.post('/:tournamentId/register', authenticateToken, validateRequest(tournamentIdParamSchema), validateRequest(tournamentTeamRegistrationSchema), TournamentController.registerTeamForTournament);

/**
 * @openapi
 * /api/v1/tournaments/{tournamentId}/teams/{teamId}:
 *   delete:
 *     summary: Unregister team from tournament
 *     tags: [Tournaments]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: tournamentId
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Team unregistered from tournament successfully }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden - not team owner or tournament creator }
 *       404: { description: Tournament, team, or registration not found }
 */
router.delete('/:tournamentId/teams/:teamId', authenticateToken, validateRequest(tournamentIdParamSchema), TournamentController.unregisterTeamFromTournament);

export default router;