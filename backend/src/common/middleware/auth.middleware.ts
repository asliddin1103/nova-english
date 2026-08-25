import { Request, Response, NextFunction } from 'express';
import { verifyStudentToken, verifyAdminToken } from '../utils/jwt';
import { Errors } from '../utils/errors';

// Extend Express Request to carry authenticated user info
declare global {
  namespace Express {
    interface Request {
      student?: { userId: number; telegramId: string };
      admin?: { staffId: number; email: string; role: string };
    }
  }
}

// Middleware for student-facing routes (Telegram JWT)
export const requireStudent = (req: Request, _res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return next(Errors.unauthorized('Missing or invalid Authorization header'));
    }
    const token = authHeader.split(' ')[1];
    const payload = verifyStudentToken(token);
    if (payload.type !== 'student') {
      return next(Errors.unauthorized('Invalid token type'));
    }
    req.student = { userId: payload.userId, telegramId: payload.telegramId };
    next();
  } catch {
    next(Errors.unauthorized('Invalid or expired token'));
  }
};

// Middleware for admin-facing routes
export const requireAdmin = (req: Request, _res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return next(Errors.unauthorized('Missing or invalid Authorization header'));
    }
    const token = authHeader.split(' ')[1];
    const payload = verifyAdminToken(token);
    if (payload.type !== 'admin') {
      return next(Errors.unauthorized('Invalid token type'));
    }
    req.admin = { staffId: payload.staffId, email: payload.email, role: payload.role };
    next();
  } catch {
    next(Errors.unauthorized('Invalid or expired token'));
  }
};
