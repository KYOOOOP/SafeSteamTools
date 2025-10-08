import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
  details?: unknown;
}

export const errorHandler = (
  error: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Log error details
  logger.error('API Error:', {
    message: error.message,
    statusCode: error.statusCode || 500,
    code: error.code || 'INTERNAL_ERROR',
    stack: error.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  const statusCode = error.statusCode || 500;
  const response: {
    error: string;
    code: string;
    details?: unknown;
    timestamp: string;
  } = {
    error: error.message || 'Internal server error',
    code: error.code || 'INTERNAL_ERROR',
    timestamp: new Date().toISOString(),
  };

  // Include details only in development
  if (process.env.NODE_ENV === 'development' && error.details) {
    response.details = error.details;
  }

  res.status(statusCode).json(response);
};

export const createError = (message: string, statusCode = 500, code?: string, details?: unknown): ApiError => {
  const error = new Error(message) as ApiError;
  error.statusCode = statusCode;
  error.code = code || 'API_ERROR';
  error.details = details;
  return error;
};

export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    error: 'Endpoint not found',
    code: 'NOT_FOUND',
    timestamp: new Date().toISOString(),
  });
};