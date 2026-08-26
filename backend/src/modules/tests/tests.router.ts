import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { requireStudent, requireAdmin } from '../../common/middleware/auth.middleware';
import { requireRoles } from '../../common/middleware/roles.middleware';
import * as controller from './tests.controller';
import { env } from '../../config/env';

const submissionStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, path.join(env.UPLOAD_DIR, 'submissions')),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, unique);
  },
});

const uploadSubmission = multer({
  storage: submissionStorage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB for audio files
  fileFilter: (_req, file, cb) => {
    const allowed = ['audio/webm', 'audio/ogg', 'audio/mp4', 'audio/mpeg', 'image/jpeg', 'image/png', 'application/pdf'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Invalid file type for submission'));
  },
});

const router = Router();

// Student routes
router.get('/', requireStudent, controller.getTests);
router.get('/submissions', requireStudent, controller.getMySubmissions);
router.get('/:id', requireStudent, controller.getTestById);
router.post('/:id/submit', requireStudent, controller.submitAutoTest);

// Manual submission with optional file
router.post('/:id/manual-submit', requireStudent, uploadSubmission.single('file'), async (req, res, next) => {
  try {
    const { type, content } = req.body;
    const fileUrl = req.file ? `/uploads/submissions/${req.file.filename}` : undefined;
    const { submitManualTest } = await import('./tests.service');
    const result = await submitManualTest(req.student!.userId, parseInt(String(req.params.id)), type, content, fileUrl);
    res.status(201).json({ success: true, data: result });
  } catch (err) { next(err); }
});

// Admin routes
router.get('/admin/submissions/pending', requireAdmin, requireRoles('TEACHER', 'SUPER_ADMIN'), controller.adminGetPendingSubmissions);
router.post('/admin/submissions/:id/review', requireAdmin, requireRoles('TEACHER', 'SUPER_ADMIN'), controller.adminReviewSubmission);

export default router;
