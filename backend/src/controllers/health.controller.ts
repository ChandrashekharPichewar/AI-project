import { Request, Response } from 'express';
import { isDatabaseHealthy } from '../config/prisma.js';
import { env } from '../config/env.js';

export function healthCheck(req: Request, res: Response): void {
  const dbConnected = isDatabaseHealthy();

  let llmStatus = 'mock/simulation mode';
  if (env.GEMINI_API_KEY) {
    llmStatus = 'Google Gemini (Free Tier: text-embedding-004 + gemini-1.5-flash)';
  } else if (env.OPENAI_API_KEY) {
    llmStatus = 'OpenAI enabled';
  }

  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    services: {
      database: dbConnected ? 'connected (postgresql + pgvector)' : 'in-memory mode',
      llm: llmStatus,
    },
    version: '1.0.0',
  });
}
