import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '../../generated/prisma';
import { AppError, ValidationError, DatabaseError } from '../utils/errors';
import { ResponseBuilder } from '../utils/response';
import { logger } from '../utils/logger';
import { config } from '../config';

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = 500;
  let message = 'Internal Server Error';
  let errorDetails: any = null;

  // Log the error
  logger.error('Error occurred:', {
    error: error.message,
    stack: error.stack,
    req_body : req.body,
  });

  // Handle different types of errors
  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
  } else if (error instanceof ZodError) {
    statusCode = 400;
    message = 'Validation failed';
    errorDetails = error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message,
    }));
  } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
    statusCode = 400;
    
    switch (error.code) {
      case 'P2002':
        message = 'A record with this unique field already exists';
        statusCode = 409;
        break;
      case 'P2003':
        message = 'Foreign key constraint failed';
        break;
      case 'P2025':
        message = 'Record not found';
        statusCode = 404;
        break;
      default:
        message = 'Database operation failed';
        errorDetails = { code: error.code, meta: error.meta };
    }
  } else if (error instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400;
    message = 'Invalid data provided';
  } else if (error instanceof Prisma.PrismaClientUnknownRequestError) {
    statusCode = 500;
    message = 'Database operation failed';
    errorDetails = { message: error.message };
  } else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  } else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  } else if (error.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
  } else if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
  }

  // Create error response
  const errorResponse = ResponseBuilder.error(message, errorDetails);

  // Add path information in development
  if (config.nodeEnv === 'development') {
    errorResponse.path = req.url;
  }

  // Send response
  res.status(statusCode).json(errorResponse);
};

export const notFoundHandler = (req: Request, res: Response): void => {
  const errorResponse = ResponseBuilder.notFound(`Route ${req.originalUrl || req.url} not found`);
  
  if (config.nodeEnv === 'development') {
    errorResponse.path = req.url;
  }
  
  res.status(404).json(errorResponse);
};

export const asyncErrorHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
