import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';
import { sendError } from '../utils/api-response';

export const errorHandler = (err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error(err.message, err);

  if (err instanceof AppError) {
    return sendError(res, err.code, err.message, err.details, err.statusCode);
  }

  // Handle default unhandled errors
  return sendError(
    res,
    'INTERNAL_SERVER_ERROR',
    process.env.NODE_ENV === 'production' ? 'An unexpected error occurred on the server' : err.message,
    [],
    500
  );
};
