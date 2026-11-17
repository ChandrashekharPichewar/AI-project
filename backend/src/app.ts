import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { requestLogger } from './middlewares/requestLogger.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { validate } from './middlewares/validate.js';
import { IngestSchema } from './schemas/ingest.schema.js';
import { QuerySchema } from './schemas/query.schema.js';
import { ingestController } from './controllers/ingest.controller.js';
import { itemsController } from './controllers/items.controller.js';
import { queryController } from './controllers/query.controller.js';
import { healthCheck } from './controllers/health.controller.js';

export function createApp(): Express {
  const app = express();

  // Middleware configuration
  app.use(
    cors({
      origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN.split(','),
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    })
  );

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(requestLogger);

  // Health check endpoints
  app.get('/health', healthCheck);
  app.get('/api/health', healthCheck);

  // Ingestion endpoints (satisfying requirement POST /ingest and POST /api/ingest)
  app.post(
    '/ingest',
    validate(IngestSchema),
    ingestController.handleIngest.bind(ingestController)
  );
  app.post(
    '/api/ingest',
    validate(IngestSchema),
    ingestController.handleIngest.bind(ingestController)
  );

  // Items listing endpoints (satisfying requirement GET /items and GET /api/items)
  app.get('/items', itemsController.getItems.bind(itemsController));
  app.get('/api/items', itemsController.getItems.bind(itemsController));
  app.delete('/items/:id', itemsController.deleteItem.bind(itemsController));
  app.delete('/api/items/:id', itemsController.deleteItem.bind(itemsController));

  // Semantic Search & RAG Query endpoints (satisfying requirement POST /query and POST /api/query)
  app.post(
    '/query',
    validate(QuerySchema),
    queryController.handleQuery.bind(queryController)
  );
  app.post(
    '/api/query',
    validate(QuerySchema),
    queryController.handleQuery.bind(queryController)
  );

  // Root welcome route
  app.get('/', (req: Request, res: Response) => {
    res.json({
      name: 'AI Knowledge Inbox API',
      version: '1.0.0',
      description: 'Production-ready minimal RAG pipeline with Express, Prisma, pgvector, and OpenAI',
      endpoints: {
        ingest: 'POST /ingest (or /api/ingest)',
        items: 'GET /items (or /api/items)',
        query: 'POST /query (or /api/query)',
        health: 'GET /health',
      },
    });
  });

  // 404 Route Handler
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: {
        message: `Endpoint ${req.method} ${req.originalUrl} not found`,
        statusCode: 404,
      },
    });
  });

  // Global Error Handler
  app.use(errorHandler);

  return app;
}
