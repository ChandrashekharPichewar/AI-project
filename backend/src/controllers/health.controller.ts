import { Request, Response } from 'express';
import { isDatabaseHealthy, ensureDatabaseConnected } from '../config/prisma.js';
import { aiService } from '../services/ai.service.js';

export async function healthCheck(req: Request, res: Response): Promise<void> {
  await ensureDatabaseConnected();
  const dbConnected = isDatabaseHealthy();
  const hasKey = !!aiService.getGeminiApiKey();

  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    services: {
      database: dbConnected ? 'connected (postgresql + pgvector)' : 'in-memory mode',
      llm: aiService.getStatus(),
      hasGeminiKey: hasKey,
      lastGeminiError: aiService.lastGeminiError,
    },
    version: '1.0.0',
  });
}
