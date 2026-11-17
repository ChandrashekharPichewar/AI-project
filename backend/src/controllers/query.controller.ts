import { Request, Response, NextFunction } from 'express';
import { ragService } from '../services/rag.service.js';
import { logger } from '../config/logger.js';
import { QueryInput } from '../schemas/query.schema.js';

export class QueryController {
  public async handleQuery(
    req: Request<unknown, unknown, QueryInput>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { query, topK } = req.body;
      logger.info({ query, topK }, 'Received knowledge inbox question query');

      const result = await ragService.executeRagQuery(query, topK);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const queryController = new QueryController();
