import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';
import { logger } from '../utils/logger';

export const notFoundHandler = (req: Request, res: Response): void => {
  ApiResponse.failure(res, 404, `Route not found: ${req.method} ${req.originalUrl}`);
};

const describeUnknownError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.stack || error.message;
  }
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
};

export const errorHandler = (
  error: Error,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void => {
  if (error instanceof ApiError) {
    if (error.statusCode >= 500) {
      logger.error(describeUnknownError(error));
    }
    ApiResponse.failure(res, error.statusCode, error.message, error.errors);
    return;
  }

  if (error?.name === 'CastError') {
    ApiResponse.failure(res, 400, 'Invalid resource identifier');
    return;
  }

  if (error?.name === 'ValidationError') {
    ApiResponse.failure(res, 400, error.message);
    return;
  }

  logger.error(describeUnknownError(error));
  ApiResponse.failure(res, 500, 'Internal server error');
};
