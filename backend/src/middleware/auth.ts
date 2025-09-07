import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { prisma } from '../config/database';
import { AuthenticationError, AuthorizationError } from '../utils/errors';
import { logger } from '../utils/logger';

export interface AuthenticatedRequest extends Request {
  user?: {
    user_id: string;
    email: string;
    displayName: string;
  };
}

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    console.log('Auth - Starting authentication check');
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    console.log('Auth - Auth header:', authHeader);
    console.log('Auth - Token:', token ? 'Present' : 'Missing');

    if (!token) {
      throw new AuthenticationError('Access token required');
    }

    console.log('Auth - Token length:', token?.length || 0);
    console.log('Auth - Secret length:', (config.jwt.secret || '').length);
    const decoded = jwt.verify(token, config.jwt.secret) as any;
    console.log('Auth - Decoded token:', decoded);

    if (!decoded.userId) {
      throw new AuthenticationError('Invalid token format');
    }

    // Verify user still exists in database
    const user = await prisma.user.findUnique({
      where: { user_id: decoded.userId },
      select: { user_id: true, email: true, displayName: true },
    });

    console.log('Auth - User found:', user);

    if (!user) {
      throw new AuthenticationError('User no longer exists');
    }

    req.user = user;
    console.log('Auth - Authentication successful');
    next();
  } catch (error) {
    console.error('Auth - Authentication error:', error);
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AuthenticationError('Invalid token'));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new AuthenticationError('Token expired'));
    } else {
      next(error);
    }
  }
};

export const requireRole = (roles: string[]) => {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new AuthenticationError('Authentication required');
      }

      // For now, we'll implement basic role checking
      // You can extend this based on your role system
      const user = await prisma.user.findUnique({
        where: { user_id: req.user.user_id },
        select: { user_id: true },
      });

      if (!user) {
        throw new AuthenticationError('User not found');
      }

      // Add role checking logic here when you implement roles
      // For now, we'll allow all authenticated users
      next();
    } catch (error) {
      next(error);
    }
  };
};

export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, config.jwt.secret) as any;

      if (decoded.userId) {
        const user = await prisma.user.findUnique({
          where: { user_id: decoded.userId },
          select: { user_id: true, email: true, displayName: true },
        });

        if (user) {
          req.user = user;
        }
      }
    }

    next();
  } catch (error) {
    // For optional auth, we don't throw errors
    // Just continue without user context
    next();
  }
};
