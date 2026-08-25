import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { env } from '../../config/env';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Operational errors: expected, safe to send details to client
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
      },
    });
    return;
  }

  // Prisma known errors
  if ((err as any).code === 'P2025') {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Record not found' },
    });
    return;
  }

  if ((err as any).code === 'P2002') {
    res.status(409).json({
      success: false,
      error: { code: 'CONFLICT', message: 'Record already exists' },
    });
    return;
  }

  // Unknown/unexpected errors: log and return generic message
  console.error('[UnhandledError]', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
  });

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: env.NODE_ENV === 'production'
        ? 'Something went wrong. Please try again.'
        : err.message,
    },
  });
};
