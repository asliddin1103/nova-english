import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../../config/env';

export interface StudentJwtPayload {
  userId: number;
  telegramId: string;
  type: 'student';
}

export interface AdminJwtPayload {
  staffId: number;
  email: string;
  role: string;
  type: 'admin';
}

export type JwtPayload = StudentJwtPayload | AdminJwtPayload;

export const signStudentToken = (payload: Omit<StudentJwtPayload, 'type'>): string => {
  return jwt.sign(
    { ...payload, type: 'student' },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN } as SignOptions
  );
};

export const signAdminToken = (payload: Omit<AdminJwtPayload, 'type'>): string => {
  return jwt.sign(
    { ...payload, type: 'admin' },
    env.ADMIN_JWT_SECRET,
    { expiresIn: env.ADMIN_JWT_EXPIRES_IN } as SignOptions
  );
};

export const verifyStudentToken = (token: string): StudentJwtPayload => {
  return jwt.verify(token, env.JWT_SECRET) as StudentJwtPayload;
};

export const verifyAdminToken = (token: string): AdminJwtPayload => {
  return jwt.verify(token, env.ADMIN_JWT_SECRET) as AdminJwtPayload;
};
