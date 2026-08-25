import { Request, Response, NextFunction } from 'express';
import { Errors } from '../utils/errors';
import { StaffRole } from '@prisma/client';

// Role hierarchy: SUPER_ADMIN > CONTENT_ADMIN / FINANCE_ADMIN > TEACHER
const ROLE_HIERARCHY: Record<StaffRole, number> = {
  SUPER_ADMIN: 100,
  CONTENT_ADMIN: 50,
  FINANCE_ADMIN: 50,
  TEACHER: 10,
};

// requireRoles(['FINANCE_ADMIN', 'SUPER_ADMIN']) — allows any of the listed roles
export const requireRoles = (...roles: StaffRole[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.admin) {
      return next(Errors.unauthorized());
    }
    const adminRole = req.admin.role as StaffRole;
    // SUPER_ADMIN always has access
    if (adminRole === 'SUPER_ADMIN') {
      return next();
    }
    if (roles.includes(adminRole)) {
      return next();
    }
    next(Errors.forbidden('You do not have permission to perform this action'));
  };
};

// Minimum hierarchy level check
export const requireMinRole = (minRole: StaffRole) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.admin) {
      return next(Errors.unauthorized());
    }
    const adminRole = req.admin.role as StaffRole;
    if (ROLE_HIERARCHY[adminRole] >= ROLE_HIERARCHY[minRole]) {
      return next();
    }
    next(Errors.forbidden('Insufficient permissions'));
  };
};
