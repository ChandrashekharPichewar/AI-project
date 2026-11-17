import { Request, Response } from 'express';
import { isDatabaseHealthy } from '../config/prisma.js';
import { env } from '../config/env.js';

export function healthCheck(req: Request, res: Response): void {
  const dbConnected = isDatabaseHealthy();

  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    services: {
      database: dbConnected ? 'connected (postgresql + pgvector)' : 'in-memory mode',
      llm: env.OPENAI_API_KEY ? 'openai enabled' : 'mock/simulation mode',
    },
    version: '1.0.0',
  });
}
