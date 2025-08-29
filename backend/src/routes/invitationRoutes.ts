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

// All invitation routes require authentication
router.use(authenticateToken);

// Invitation management
router.post('/', validateRequest(invitationCreateSchema), InvitationController.sendInvitation);
router.get('/sent', InvitationController.getInvitationsSent);
router.get('/received', InvitationController.getInvitationsReceived);
router.get('/:invitationId', validateRequest(invitationIdParamSchema), InvitationController.getInvitationById);

// Invitation actions
router.put('/:invitationId/accept', validateRequest(invitationIdParamSchema), InvitationController.acceptInvitation);
router.put('/:invitationId/reject', validateRequest(invitationIdParamSchema), InvitationController.rejectInvitation);
router.delete('/:invitationId', validateRequest(invitationIdParamSchema), InvitationController.cancelInvitation);

export default router;
