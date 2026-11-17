import { Request, Response, NextFunction } from 'express';
import { vectorService } from '../services/vector.service.js';
import { logger } from '../config/logger.js';

export class ItemsController {
  public async getItems(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      logger.info('Fetching all saved items');
      const items = await vectorService.getAllItems();

      res.status(200).json({
        success: true,
        data: items,
        count: items.length,
      });
    } catch (error) {
      next(error);
    }
  }

  public async deleteItem(req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const deleted = await vectorService.deleteItem(id);

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: { message: `Item with id ${id} not found` },
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Item and its vector chunks deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const itemsController = new ItemsController();
