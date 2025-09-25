import { Router } from 'express';
import { TeamController } from '../controllers/teamController';
import { TeamMessageController } from '../controllers/teamMessageController';
import { authenticateToken } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import {
  teamCreateSchema,
  teamUpdateSchema,
  paginationSchema,
  searchSchema,
  teamIdParamSchema,
  teamMemberParamSchema,
} from '../middleware/validation';

const router = Router();

/**
 * @openapi
 * tags:
 *   - name: Teams
 *     description: Team management
 */

/**
 * @openapi
 * /api/v1/teams/public:
 *   get:
 *     summary: Get public teams
 *     tags: [Teams]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 100 }
 *       - in: query
 *         name: gameName
 *         schema: { type: string }
 *     responses:
 *       200: { description: OK }
 */
// Public team routes (no authentication required)
router.get('/public', TeamController.getPublicTeams);
router.get('/user/:userId', TeamController.getTeamsByUserId);

// All other team routes require authentication
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

// Join team and team members endpoints
router.post('/:teamId/join', validateRequest(teamIdParamSchema), TeamController.requestToJoinTeam);
// Direct join (invite link) - requires auth but no admin approval
router.post('/:teamId/join-direct', validateRequest(teamIdParamSchema), TeamController.joinTeamDirect);
router.get('/:teamId/members', validateRequest(teamIdParamSchema), TeamController.getTeamMembers);

// Member management endpoints
router.put('/:teamId/members/:memberId/admin', authenticateToken, validateRequest(teamMemberParamSchema), TeamController.makeMemberAdmin);
router.delete('/:teamId/members/:memberId/admin', authenticateToken, validateRequest(teamMemberParamSchema), TeamController.removeMemberAdmin);
router.delete('/:teamId/members/:memberId', authenticateToken, validateRequest(teamMemberParamSchema), TeamController.removeMemberFromTeam);

// Leave team (self)
router.delete('/:teamId/leave', authenticateToken, validateRequest(teamIdParamSchema), TeamController.leaveTeam);

// Team messaging endpoints
router.post('/:teamId/messages', validateRequest(teamIdParamSchema), TeamMessageController.sendTeamMessage);
router.get('/:teamId/messages', validateRequest(teamIdParamSchema), TeamMessageController.getTeamMessages);
router.put('/:teamId/messages/read', validateRequest(teamIdParamSchema), TeamMessageController.markTeamMessagesAsRead);

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

export default router;
