import type { Request, Response } from 'express';
import { TeamService } from '../services/teamService';
import { ResponseBuilder } from '../utils/response';
import { asyncErrorHandler } from '../middleware/errorHandler';
import type { AuthenticatedRequest } from '../middleware/auth';

export class TeamController {
  /**
   * Create a new team
   */
  static createTeam = asyncErrorHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json(
        ResponseBuilder.unauthorized('User not authenticated')
      );
    }

    const { title, description, photo, gameName, noOfPlayers, isPublic } = req.body;

    const team = await TeamService.createTeam({
      title,
      description,
      photo,
      gameName,
      noOfPlayers,
      isPublic,
      creatorId: req.user.user_id,
    });

    res.status(201).json(
      ResponseBuilder.created(team, 'Team created successfully')
    );
  });

  /**
   * Get team by ID
   */
  static getTeamById = asyncErrorHandler(async (req: Request, res: Response) => {
    const teamId = req.params.teamId as string;

    const team = await TeamService.getTeamById(teamId);

    res.status(200).json(
      ResponseBuilder.success(team, 'Team retrieved successfully')
    );
  });

  /**
   * Update team
   */
  static updateTeam = asyncErrorHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json(
        ResponseBuilder.unauthorized('User not authenticated')
      );
    }

    const teamId = req.params.teamId as string;
    const { title, description, photo, noOfPlayers, isPublic } = req.body;

    const team = await TeamService.updateTeam(teamId, req.user.user_id, {
      title,
      description,
      photo,
      noOfPlayers,
      isPublic,
    });

    res.status(200).json(
      ResponseBuilder.updated(team, 'Team updated successfully')
    );
  });

  /**
   * Delete team
   */
  static deleteTeam = asyncErrorHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json(
        ResponseBuilder.unauthorized('User not authenticated')
      );
    }

    const teamId = req.params.teamId as string;

    await TeamService.deleteTeam(teamId, req.user.user_id);

    res.status(200).json(
      ResponseBuilder.deleted('Team deleted successfully')
    );
  });

  /**
   * Get user's teams
   */
  static getMyTeams = asyncErrorHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json(
        ResponseBuilder.unauthorized('User not authenticated')
      );
    }

    const teams = await TeamService.getTeamsByUserId(req.user.user_id);

    res.status(200).json(
      ResponseBuilder.success(teams, 'Teams retrieved successfully')
    );
  });

  /**
   * Get all teams with pagination
   */
  static getAllTeams = asyncErrorHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const isPublic = req.query.isPublic !== undefined ? req.query.isPublic === 'true' : undefined;

    const result = await TeamService.getAllTeams(page, limit, search, isPublic);

    res.status(200).json(
      ResponseBuilder.success(result, 'Teams retrieved successfully')
    );
  });

  /**
   * Get public teams only (for active teams display)
   */
  static getPublicTeams = asyncErrorHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const gameName = req.query.gameName as string;

    const result = await TeamService.getPublicTeams(page, limit, gameName);

    res.status(200).json(
      ResponseBuilder.success(result, 'Public teams retrieved successfully')
    );
  });

  /**
   * Get teams by user ID (public endpoint)
   */
  static getTeamsByUserId = asyncErrorHandler(async (req: Request, res: Response) => {
    const userId = req.params.userId as string;

    const teams = await TeamService.getTeamsByUserId(userId);

    res.status(200).json(
      ResponseBuilder.success(teams, 'Teams retrieved successfully')
    );
  });

  /**
   * Request to join a team
   */
  static requestToJoinTeam = asyncErrorHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json(
        ResponseBuilder.unauthorized('User not authenticated')
      );
    }

    const { teamId } = req.params;
    if (!teamId) {
      return res.status(400).json(
        ResponseBuilder.validationError('Team ID is required')
      );
    }

    const invitation = await TeamService.requestToJoinTeam(req.user.user_id, teamId);

    res.status(201).json(
      ResponseBuilder.created(invitation, 'Join request sent successfully')
    );
  });

  /**
   * Get team members
   */
  static getTeamMembers = asyncErrorHandler(async (req: Request, res: Response) => {
    const { teamId } = req.params;
    if (!teamId) {
      return res.status(400).json(
        ResponseBuilder.validationError('Team ID is required')
      );
    }

    const members = await TeamService.getTeamMembers(teamId);

    res.status(200).json(
      ResponseBuilder.success(members, 'Team members retrieved successfully')
    );
  });

  /**
   * Make a team member an admin
   */
  static makeMemberAdmin = asyncErrorHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json(
        ResponseBuilder.unauthorized('User not authenticated')
      );
    }

    const { teamId, memberId } = req.params;
    if (!teamId || !memberId) {
      return res.status(400).json(
        ResponseBuilder.validationError('Team ID and Member ID are required')
      );
    }

    const result = await TeamService.makeMemberAdmin(teamId, memberId, req.user.user_id);

    res.status(200).json(
      ResponseBuilder.success(result, 'Member promoted to admin successfully')
    );
  });

  /**
   * Demote a team admin to regular member
   */
  static removeMemberAdmin = asyncErrorHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json(
        ResponseBuilder.unauthorized('User not authenticated')
      );
    }

    const { teamId, memberId } = req.params;
    if (!teamId || !memberId) {
      return res.status(400).json(
        ResponseBuilder.validationError('Team ID and Member ID are required')
      );
    }

    const result = await TeamService.removeMemberAdmin(teamId, memberId, req.user.user_id);

    res.status(200).json(
      ResponseBuilder.success(result, 'Admin removed from member successfully')
    );
  });

  /**
   * Remove a member from team
   */
  static removeMemberFromTeam = asyncErrorHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json(
        ResponseBuilder.unauthorized('User not authenticated')
      );
    }

    const { teamId, memberId } = req.params;
    if (!teamId || !memberId) {
      return res.status(400).json(
        ResponseBuilder.validationError('Team ID and Member ID are required')
      );
    }

    await TeamService.removeMemberFromTeam(teamId, memberId, req.user.user_id);

    res.status(200).json(
      ResponseBuilder.success(null, 'Member removed from team successfully')
    );
  });
}
