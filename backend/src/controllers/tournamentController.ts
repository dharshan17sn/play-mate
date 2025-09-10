import type { Request, Response } from 'express';
import { TournamentService } from '../services/tournamentService';
import { ResponseBuilder } from '../utils/response';
import { asyncErrorHandler } from '../middleware/errorHandler';
import type { AuthenticatedRequest } from '../middleware/auth';

export class TournamentController {
  /**
   * Create a new tournament
   */
  static createTournament = asyncErrorHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json(
        ResponseBuilder.unauthorized('User not authenticated')
      );
    }

    const { title, description, gameId, photo, startDate, location, noOfPlayersPerTeam } = req.body;

    const tournament = await TournamentService.createTournament({
      title,
      description,
      gameId,
      photo,
      startDate,
      location,
      noOfPlayersPerTeam,
      creatorId: req.user.user_id,
    });

    res.status(201).json(
      ResponseBuilder.created(tournament, 'Tournament created successfully')
    );
  });

  /**
   * Get all tournaments with pagination
   */
  static getTournaments = asyncErrorHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const gameId = req.query.gameId as string;

    const result = await TournamentService.getTournaments({
      page,
      limit,
      gameId,
    });

    res.status(200).json(
      ResponseBuilder.success(result.tournaments, 'Tournaments retrieved successfully', {
        pagination: result.pagination,
      })
    );
  });

  /**
   * Get tournament by ID
   */
  static getTournamentById = asyncErrorHandler(async (req: Request, res: Response) => {
    const tournamentId = req.params.tournamentId as string;

    const tournament = await TournamentService.getTournamentById(tournamentId);

    res.status(200).json(
      ResponseBuilder.success(tournament, 'Tournament retrieved successfully')
    );
  });

  /**
   * Update tournament
   */
  static updateTournament = asyncErrorHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json(
        ResponseBuilder.unauthorized('User not authenticated')
      );
    }

    const tournamentId = req.params.tournamentId as string;
    const { title, description, photo, startDate, location, noOfPlayersPerTeam } = req.body;

    const tournament = await TournamentService.updateTournament(tournamentId, req.user.user_id, {
      title,
      description,
      photo,
      startDate,
      location,
      noOfPlayersPerTeam,
    });

    res.status(200).json(
      ResponseBuilder.updated(tournament, 'Tournament updated successfully')
    );
  });

  /**
   * Delete tournament
   */
  static deleteTournament = asyncErrorHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json(
        ResponseBuilder.unauthorized('User not authenticated')
      );
    }

    const tournamentId = req.params.tournamentId as string;

    const result = await TournamentService.deleteTournament(tournamentId, req.user.user_id);

    res.status(200).json(
      ResponseBuilder.success(result, 'Tournament deleted successfully')
    );
  });

  /**
   * Register team for tournament
   */
  static registerTeamForTournament = asyncErrorHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json(
        ResponseBuilder.unauthorized('User not authenticated')
      );
    }

    const tournamentId = req.params.tournamentId as string;
    const { teamId } = req.body;

    if (!teamId) {
      return res.status(400).json(
        ResponseBuilder.badRequest('Team ID is required')
      );
    }

    const tournamentTeam = await TournamentService.registerTeamForTournament(
      tournamentId,
      teamId,
      req.user.user_id
    );

    res.status(201).json(
      ResponseBuilder.created(tournamentTeam, 'Team registered for tournament successfully')
    );
  });

  /**
   * Unregister team from tournament
   */
  static unregisterTeamFromTournament = asyncErrorHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json(
        ResponseBuilder.unauthorized('User not authenticated')
      );
    }

    const tournamentId = req.params.tournamentId as string;
    const teamId = req.params.teamId as string;

    const result = await TournamentService.unregisterTeamFromTournament(
      tournamentId,
      teamId,
      req.user.user_id
    );

    res.status(200).json(
      ResponseBuilder.success(result, 'Team unregistered from tournament successfully')
    );
  });

  /**
   * Get tournament teams
   */
  static getTournamentTeams = asyncErrorHandler(async (req: Request, res: Response) => {
    const tournamentId = req.params.tournamentId as string;

    const teams = await TournamentService.getTournamentTeams(tournamentId);

    res.status(200).json(
      ResponseBuilder.success(teams, 'Tournament teams retrieved successfully')
    );
  });
}
