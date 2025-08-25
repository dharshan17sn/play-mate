import type { Request, Response } from 'express';
import { UserService } from '../services/userService';
import { ResponseBuilder } from '../utils/response';
import { asyncErrorHandler } from '../middleware/errorHandler';
import type { AuthenticatedRequest } from '../middleware/auth';

export class UserController {
  /**
   * Register a new user
   */
  static register = asyncErrorHandler(async (req: Request, res: Response) => {
    const userData = req.body;
  
    // creating the new user
    await UserService.createUser(userData);
    // rest include auth token also 
    const rest = await UserService.authenticateUser(userData.email,userData.password)
    
    res.status(201).json(
      ResponseBuilder.created(rest, 'User registered successfully')
    );
  });

  /**
   * Login user
   */
  static login = asyncErrorHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;
    
    const result = await UserService.authenticateUser(email, password);
    
    res.status(200).json(
      ResponseBuilder.success(result, 'Login successful')
    );
  });

  /**
   * Get current user profile
   */
  static getProfile = asyncErrorHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json(
        ResponseBuilder.unauthorized('User not authenticated')
      );
    }

    const user = await UserService.getUserById(req.user.user_id);
    
    res.status(200).json(
      ResponseBuilder.success(user, 'Profile retrieved successfully')
    );
  });

  /**
   * Get user profile by user_id
   */
  static getUserById = asyncErrorHandler(async (req: Request, res: Response) => {
    const user_id = req.params.user_id as string;
    
    const user = await UserService.getUserById(user_id);
    
    res.status(200).json(
      ResponseBuilder.success(user, 'User profile retrieved successfully')
    );
  });

  /**
   * Update user profile
   */
  static updateProfile = asyncErrorHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json(
        ResponseBuilder.unauthorized('User not authenticated')
      );
    }

    const updateData = req.body;
    const user = await UserService.updateUser(req.user.user_id, updateData);
    
    res.status(200).json(
      ResponseBuilder.updated(user, 'Profile updated successfully')
    );
  });

  /**
   * Get user with teams
   */
  static getUserWithTeams = asyncErrorHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    
    const user = await UserService.getUserWithTeams(id);
    
    res.status(200).json(
      ResponseBuilder.success(user, 'User with teams retrieved successfully')
    );
  });

  /**
   * Get users with pagination and search
   */
  static getUsers = asyncErrorHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    
    const result = await UserService.getUsers(page, limit, search);
    
    res.status(200).json(
      ResponseBuilder.paginated(
        result.users,
        page,
        limit,
        result.pagination.total,
        'Users retrieved successfully'
      )
    );
  });

  /**
   * Search users by user_id, displayName, or general search
   */
  static searchUsers = asyncErrorHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const user_id = req.query.user_id as string;
    const displayName = req.query.displayName as string;
    
    const result = await UserService.getUsers(page, limit, search, user_id, displayName);
    
    res.status(200).json(
      ResponseBuilder.success(result, 'Users search completed successfully')
    );
  });

  /**
   * Delete user
   */
  static deleteUser = asyncErrorHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json(
        ResponseBuilder.unauthorized('User not authenticated')
      );
    }

    // Only allow users to delete their own account
    const { user_id } = req.params;
    if (req.user.user_id !== user_id) {
      return res.status(403).json(
        ResponseBuilder.forbidden('You can only delete your own account')
      );
    }

    await UserService.deleteUser(user_id);
    
    res.status(200).json(
      ResponseBuilder.deleted('Account deleted successfully')
    );
  });

  /**
   * Change password
   */
  static changePassword = asyncErrorHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json(
        ResponseBuilder.unauthorized('User not authenticated')
      );
    }

    const { currentPassword, newPassword } = req.body;
    
    await UserService.changePassword(req.user.user_id, currentPassword, newPassword);
    
    res.status(200).json(
      ResponseBuilder.success({}, 'Password changed successfully')
    );
  });

  /**
   * Get current user's teams
   */
  static getMyTeams = asyncErrorHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json(
        ResponseBuilder.unauthorized('User not authenticated')
      );
    }

    const user = await UserService.getUserWithTeams(req.user.user_id);
    
    res.status(200).json(
      ResponseBuilder.success(user.teams, 'Your teams retrieved successfully')
    );
  });
}
