import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import { config } from '../config';
import { 
  NotFoundError, 
  ConflictError, 
  AuthenticationError,
  ValidationError 
} from '../utils/errors';
import { logger } from '../utils/logger';

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  gender?: string;
  location?: string;
}

export interface UpdateUserData {
  name?: string;
  photo?: string;
  gender?: string;
  location?: string;
}

export interface UserWithTeams {
  id: string;
  name: string;
  email: string;
  photo?: string;
  gender?: string;
  location?: string;
  teams: Array<{
    id: string;
    title: string;
    status: string;
    joinedAt: Date;
  }>;
}

export class UserService {
  /**
   * Create a new user
   */
  static async createUser(data: CreateUserData) {
    try {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email },
      });

      if (existingUser) {
        throw new ConflictError('User with this email already exists');
      }

      // Hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(data.password, saltRounds);

      // Create user
      const user = await prisma.user.create({
        data: {
          ...data,
          passwordHash: hashedPassword,
        },
        select: {
          id: true,
          name: true,
          email: true,
          photo: true,
          gender: true,
          location: true,
        },
      });

      logger.info(`User created: ${user.email}`);
      return user;
    } catch (error) {
      logger.error('Error creating user:', error);
      throw error;
    }
  }

  /**
   * Authenticate user and generate JWT token
   */
  static async authenticateUser(email: string, password: string) {
    try {
      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          passwordHash: true,
          name: true,
        },
      });

      if (!user) {
        throw new AuthenticationError('Invalid credentials');
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        throw new AuthenticationError('Invalid credentials');
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      );

      logger.info(`User authenticated: ${user.email}`);
      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        token,
      };
    } catch (error) {
      logger.error('Error authenticating user:', error);
      throw error;
    }
  }

  /**
   * Get user by ID
   */
  static async getUserById(id: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          email: true,
          photo: true,
          gender: true,
          location: true,
        },
      });

      if (!user) {
        throw new NotFoundError('User not found');
      }

      return user;
    } catch (error) {
      logger.error(`Error getting user by ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Update user
   */
  static async updateUser(id: string, data: UpdateUserData) {
    try {
      const user = await prisma.user.update({
        where: { id },
        data,
        select: {
          id: true,
          name: true,
          email: true,
          photo: true,
          gender: true,
          location: true,
        },
      });

      logger.info(`User updated: ${user.email}`);
      return user;
    } catch (error) {
      logger.error(`Error updating user ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get user with teams
   */
  static async getUserWithTeams(id: string): Promise<UserWithTeams> {
    try {
      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          email: true,
          photo: true,
          gender: true,
          location: true,
          teams: {
            select: {
              id: true,
              team: {
                select: {
                  id: true,
                  title: true,
                },
              },
              status: true,
              joinedAt: true,
            },
          },
        },
      });

      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Transform the data to match the interface
      const transformedUser: UserWithTeams = {
        ...user,
        teams: user.teams.map(tm => ({
          id: tm.team.id,
          title: tm.team.title,
          status: tm.status,
          joinedAt: tm.joinedAt,
        })),
      };

      return transformedUser;
    } catch (error) {
      logger.error(`Error getting user with teams ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get users with pagination and search
   */
  static async getUsers(page: number = 1, limit: number = 10, search?: string) {
    try {
      const skip = (page - 1) * limit;
      
      const where = search ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' as any } },
          { email: { contains: search, mode: 'insensitive' as any } },
        ],
      } : {};

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          select: {
            id: true,
            name: true,
            email: true,
            photo: true,
            gender: true,
            location: true,
          },
          skip,
          take: limit,
          orderBy: { name: 'asc' },
        }),
        prisma.user.count({ where }),
      ]);

      return {
        users,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      logger.error('Error getting users:', error);
      throw error;
    }
  }

  /**
   * Delete user
   */
  static async deleteUser(id: string) {
    try {
      await prisma.user.delete({
        where: { id },
      });

      logger.info(`User deleted: ${id}`);
      return { success: true };
    } catch (error) {
      logger.error(`Error deleting user ${id}:`, error);
      throw error;
    }
  }

  /**
   * Change user password
   */
  static async changePassword(id: string, currentPassword: string, newPassword: string) {
    try {
      // Get user with current password
      const user = await prisma.user.findUnique({
        where: { id },
        select: { passwordHash: true },
      });

      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isCurrentPasswordValid) {
        throw new ValidationError('Current password is incorrect');
      }

      // Hash new password
      const saltRounds = 12;
      const newHashedPassword = await bcrypt.hash(newPassword, saltRounds);

      // Update password
      await prisma.user.update({
        where: { id },
        data: { passwordHash: newHashedPassword },
      });

      logger.info(`Password changed for user: ${id}`);
      return { success: true };
    } catch (error) {
      logger.error(`Error changing password for user ${id}:`, error);
      throw error;
    }
  }
}
