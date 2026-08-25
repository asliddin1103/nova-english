// Centralized AppError for consistent error handling across the app.
// Controllers catch errors and pass to next(error).
// The global error handler middleware formats the response.
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;

  constructor(statusCode: number, code: string, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;

    // Maintain proper stack trace in V8
    Error.captureStackTrace(this, this.constructor);
  }
}

// Common error factory functions for readability
export const Errors = {
  notFound: (entity: string) =>
    new AppError(404, 'NOT_FOUND', `${entity} not found`),

  unauthorized: (message = 'Unauthorized') =>
    new AppError(401, 'UNAUTHORIZED', message),

  forbidden: (message = 'Forbidden') =>
    new AppError(403, 'FORBIDDEN', message),

  badRequest: (message: string) =>
    new AppError(400, 'BAD_REQUEST', message),

  conflict: (message: string) =>
    new AppError(409, 'CONFLICT', message),

  internal: (message = 'Internal server error') =>
    new AppError(500, 'INTERNAL_ERROR', message),
};
