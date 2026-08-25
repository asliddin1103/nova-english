import { Request, Response, NextFunction } from 'express';
import * as paymentsService from './payments.service';
import { Errors } from '../../common/utils/errors';
import { getPaginationParams, buildPaginationMeta } from '../../common/utils/pagination';

export const getCardInfo = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.json({ success: true, data: paymentsService.getCardInfo() });
  } catch (err) { next(err); }
};

export const uploadReceipt = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.file) return next(Errors.badRequest('Receipt image is required'));
    const userId = req.student!.userId;
    const amount = parseInt(req.body.amount, 10);
    if (!amount || amount < 1000) return next(Errors.badRequest('Valid payment amount is required'));
    const fileUrl = `/uploads/receipts/${req.file.filename}`;
    const result = await paymentsService.uploadReceipt(userId, fileUrl, amount);
    res.status(201).json({ success: true, data: result });
  } catch (err) { next(err); }
};

export const getMyPayments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const payments = await paymentsService.getUserPayments(req.student!.userId);
    res.json({ success: true, data: payments });
  } catch (err) { next(err); }
};

// Admin controllers
export const adminGetPendingPayments = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const payments = await paymentsService.getPendingPayments();
    res.json({ success: true, data: payments });
  } catch (err) { next(err); }
};

export const adminGetAllPayments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query as any);
    const { payments, total } = await paymentsService.getAllPayments(skip, limit, req.query.status as string);
    res.json({ success: true, data: payments, meta: buildPaginationMeta(total, page, limit) });
  } catch (err) { next(err); }
};

export const adminApprovePayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const paymentId = parseInt(req.params.id as string, 10);
    const result = await paymentsService.approvePayment(paymentId, req.admin!.staffId, req.ip);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};

export const adminRejectPayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const paymentId = parseInt(req.params.id as string, 10);
    const { reason } = req.body;
    if (!reason) return next(Errors.badRequest('Rejection reason is required'));
    const result = await paymentsService.rejectPayment(paymentId, req.admin!.staffId, reason, req.ip);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};
