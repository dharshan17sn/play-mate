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
  user_id: string;
  displayName: string;
  email: string;
  password: string;
  gender?: string;
  location?: string;
}

export interface UpdateUserData {
  displayName?: string;
  photo?: string;
  gender?: string;
  location?: string;
  preferredDays?: string[];
  timeRange?: string[];
  preferredGames?: string[];
}

export interface UserWithTeams {
  user_id: string;
  displayName: string;
  email: string;
  photo?: string | null;
  gender?: string | null;
  location?: string | null;
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
      // Check if user already exists by email or user_id
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { email: data.email },
            { user_id: data.user_id },
            { displayName: data.displayName }
          ]
        },
      });

      if (existingUser) {
        if (existingUser.email === data.email) {
          throw new ConflictError('User with this email already exists');
        }
        if (existingUser.user_id === data.user_id) {
          throw new ConflictError('User ID already taken');
        }
      }

      // Hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(data.password, saltRounds);

      // Create user
      const user = await prisma.user.create({
        data: {
          user_id: data.user_id,
          displayName: data.displayName,
          email: data.email,
          gender: data.gender,
          location: data.location,
          passwordHash: hashedPassword,
        },
        select: {
          user_id: true,
          displayName: true,
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
   * Authenticate user (by email or user_id) and generate JWT token
   */
  static async authenticateUser(identifier: string, password: string) {
    try {
      // Find user by email or user_id
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: identifier },
            { user_id: identifier },
          ],
        },
        select: {
          user_id: true,
          email: true,
          passwordHash: true,
          displayName: true,
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
        { userId: user.user_id },
        config.jwt.secret as string,
      );

      logger.info(`User authenticated: ${user.email}`);
      return {
        user: {
          user_id: user.user_id,
          email: user.email,
          displayName: user.displayName,
        },
        token,
      };
    } catch (error) {
      logger.error('Error authenticating user:', error);
      throw error;
    }
  }

  /**
   * Get user by user_id
   */
  static async getUserById(user_id: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { user_id },
        select: {
          user_id: true,
          displayName: true,
          email: true,
          photo: true,
          gender: true,
          location: true,
          preferredDays: true,
          timeRange: true,
          preferredGames: {
            select: {
              gameName: true,
              game: {
                select: {
                  name: true,
                },
              },
            },
          },
        } as any,
      });

      if (!user) {
        throw new NotFoundError('User not found');
      }

      return user;
    } catch (error) {
      logger.error(`Error getting user by user_id ${user_id}:`, error);
      throw error;
    }
  }

  /**
   * Update user
   */
  static async updateUser(user_id: string, data: UpdateUserData) {
    try {
      console.log('UserService.updateUser - Received data:', data);
      const { preferredGames, ...userData } = data;

      // Create a clean update object with only valid fields
      const updateData: any = {};

      if (userData.displayName !== undefined) updateData.displayName = userData.displayName;
      if (userData.photo !== undefined) updateData.photo = userData.photo;
      if (userData.gender !== undefined) updateData.gender = userData.gender;
      if (userData.location !== undefined) updateData.location = userData.location;
      if (userData.preferredDays !== undefined) {
        console.log('UserService.updateUser - preferredDays:', userData.preferredDays);
        updateData.preferredDays = userData.preferredDays;
      }
      if (userData.timeRange !== undefined) {
        console.log('UserService.updateUser - timeRange:', userData.timeRange);
        updateData.timeRange = userData.timeRange;
      }

      console.log('UserService.updateUser - Final updateData:', updateData);

      // Update user data
      const user = await prisma.user.update({
        where: { user_id },
        data: updateData,
        select: {
          user_id: true,
          displayName: true,
          email: true,
          photo: true,
          gender: true,
          location: true,
        },
      });

      // Handle preferred games if provided
      if (preferredGames !== undefined) {
        // Check if all games exist first, create them if they don't
        if (preferredGames.length > 0) {
          for (const gameName of preferredGames) {
            // Check if game exists
            const existingGame = await prisma.game.findUnique({
              where: { name: gameName }
            });

            // Create game if it doesn't exist
            if (!existingGame) {
              await prisma.game.create({
                data: { name: gameName }
              });
              logger.info(`Created new game: ${gameName}`);
            }
          }
        }

        // Add new preferred games (skip duplicates automatically)
        if (preferredGames.length > 0) {
          await prisma.userGame.createMany({
            data: preferredGames.map(gameName => ({
              userId: user_id,
              gameName,
            })),
            skipDuplicates: true,
          });
        }
      }

      // Get updated user with preferred games
      const updatedUser = await prisma.user.findUnique({
        where: { user_id },
        select: {
          user_id: true,
          displayName: true,
          email: true,
          photo: true,
          gender: true,
          location: true,
          preferredGames: {
            select: {
              gameName: true,
              game: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      });

      logger.info(`User updated: ${user_id}`);
      return updatedUser;
    } catch (error) {
      logger.error(`Error updating user ${user_id}:`, error);
      throw error;
    }
  }

  /**
   * Get user with teams
   */
  static async getUserWithTeams(user_id: string): Promise<UserWithTeams> {
    try {
      const user = await prisma.user.findUnique({
        where: { user_id },
        select: {
          user_id: true,
          displayName: true,
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
        user_id: user.user_id,
        displayName: user.displayName,
        email: user.email,
        photo: user.photo,
        gender: user.gender,
        location: user.location,
        teams: user.teams.map((tm: any) => ({
          id: tm.team.id,
          title: tm.team.title,
          status: tm.status,
          joinedAt: tm.joinedAt,
        })),
      };

      return transformedUser;
    } catch (error) {
      logger.error(`Error getting user with teams ${user_id}:`, error);
      throw error;
    }
  }

  /**
   * Get users with pagination and search
   */
  static async getUsers(page: number = 1, limit: number = 10, search?: string, user_id?: string, displayName?: string) {
    try {
      const skip = (page - 1) * limit;

      let where: any = {};

      if (search) {
        where.OR = [
          { email: { contains: search, mode: 'insensitive' as any } },
          { displayName: { contains: search, mode: 'insensitive' as any } },
        ];
      }

      if (user_id) {
        where.user_id = { contains: user_id, mode: 'insensitive' as any };
      }

      if (displayName) {
        where.displayName = { contains: displayName, mode: 'insensitive' as any };
      }

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          select: {
            user_id: true,
            displayName: true,
            email: true,
            photo: true,
            gender: true,
            location: true,
            preferredGames: {
              select: {
                gameName: true,
                game: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
          skip,
          take: limit,
          orderBy: { displayName: 'asc' },
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
  static async deleteUser(user_id: string) {
    try {
      await prisma.$transaction(async (tx) => {
        // Delete chat-related data
        await tx.chatMessage.deleteMany({ where: { senderId: user_id } });
        await tx.chat.deleteMany({ where: { OR: [{ userAId: user_id }, { userBId: user_id }] } });

        // Delete team messages and generic messages sent by the user
        await tx.teamMessage.deleteMany({ where: { senderId: user_id } });
        await tx.message.deleteMany({ where: { senderId: user_id } });

        // Remove team memberships and invitations for the user
        await tx.teamMember.deleteMany({ where: { userId: user_id } });
        await tx.invitation.deleteMany({ where: { OR: [{ fromUserId: user_id }, { toUserId: user_id }] } });

        // Remove friendships and friend requests
        await tx.friendRequest.deleteMany({ where: { OR: [{ fromUserId: user_id }, { toUserId: user_id }] } });
        await tx.friend.deleteMany({ where: { OR: [{ userAId: user_id }, { userBId: user_id }] } });

        // Remove preferred games
        await tx.userGame.deleteMany({ where: { userId: user_id } });

        // Delete tournaments created by the user and their dependents
        const tournaments = await tx.tournament.findMany({
          where: { creatorId: user_id },
          select: { id: true },
        });
        const tournamentIds = tournaments.map((t) => t.id);
        if (tournamentIds.length > 0) {
          await tx.tournamentTeam.deleteMany({ where: { tournamentId: { in: tournamentIds } } });
          await tx.message.deleteMany({ where: { tournamentId: { in: tournamentIds } } });
          await tx.tournament.deleteMany({ where: { id: { in: tournamentIds } } });
        }

        // Delete teams created by the user and their dependents
        const teams = await tx.team.findMany({
          where: { creatorId: user_id },
          select: { id: true },
        });
        const teamIds = teams.map((t) => t.id);
        if (teamIds.length > 0) {
          await tx.teamMember.deleteMany({ where: { teamId: { in: teamIds } } });
          await tx.invitation.deleteMany({ where: { teamId: { in: teamIds } } });
          await tx.teamMessage.deleteMany({ where: { teamId: { in: teamIds } } });
          await tx.message.deleteMany({ where: { teamId: { in: teamIds } } });
          await tx.tournamentTeam.deleteMany({ where: { teamId: { in: teamIds } } });
          await tx.team.deleteMany({ where: { id: { in: teamIds } } });
        }

        // Finally, delete the user
        await tx.user.delete({ where: { user_id } });
      });

      logger.info(`User deleted: ${user_id}`);
      return { success: true };
    } catch (error) {
      logger.error(`Error deleting user ${user_id}:`, error);
      throw error;
    }
  }

  /**
   * Change user password
   */
  static async changePassword(user_id: string, currentPassword: string, newPassword: string) {
    try {
      // Get user with current password
      const user = await prisma.user.findUnique({
        where: { user_id },
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
        where: { user_id },
        data: { passwordHash: newHashedPassword },
      });

      logger.info(`Password changed for user: ${user_id}`);
      return { success: true };
    } catch (error) {
      logger.error(`Error changing password for user ${user_id}:`, error);
      throw error;
    }
  }

  /**
   * Reset password by email (forgot password flow)
   */
  static async resetPasswordByEmail(email: string, newPassword: string) {
    try {
      const user = await prisma.user.findUnique({ where: { email }, select: { user_id: true } });
      if (!user) {
        throw new NotFoundError('Email not found');
      }

      const saltRounds = 12;
      const newHashedPassword = await bcrypt.hash(newPassword, saltRounds);

      await prisma.user.update({
        where: { email },
        data: { passwordHash: newHashedPassword },
      });

      logger.info(`Password reset for user: ${email}`);
      return { success: true };
    } catch (error) {
      logger.error(`Error resetting password for email ${email}:`, error);
      throw error;
    }
  }
}
