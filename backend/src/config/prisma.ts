import { PrismaClient } from '@prisma/client';
import { logger } from './logger.js';
import { env } from './env.js';

let prismaInstance: PrismaClient | null = null;
let isDbConnected = false;
let dbInitPromise: Promise<boolean> | null = null;

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
  const dbUrl = (process.env.DATABASE_URL || env.DATABASE_URL || '').trim();
  if (!dbUrl) {
    logger.info('DATABASE_URL is not set. Operating in in-memory store mode.');
    return false;
  }

  try {
    const prisma = getPrismaClient();

    // Test connection with 4s timeout to avoid serverless latency
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Database ping timeout after 4s')), 4000)
      ),
    ]);

    isDbConnected = true;
    logger.info('✅ PostgreSQL connected successfully');

    // Check / verify vector extension
    try {
      await prisma.$executeRawUnsafe('CREATE EXTENSION IF NOT EXISTS vector;');
      logger.info('✅ pgvector extension verified/enabled');
    } catch (extErr: any) {
      logger.warn({ err: extErr.message }, 'pgvector notice (might already be configured or restricted)');
    }

    // Auto-ensure schema & vector(768) column compatibility
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS items (
          id TEXT PRIMARY KEY,
          type TEXT NOT NULL,
          title TEXT,
          url TEXT,
          "rawContent" TEXT NOT NULL,
          "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS document_chunks (
          id TEXT PRIMARY KEY,
          "itemId" TEXT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
          "chunkIndex" INTEGER NOT NULL,
          content TEXT NOT NULL,
          embedding vector(768),
          "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);
      logger.info('✅ pgvector schema verified for 768-d Gemini embeddings');
    } catch (schemaErr: any) {
      logger.warn({ err: schemaErr.message }, 'pgvector schema verification notice');
    }

    return true;
  } catch (error: any) {
    isDbConnected = false;
    logger.warn({ error: error.message }, 'PostgreSQL connection failed or timed out. Gracefully using in-memory store.');
    return false;
  }
}

/**
 * Ensures database connection is checked lazily on request without blocking.
 */
export async function ensureDatabaseConnected(): Promise<boolean> {
  const dbUrl = (process.env.DATABASE_URL || env.DATABASE_URL || '').trim();
  if (!dbUrl) {
    return false;
  }
  if (isDbConnected) {
    return true;
  }
  if (!dbInitPromise) {
    dbInitPromise = checkDatabaseConnection().finally(() => {
      dbInitPromise = null;
    });
  }
  return dbInitPromise;
}

export function isDatabaseHealthy(): boolean {
  return isDbConnected;
}
