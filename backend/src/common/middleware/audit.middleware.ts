import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../database/prisma';

// Audit middleware factory — call after the action is done
// Used in admin controllers: auditLog('APPROVE_PAYMENT', 'Payment', paymentId)
export const createAuditLog = async (
  staffId: number,
  action: string,
  entityType: string,
  entityId?: number,
  oldValue?: object,
  newValue?: object,
  ipAddress?: string
): Promise<void> => {
  try {
    await prisma.auditLog.create({
      data: {
        staffId,
        action,
        entityType,
        entityId,
        oldValue: oldValue ? JSON.parse(JSON.stringify(oldValue)) : undefined,
        newValue: newValue ? JSON.parse(JSON.stringify(newValue)) : undefined,
        ipAddress,
      },
    });
  } catch (err) {
    // Audit log failure should NEVER break the main operation
    console.error('[AuditLog] Failed to create audit log:', err);
  }
};
