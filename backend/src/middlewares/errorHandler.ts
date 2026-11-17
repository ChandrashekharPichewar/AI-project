import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger.js';

export class AppError extends Error {
  public statusCode: number;
  public details?: unknown;

  constructor(message: string, statusCode = 500, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void {
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const message = err.message || 'Internal Server Error';

  logger.error(
    {
      err: {
        message: err.message,
        stack: err.stack,
        details: err instanceof AppError ? err.details : undefined,
      },
      method: req.method,
      url: req.url,
      statusCode,
    },
    'Request error'
  );

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      statusCode,
      details: err instanceof AppError ? err.details : undefined,
    },
  });
}
