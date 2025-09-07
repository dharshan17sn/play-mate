import type { Request, Response } from 'express';
import { InvitationService } from '../services/invitationService';
import { ResponseBuilder } from '../utils/response';
import { asyncErrorHandler } from '../middleware/errorHandler';
import type { AuthenticatedRequest } from '../middleware/auth';

export class InvitationController {
  /**
   * Send request to join a team
   */
  static sendJoinRequest = asyncErrorHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json(
        ResponseBuilder.unauthorized('User not authenticated')
      );
    }

    const { teamId } = req.body;

    const invitation = await InvitationService.sendJoinRequest({
      fromUserId: req.user.user_id,
      teamId,
    });

    res.status(201).json(
      ResponseBuilder.created(invitation, 'Join request sent successfully')
    );
  });

  /**
   * Accept join request (admin only)
   */
  static acceptJoinRequest = asyncErrorHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json(
        ResponseBuilder.unauthorized('User not authenticated')
      );
    }

    const invitationId = req.params.invitationId as string;

    const result = await InvitationService.acceptJoinRequest(invitationId, req.user.user_id);

    res.status(200).json(
      ResponseBuilder.success(result, 'Join request accepted successfully')
    );
  });

  /**
   * Reject join request (admin only)
   */
  static rejectJoinRequest = asyncErrorHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json(
        ResponseBuilder.unauthorized('User not authenticated')
      );
    }

    const invitationId = req.params.invitationId as string;

    const invitation = await InvitationService.rejectJoinRequest(invitationId, req.user.user_id);

    res.status(200).json(
      ResponseBuilder.success(invitation, 'Join request rejected successfully')
    );
  });

  /**
   * Cancel join request
   */
  static cancelJoinRequest = asyncErrorHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json(
        ResponseBuilder.unauthorized('User not authenticated')
      );
    }

    const invitationId = req.params.invitationId as string;

    await InvitationService.cancelJoinRequest(invitationId, req.user.user_id);

    res.status(200).json(
      ResponseBuilder.success(undefined, 'Join request cancelled successfully')
    );
  });

  /**
   * Get join requests sent by user
   */
  static getJoinRequestsSent = asyncErrorHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json(
        ResponseBuilder.unauthorized('User not authenticated')
      );
    }

    const invitations = await InvitationService.getJoinRequestsSent(req.user.user_id);

    res.status(200).json(
      ResponseBuilder.success(invitations, 'Join requests sent retrieved successfully')
    );
  });

  /**
   * Get join requests received by team admins
   */
  static getJoinRequestsReceived = asyncErrorHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json(
        ResponseBuilder.unauthorized('User not authenticated')
      );
    }

    const invitations = await InvitationService.getJoinRequestsReceived(req.user.user_id);

    res.status(200).json(
      ResponseBuilder.success(invitations, 'Join requests received retrieved successfully')
    );
  });

  /**
   * Get join request by ID
   */
  static getJoinRequestById = asyncErrorHandler(async (req: Request, res: Response) => {
    const invitationId = req.params.invitationId as string;

    const invitation = await InvitationService.getJoinRequestById(invitationId);

    res.status(200).json(
      ResponseBuilder.success(invitation, 'Join request retrieved successfully')
    );
  });

  /**
   * Promote team member to admin (creator or existing admin only)
   */
  static addTeamAdmin = asyncErrorHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json(
        ResponseBuilder.unauthorized('User not authenticated')
      );
    }

    const { teamId } = req.params;
    const { userId } = req.body;

    if (!teamId || !userId) {
      return res.status(400).json(
        ResponseBuilder.validationError('Team ID and user ID are required')
      );
    }

    const result = await InvitationService.addTeamAdmin(teamId, userId, req.user.user_id);

    res.status(200).json(
      ResponseBuilder.success(result, 'Team member promoted to admin successfully')
    );
  });

  /**
   * Demote team admin to regular member (creator only)
   */
  static removeTeamAdmin = asyncErrorHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json(
        ResponseBuilder.unauthorized('User not authenticated')
      );
    }

    const { teamId, userId } = req.params;
    if (!teamId || !userId) {
      return res.status(400).json(
        ResponseBuilder.validationError('Team ID and user ID are required')
      );
    }

    const result = await InvitationService.removeTeamAdmin(teamId, userId, req.user.user_id);

    res.status(200).json(
      ResponseBuilder.success(result, 'Team admin demoted successfully')
    );
  });

  /**
   * Get team admins
   */
  static getTeamAdmins = asyncErrorHandler(async (req: Request, res: Response) => {
    const { teamId } = req.params;
    if (!teamId) {
      return res.status(400).json(
        ResponseBuilder.validationError('Team ID is required')
      );
    }

    const admins = await InvitationService.getTeamAdmins(teamId);

    res.status(200).json(
      ResponseBuilder.success(admins, 'Team admins retrieved successfully')
    );
  });

  /**
   * Approve team join request
   */
  static approveTeamJoinRequest = asyncErrorHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json(
        ResponseBuilder.unauthorized('User not authenticated')
      );
    }

    const { invitationId } = req.params;
    if (!invitationId) {
      return res.status(400).json(
        ResponseBuilder.validationError('Invitation ID is required')
      );
    }

    await InvitationService.approveTeamJoinRequest(invitationId, req.user.user_id);

    res.status(200).json(
      ResponseBuilder.success({}, 'Team join request approved successfully')
    );
  });

  /**
   * Reject team join request
   */
  static rejectTeamJoinRequest = asyncErrorHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json(
        ResponseBuilder.unauthorized('User not authenticated')
      );
    }

    const { invitationId } = req.params;
    if (!invitationId) {
      return res.status(400).json(
        ResponseBuilder.validationError('Invitation ID is required')
      );
    }

    await InvitationService.rejectTeamJoinRequest(invitationId, req.user.user_id);

    res.status(200).json(
      ResponseBuilder.success({}, 'Team join request rejected successfully')
    );
  });
}
