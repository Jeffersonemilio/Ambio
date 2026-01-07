import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/index.js';
import { logger } from '../logger/index.js';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    logger.warn({ err, statusCode: err.statusCode }, err.message);
    res.status(err.statusCode).json({
      error: err.message,
      statusCode: err.statusCode,
    });
    return;
  }

  // Unexpected error
  logger.error({ err }, 'Unexpected error');
  res.status(500).json({
    error: 'Internal server error',
    statusCode: 500,
  });
}
