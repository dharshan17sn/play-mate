import type { Request, Response } from 'express';
import { UserService } from '../services/userService';
import { ResponseBuilder } from '../utils/response';
import { asyncErrorHandler } from '../middleware/errorHandler';
import type { AuthenticatedRequest } from '../middleware/auth';
import { OtpService } from '../services/otpService';
import { prisma } from '../config/database';

export class UserController {
  /**
   * Request registration OTP to email
   */
  static requestRegistrationOtp = asyncErrorHandler(async (req: Request, res: Response) => {
    const { email } = req.body as { email: string };

    // Check if email already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json(
        ResponseBuilder.error('Email already registered')
      );
    }

    await OtpService.sendRegistrationOtp(email);

    res.status(200).json(
      ResponseBuilder.success({}, 'OTP sent to email')
    );
  });

  /**
   * Verify OTP and register the user
   */
  static verifyRegistrationOtp = asyncErrorHandler(async (req: Request, res: Response) => {
    console.log('verifyRegistrationOtp - Request body:', req.body);
    const { email, code, user_id, displayName, password, gender, location } = req.body as any;

    console.log('verifyRegistrationOtp - Extracted fields:', {
      email, code, user_id, displayName,
      password: password ? '***' : 'missing',
      gender, location
    });

    const valid = OtpService.verifyOtp(email, code);
    console.log('verifyRegistrationOtp - OTP validation result:', valid);

    if (!valid) {
      return res.status(400).json(
        ResponseBuilder.validationError('Invalid or expired OTP')
      );
    }

    await UserService.createUser({ user_id, displayName, email, password, gender, location });

    // Invalidate OTP after successful use
    OtpService.invalidateOtp(email);

    const rest = await UserService.authenticateUser(email, password);

    res.status(201).json(
      ResponseBuilder.created(rest, 'User registered successfully')
    );
  });

  /**
   * Login user (by email or user_id)
   */
  static login = asyncErrorHandler(async (req: Request, res: Response) => {
    const { identifier, password } = req.body as { identifier: string; password: string };

    const result = await UserService.authenticateUser(identifier, password);

    res.status(200).json(
      ResponseBuilder.success(result, 'Login successful')
    );
  });

  /**
   * Forgot password: request OTP to email
   */
  static requestForgotPasswordOtp = asyncErrorHandler(async (req: Request, res: Response) => {
    const { email } = req.body as { email: string };

    const existing = await prisma.user.findUnique({ where: { email } });
    if (!existing) {
      return res.status(404).json(
        ResponseBuilder.notFound('Email not found')
      );
    }

    await OtpService.sendRegistrationOtp(email);

    res.status(200).json(
      ResponseBuilder.success({}, 'OTP sent to email')
    );
  });

  /**
   * Forgot password: verify OTP and reset password
   */
  static resetForgotPassword = asyncErrorHandler(async (req: Request, res: Response) => {
    const { email, code, newPassword } = req.body as { email: string; code: string; newPassword: string };

    const valid = OtpService.verifyOtp(email, code);
    if (!valid) {
      return res.status(400).json(
        ResponseBuilder.validationError('Invalid or expired OTP')
      );
    }

    await UserService.resetPasswordByEmail(email, newPassword);

    // Invalidate OTP after successful use
    OtpService.invalidateOtp(email);

    res.status(200).json(
      ResponseBuilder.success({}, 'Password reset successfully')
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
   * Update current user profile
   */
  static updateProfile = asyncErrorHandler(async (req: AuthenticatedRequest, res: Response) => {
    console.log('=== USER CONTROLLER UPDATE PROFILE START ===');
    console.log('updateProfile - Request body:', req.body);
    console.log('updateProfile - Request body type:', typeof req.body);
    console.log('updateProfile - Request body keys:', Object.keys(req.body));
    console.log('updateProfile - User ID from token:', req.user?.user_id);

    if (!req.user) {
      console.error('updateProfile - No user found in request');
      return res.status(401).json(
        ResponseBuilder.unauthorized('User not authenticated')
      );
    }

    try {
      const updatedUser = await UserService.updateUser(req.user.user_id, req.body);
      console.log('updateProfile - User updated successfully:', updatedUser);

      res.status(200).json(
        ResponseBuilder.updated(updatedUser, 'Profile updated successfully')
      );
      console.log('=== USER CONTROLLER UPDATE PROFILE END ===');
    } catch (error) {
      console.error('updateProfile - Error updating user:', error);
      console.log('=== USER CONTROLLER UPDATE PROFILE END ===');
      throw error;
    }
  });

  /**
   * Get user with teams
   */
  static getUserWithTeams = asyncErrorHandler(async (req: Request, res: Response) => {
    const user_id = req.params.user_id as string;

    const user = await UserService.getUserWithTeams(user_id);

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