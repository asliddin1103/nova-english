import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { AppError } from '../utils/errors';

// Validates req.body against a Zod schema.
// Returns 422 with field-level errors on failure.
export const validateBody = (schema: ZodSchema) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const details = result.error.flatten().fieldErrors;
      const err = new AppError(422, 'VALIDATION_ERROR', 'Validation failed');
      (err as any).details = details;
      return next(err);
    }
    req.body = result.data;
    next();
  };
};

export const validateQuery = (schema: ZodSchema) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      const details = result.error.flatten().fieldErrors;
      const err = new AppError(422, 'VALIDATION_ERROR', 'Invalid query parameters');
      (err as any).details = details;
      return next(err);
    }
    req.query = result.data as any;
    next();
  };
};
