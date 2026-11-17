import { PrismaClient } from '@prisma/client';
import { logger } from './logger.js';
import { env } from './env.js';

let prismaInstance: PrismaClient | null = null;
let isDbConnected = false;

export function getPrismaClient(): PrismaClient {
  if (!prismaInstance) {
    prismaInstance = new PrismaClient({
      log:
        env.NODE_ENV === 'development'
          ? ['error', 'warn']
          : ['error'],
    });
  }
  return prismaInstance;
}

export async function checkDatabaseConnection(): Promise<boolean> {
  if (!env.DATABASE_URL) {
    logger.warn('DATABASE_URL is not set. Database operations will use in-memory store fallback.');
    return false;
  }

  try {
    const prisma = getPrismaClient();
    await prisma.$queryRaw`SELECT 1`;
    isDbConnected = true;
    logger.info('✅ PostgreSQL connected successfully');

    // Check / verify vector extension
    try {
      await prisma.$executeRawUnsafe('CREATE EXTENSION IF NOT EXISTS vector;');
      logger.info('✅ pgvector extension verified/enabled');
    } catch (extErr) {
      logger.warn({ err: extErr }, 'pgvector extension query notice (might already be enabled or restricted)');
    }

    return true;
  } catch (error) {
    isDbConnected = false;
    logger.error({ error }, '❌ Database connection failed. Please check your DATABASE_URL.');
    return false;
  }
}

export function isDatabaseHealthy(): boolean {
  return isDbConnected;
}
