import type { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';
import { ValidationError } from '../utils/errors';

export const validateRequest = <T extends z.ZodTypeAny>(schema: T) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {

    try {
      console.log('Validation - Request body:', req.body);
      console.log('Validation - Schema:', schema.description || 'No description');

      const validatedData = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      console.log('Validation - Success:', validatedData);

      req.body = validatedData.body || req.body;
      req.query = validatedData.query || req.query;
      req.params = validatedData.params || req.params;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        console.error('Validation - ZodError:', error.errors);
        const validationErrors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        next(new ValidationError(`Validation failed: ${validationErrors.map(e => e.message).join(', ')}`));
      } else {
        console.error('Validation - Other error:', error);
        next(error);
      }
    }
  };
};

// Common validation schemas
export const paginationSchema = z.object({
  query: z.object({
    page: z.string().transform(Number).pipe(z.number().min(1)).default('1'),
    limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).default('10'),
  }),
});

export const idParamSchema = z.object({
  params: z.object({
    user_id: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_-]+$/, 'User ID can only contain letters, numbers, underscores, and hyphens'),
  }),
});

export const searchSchema = z.object({
  query: z.object({
    search: z.string().optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
  }),
});

export const userSearchSchema = z.object({
  query: z.object({
    user_id: z.string().optional(),
    displayName: z.string().optional(),
    search: z.string().optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
  }),
});

// User validation schemas
// export const userRegistrationSchema = z.object({
//   body: z.object({
//     user_id: z.string().min(8).max(20),
//     displayName: z.string().min(2).max(30),
//     email: z.string().email(),
//     password: z.string().min(8).max(100),
//     gender: z.string().optional(),
//     location: z.string().optional(),
//     preferredDays: z.array(z.enum(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'])).optional(),
//     timeRange: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]-([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Time range must be in format HH:MM-HH:MM').optional(),
//   }),
// });

export const userLoginSchema = z.object({
  body: z.object({
    identifier: z.string().min(4), // email or user_id
    password: z.string(),
  }),
});

export const userUpdateSchema = z.object({
  body: z.object({
    displayName: z.string().min(2).max(30).optional(),
    photo: z.string().optional(),
    gender: z.string().optional(),
    location: z.string().optional(),
    preferredDays: z.array(z.enum(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'])).optional(),
    timeRange: z.array(z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]-([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Time range must be in format HH:MM-HH:MM (e.g., 18:00-22:00)')).optional(),
    preferredGames: z.array(z.string().min(2).max(50)).optional(),
  }),
});

export const requestOtpSchema = z.object({
  body: z.object({
    email: z.string().email(),
  }),
});

export const verifyOtpSchema = z.object({
  body: z.object({
    email: z.string().email(),
    code: z.string().min(4).max(8),
    user_id: z.string().min(4).max(20),
    displayName: z.string().min(4).max(30),
    password: z.string().min(8).max(100),
    gender: z.string().optional(),
    location: z.string().optional(),
  }),
});

export const forgotPasswordRequestSchema = z.object({
  body: z.object({
    email: z.string().email(),
  }),
});

export const forgotPasswordResetSchema = z.object({
  body: z.object({
    email: z.string().email(),
    code: z.string().min(4).max(8),
    newPassword: z.string().min(8).max(100),
  }),
});

// Team validation schemas
export const teamCreateSchema = z.object({
  body: z.object({
    title: z.string().min(2).max(100),
    description: z.string().max(500).optional(),
    photo: z.string().optional(),
    gameName: z.string().min(2).max(50),
    noOfPlayers: z.number().min(2).max(50).optional(),
    isPublic: z.boolean().optional().default(true),
  }),
});

export const teamUpdateSchema = z.object({
  body: z.object({
    title: z.string().min(2).max(100).optional(),
    description: z.string().max(500).optional(),
    photo: z.string().optional(),
    noOfPlayers: z.number().min(2).max(50).optional(),
    isPublic: z.boolean().optional(),
  }),
});

// Team parameter validation schemas
export const teamIdParamSchema = z.object({
  params: z.object({
    teamId: z.string().uuid(),
  }),
});

export const teamMemberParamSchema = z.object({
  params: z.object({
    teamId: z.string().uuid(),
    memberId: z.string().min(1), // Accept any non-empty string for memberId (user_id)
  }),
});

export const invitationIdParamSchema = z.object({
  params: z.object({
    invitationId: z.string().uuid(),
  }),
});

// Tournament validation schemas
export const tournamentCreateSchema = z.object({
  body: z.object({
    title: z.string().min(2).max(100),
    description: z.string().max(500).optional(),
    gameId: z.string().min(1),
    startDate: z.string().datetime(),
    location: z.string().min(2).max(100),
    photo: z.string().optional(),
    noOfPlayersPerTeam: z.number().int().min(1).max(50),
  }),
});

export const tournamentUpdateSchema = z.object({
  body: z.object({
    title: z.string().min(2).max(100).optional(),
    description: z.string().max(500).optional(),
    startDate: z.string().datetime().optional(),
    location: z.string().min(2).max(100).optional(),
    photo: z.string().optional(),
    noOfPlayersPerTeam: z.number().int().min(1).max(50).optional(),
  }),
});

export const tournamentIdParamSchema = z.object({
  params: z.object({
    tournamentId: z.string().uuid(),
  }),
});

export const tournamentAndTeamIdParamSchema = z.object({
  params: z.object({
    tournamentId: z.string().uuid(),
    teamId: z.string().uuid(),
  }),
});

export const tournamentTeamRegistrationSchema = z.object({
  body: z.object({
    teamId: z.string().uuid(),
  }),
});

// Join request validation schemas
export const invitationCreateSchema = z.object({
  body: z.object({
    teamId: z.string().uuid(),
  }),
});

export const invitationUpdateSchema = z.object({
  body: z.object({
    status: z.enum(['ACCEPTED', 'REJECTED']),
  }),
});

// Team admin validation schemas (for promoting/demoting team members)
export const teamAdminAddSchema = z.object({
  body: z.object({
    userId: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_-]+$/, 'User ID can only contain letters, numbers, underscores, and hyphens'),
  }),
  params: z.object({
    teamId: z.string().uuid(),
  }),
});

export const teamAdminRemoveSchema = z.object({
  params: z.object({
    teamId: z.string().uuid(),
    userId: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_-]+$/, 'User ID can only contain letters, numbers, underscores, and hyphens'),
  }),
});

// Message validation schemas
export const messageCreateSchema = z.object({
  body: z.object({
    content: z.string().min(1).max(1000),
    teamId: z.string().uuid().optional(),
    tournamentId: z.string().uuid().optional(),
  }),
});

// Game validation schemas
export const gameCreateSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(50),
  }),
});

export const gameDeleteSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(50),
    force: z.boolean().optional().default(false),
  }),
});