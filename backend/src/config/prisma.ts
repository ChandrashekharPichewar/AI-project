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

      // Auto-ensure schema & vector(768) column compatibility
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
        CREATE TABLE IF NOT EXISTS document_chunks (
          id TEXT PRIMARY KEY,
          "itemId" TEXT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
          "chunkIndex" INTEGER NOT NULL,
          content TEXT NOT NULL,
          embedding vector(768),
          "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        ALTER TABLE document_chunks ALTER COLUMN embedding TYPE vector(768);
      `);
      logger.info('✅ pgvector schema verified for 768-d Gemini embeddings');
    } catch (extErr: any) {
      logger.warn({ err: extErr.message }, 'pgvector notice (might already be configured)');
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
