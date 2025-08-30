import { Router } from 'express';
import { InvitationController } from '../controllers/invitationController';
import { authenticateToken } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import {
  invitationCreateSchema,
  invitationUpdateSchema,
  invitationIdParamSchema,
  teamAdminAddSchema,
  teamAdminRemoveSchema,
} from '../middleware/validation';

const router = Router();

/**
 * @openapi
 * tags:
 *   - name: Join Requests
 *     description: Team join requests and admin management
 */

// All invitation routes require authentication
router.use(authenticateToken);

/**
 * @openapi
 * /api/v1/invitations:
 *   post:
 *     summary: Send request to join a team
 *     tags: [Join Requests]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [teamId]
 *             properties:
 *               teamId: { type: string, format: uuid }
 *     responses:
 *       201: { description: Join request sent successfully }
 *       400: { description: Bad request - already a member or request pending }
 *       404: { description: Team not found }
 */
// Join request management
router.post('/', validateRequest(invitationCreateSchema), InvitationController.sendJoinRequest);

/**
 * @openapi
 * /api/v1/invitations/sent:
 *   get:
 *     summary: List join requests sent by current user
 *     tags: [Join Requests]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: OK }
 */
router.get('/sent', InvitationController.getJoinRequestsSent);

/**
 * @openapi
 * /api/v1/invitations/received:
 *   get:
 *     summary: List join requests received by team admins
 *     tags: [Join Requests]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: OK }
 */
router.get('/received', InvitationController.getJoinRequestsReceived);

/**
 * @openapi
 * /api/v1/invitations/{invitationId}:
 *   get:
 *     summary: Get join request by ID
 *     tags: [Join Requests]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: invitationId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: OK }
 */
router.get('/:invitationId', validateRequest(invitationIdParamSchema), InvitationController.getJoinRequestById);

/**
 * @openapi
 * /api/v1/invitations/{invitationId}/accept:
 *   put:
 *     summary: Accept join request (admin only)
 *     tags: [Join Requests]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Join request accepted }
 *       403: { description: Forbidden - not a team admin }
 */
// Join request actions (admin only)
router.put('/:invitationId/accept', validateRequest(invitationIdParamSchema), InvitationController.acceptJoinRequest);

/**
 * @openapi
 * /api/v1/invitations/{invitationId}/reject:
 *   put:
 *     summary: Reject join request (admin only)
 *     tags: [Join Requests]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Join request rejected }
 *       403: { description: Forbidden - not a team admin }
 */
router.put('/:invitationId/reject', validateRequest(invitationIdParamSchema), InvitationController.rejectJoinRequest);

/**
 * @openapi
 * /api/v1/invitations/{invitationId}:
 *   delete:
 *     summary: Cancel join request
 *     tags: [Join Requests]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Join request cancelled }
 */
router.delete('/:invitationId', validateRequest(invitationIdParamSchema), InvitationController.cancelJoinRequest);

/**
 * @openapi
 * /api/v1/invitations/teams/{teamId}/admins:
 *   get:
 *     summary: Get team admins
 *     tags: [Join Requests]
 *     parameters:
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: OK }
 */
router.get('/teams/:teamId/admins', InvitationController.getTeamAdmins);

/**
 * @openapi
 * /api/v1/invitations/teams/{teamId}/admins:
 *   post:
 *     summary: Promote team member to admin (creator or existing admin only)
 *     tags: [Join Requests]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId]
 *             properties:
 *               userId: { type: string }
 *     responses:
 *       200: { description: Team member promoted to admin successfully }
 *       403: { description: Forbidden - not authorized }
 *       404: { description: User not found or not a team member }
 */
router.post('/teams/:teamId/admins', validateRequest(teamAdminAddSchema), InvitationController.addTeamAdmin);

/**
 * @openapi
 * /api/v1/invitations/teams/{teamId}/admins/{userId}:
 *   delete:
 *     summary: Demote team admin to regular member (creator only)
 *     tags: [Join Requests]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Team admin demoted successfully }
 *       403: { description: Forbidden - not authorized }
 */
router.delete('/teams/:teamId/admins/:userId', validateRequest(teamAdminRemoveSchema), InvitationController.removeTeamAdmin);

export default router;
