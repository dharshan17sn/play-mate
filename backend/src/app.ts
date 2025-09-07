import express from "express";
import type { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
// Removed express-async-errors due to compatibility issues

import { config } from './config';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';
import swaggerUi from 'swagger-ui-express';
import { openapiSpec } from './openapi';

// Import routes
import userRoutes from './routes/userRoutes';
import teamRoutes from './routes/teamRoutes';
import invitationRoutes from './routes/invitationRoutes';
import gameRoutes from './routes/gameRoutes';
import friendRoutes from './routes/friendRoutes';
import chatRoutes from './routes/chatRoutes';

// Create Express app
const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration - allow Authorization header and common localhost dev origins
const allowedSet = new Set(config.cors.allowedOrigins);
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const isLocalhost = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);
    if (allowedSet.has(origin) || isLocalhost) return callback(null, true);
    return callback(null, false as any);
  },
  credentials: false,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204,
}));


// Compression middleware
app.use(compression());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req: Request, res: Response, next: any) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString(),
  });
  next();
});

// OpenAPI docs & spec
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openapiSpec));
app.get('/api/openapi.json', (req: Request, res: Response) => {
  res.json(openapiSpec);
});

// Log that docs are being served
console.log('📚 API Documentation available at: http://localhost:3000/api/docs');
console.log('📄 OpenAPI JSON available at: http://localhost:3000/api/openapi.json');

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.nodeEnv,
  });
});

// API routes
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/teams', teamRoutes);
app.use('/api/v1/invitations', invitationRoutes);
app.use('/api/v1/games', gameRoutes);
app.use('/api/v1/friends', friendRoutes);
app.use('/api/v1/chat', chatRoutes);

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Play-Mate API',
    version: '1.0.0',
    documentation: '/api/docs',
    health: '/health',
    openapi: '/api/openapi.json',
  });
});

// Test endpoint to verify OpenAPI spec
app.get('/api/test-docs', (req: Request, res: Response) => {
  res.json({
    message: 'OpenAPI spec test',
    pathsCount: Object.keys((openapiSpec as any).paths || {}).length,
    hasPaths: !!(openapiSpec as any).paths,
    specKeys: Object.keys(openapiSpec),
  });
});

// 404 handler
app.use(notFoundHandler);

// Error handling middleware (must be last)
app.use(errorHandler);

export default app;
