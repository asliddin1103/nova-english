import { Request, Response, NextFunction } from 'express';
import { authWithTelegram, loginAdmin, devLogin } from './auth.service';
import { Errors } from '../../common/utils/errors';

export const devAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { telegramId, firstName, lastName, username } = req.body || {};
    const result = await devLogin(telegramId, firstName, lastName, username);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const telegramAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { initData } = req.body;
    if (!initData || typeof initData !== 'string') {
      // In development mode, auto fallback to dev login if no initData provided
      if (process.env.NODE_ENV !== 'production') {
        const result = await devLogin();
        res.status(200).json({ success: true, data: result });
        return;
      }
      return next(Errors.badRequest('initData is required'));
    }
    const result = await authWithTelegram(initData);
    res.status(200).json({ success: true, data: result });
  } catch (err: any) {
    // Telegram validation errors are bad requests, not server errors
    if (err.message?.includes('Invalid') || err.message?.includes('expired') || err.message?.includes('Missing')) {
      return next(Errors.unauthorized(err.message));
    }
    next(err);
  }
};

export const adminLogin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return next(Errors.badRequest('Email and password are required'));
    }
    const result = await loginAdmin(email, password);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};
