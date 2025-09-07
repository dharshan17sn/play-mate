import { PrismaClient, Prisma } from '../../generated/prisma';
import { logger } from '../utils/logger';

declare global {
  var __prisma: PrismaClient | undefined;
}

class Database {
  private static instance: Database;
  private _client: PrismaClient<Prisma.PrismaClientOptions, 'query' | 'error' | 'warn' | 'info'>;

  private constructor() {
    this._client = new PrismaClient<Prisma.PrismaClientOptions, 'query' | 'error' | 'warn' | 'info'>({
      log: [
        { level: 'query', emit: 'event' },
        { level: 'error', emit: 'event' },
        { level: 'warn', emit: 'event' },
        { level: 'info', emit: 'event' },
      ],
    });

    // Log queries in development
    if (process.env.NODE_ENV === 'development') {
      this._client.$on('query', (e: Prisma.QueryEvent) => {
        logger.debug('Query: ' + e.query);
        logger.debug('Params: ' + e.params);
        logger.debug('Duration: ' + e.duration + 'ms');
      });
    }

    // Log errors
    this._client.$on('error', (e: Prisma.LogEvent) => {
      logger.error('Prisma Error: ' + e.message);
    });

    // Log warnings
    this._client.$on('warn', (e: Prisma.LogEvent) => {
      logger.warn('Prisma Warning: ' + e.message);
    });

    // Log info
    this._client.$on('info', (e: Prisma.LogEvent) => {
      logger.info('Prisma Info: ' + e.message);
    });
  }

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  public get client(): PrismaClient {
    return this._client;
  }

  public async connect(): Promise<void> {
    try {
      await this._client.$connect();
      logger.info('Database connected successfully');
    } catch (error) {
      logger.error('Failed to connect to database:', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    try {
      await this._client.$disconnect();
      logger.info('Database disconnected successfully');
    } catch (error) {
      logger.error('Failed to disconnect from database:', error);
      throw error;
    }
  }

  public async healthCheck(): Promise<boolean> {
    try {
      await this._client.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      logger.error('Database health check failed:', error);
      return false;
    }
  }
}

// Use global instance in development to prevent multiple instances during hot reload
export const prisma = globalThis.__prisma || Database.getInstance().client;

if (process.env.NODE_ENV === 'development') {
  globalThis.__prisma = prisma;
}

export const database = Database.getInstance();
