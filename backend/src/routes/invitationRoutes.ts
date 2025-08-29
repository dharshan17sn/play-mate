import { Router } from 'express';
import { InvitationController } from '../controllers/invitationController';
import { authenticateToken } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import {
  invitationCreateSchema,
  invitationUpdateSchema,
  invitationIdParamSchema,
} from '../middleware/validation';

const router = Router();

/**
 * @openapi
 * tags:
 *   - name: Invitations
 *     description: Team invitations
 */

// All invitation routes require authentication
router.use(authenticateToken);

/**
 * @openapi
 * /api/v1/invitations:
 *   post:
 *     summary: Send invitation to join a team
 *     tags: [Invitations]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [toUserId, teamId]
 *             properties:
 *               toUserId: { type: string }
 *               teamId: { type: string, format: uuid }
 *     responses:
 *       201: { description: Created }
 */
// Invitation management
router.post('/', validateRequest(invitationCreateSchema), InvitationController.sendInvitation);

/**
 * @openapi
 * /api/v1/invitations/sent:
 *   get:
 *     summary: List invitations sent by current user
 *     tags: [Invitations]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: OK }
 */
router.get('/sent', InvitationController.getInvitationsSent);

/**
 * @openapi
 * /api/v1/invitations/received:
 *   get:
 *     summary: List invitations received by current user
 *     tags: [Invitations]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: OK }
 */
router.get('/received', InvitationController.getInvitationsReceived);

/**
 * @openapi
 * /api/v1/invitations/{invitationId}:
 *   get:
 *     summary: Get invitation by ID
 *     tags: [Invitations]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: invitationId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: OK }
 */
router.get('/:invitationId', validateRequest(invitationIdParamSchema), InvitationController.getInvitationById);

/**
 * @openapi
 * /api/v1/invitations/{invitationId}/accept:
 *   put:
 *     summary: Accept invitation
 *     tags: [Invitations]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: OK }
 */
// Invitation actions
router.put('/:invitationId/accept', validateRequest(invitationIdParamSchema), InvitationController.acceptInvitation);

/**
 * @openapi
 * /api/v1/invitations/{invitationId}/reject:
 *   put:
 *     summary: Reject invitation
 *     tags: [Invitations]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: OK }
 */
router.put('/:invitationId/reject', validateRequest(invitationIdParamSchema), InvitationController.rejectInvitation);

/**
 * @openapi
 * /api/v1/invitations/{invitationId}:
 *   delete:
 *     summary: Cancel invitation
 *     tags: [Invitations]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: OK }
 */
router.delete('/:invitationId', validateRequest(invitationIdParamSchema), InvitationController.cancelInvitation);

export default router;
