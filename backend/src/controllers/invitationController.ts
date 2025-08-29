import type { Request, Response } from 'express';
import { InvitationService } from '../services/invitationService';
import { ResponseBuilder } from '../utils/response';
import { asyncErrorHandler } from '../middleware/errorHandler';
import type { AuthenticatedRequest } from '../middleware/auth';

export class InvitationController {
  /**
   * Send invitation to join a team
   */
  static sendInvitation = asyncErrorHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json(
        ResponseBuilder.unauthorized('User not authenticated')
      );
    }

    const { toUserId, teamId } = req.body;

    const invitation = await InvitationService.sendInvitation({
      fromUserId: req.user.user_id,
      toUserId,
      teamId,
    });

    res.status(201).json(
      ResponseBuilder.created(invitation, 'Invitation sent successfully')
    );
  });

  /**
   * Accept invitation
   */
  static acceptInvitation = asyncErrorHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json(
        ResponseBuilder.unauthorized('User not authenticated')
      );
    }

    const invitationId = req.params.invitationId as string;

    const result = await InvitationService.acceptInvitation(invitationId, req.user.user_id);

    res.status(200).json(
      ResponseBuilder.success(result, 'Invitation accepted successfully')
    );
  });

  /**
   * Reject invitation
   */
  static rejectInvitation = asyncErrorHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json(
        ResponseBuilder.unauthorized('User not authenticated')
      );
    }

    const invitationId = req.params.invitationId as string;

    const invitation = await InvitationService.rejectInvitation(invitationId, req.user.user_id);

    res.status(200).json(
      ResponseBuilder.success(invitation, 'Invitation rejected successfully')
    );
  });

  /**
   * Cancel invitation
   */
  static cancelInvitation = asyncErrorHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json(
        ResponseBuilder.unauthorized('User not authenticated')
      );
    }

    const invitationId = req.params.invitationId as string;

    await InvitationService.cancelInvitation(invitationId, req.user.user_id);

    res.status(200).json(
      ResponseBuilder.success(undefined, 'Invitation cancelled successfully')
    );
  });

  /**
   * Get invitations sent by user
   */
  static getInvitationsSent = asyncErrorHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json(
        ResponseBuilder.unauthorized('User not authenticated')
      );
    }

    const invitations = await InvitationService.getInvitationsSent(req.user.user_id);

    res.status(200).json(
      ResponseBuilder.success(invitations, 'Invitations sent retrieved successfully')
    );
  });

  /**
   * Get invitations received by user
   */
  static getInvitationsReceived = asyncErrorHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json(
        ResponseBuilder.unauthorized('User not authenticated')
      );
    }

    const invitations = await InvitationService.getInvitationsReceived(req.user.user_id);

    res.status(200).json(
      ResponseBuilder.success(invitations, 'Invitations received retrieved successfully')
    );
  });

  /**
   * Get invitation by ID
   */
  static getInvitationById = asyncErrorHandler(async (req: Request, res: Response) => {
    const invitationId = req.params.invitationId as string;

    const invitation = await InvitationService.getInvitationById(invitationId);

    res.status(200).json(
      ResponseBuilder.success(invitation, 'Invitation retrieved successfully')
    );
  });
}
