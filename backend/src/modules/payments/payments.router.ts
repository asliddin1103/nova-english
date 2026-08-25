import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { requireStudent } from '../../common/middleware/auth.middleware';
import { requireAdmin } from '../../common/middleware/auth.middleware';
import { requireRoles } from '../../common/middleware/roles.middleware';
import * as controller from './payments.controller';
import { env } from '../../config/env';

// Multer config for receipt uploads
const receiptStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, path.join(env.UPLOAD_DIR, 'receipts')),
  filename: (_req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const uploadReceipt = multer({
  storage: receiptStorage,
  limits: { fileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, and WebP images are allowed'));
    }
  },
});

const router = Router();

// Student routes
router.get('/card-info', requireStudent, controller.getCardInfo);
router.post('/receipt', requireStudent, uploadReceipt.single('receipt'), controller.uploadReceipt);
router.get('/me', requireStudent, controller.getMyPayments);

// Admin routes
router.get('/admin/pending', requireAdmin, requireRoles('FINANCE_ADMIN', 'SUPER_ADMIN'), controller.adminGetPendingPayments);
router.get('/admin', requireAdmin, requireRoles('FINANCE_ADMIN', 'SUPER_ADMIN'), controller.adminGetAllPayments);
router.post('/admin/:id/approve', requireAdmin, requireRoles('FINANCE_ADMIN', 'SUPER_ADMIN'), controller.adminApprovePayment);
router.post('/admin/:id/reject', requireAdmin, requireRoles('FINANCE_ADMIN', 'SUPER_ADMIN'), controller.adminRejectPayment);

export default router;
