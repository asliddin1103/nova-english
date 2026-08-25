import { Router } from 'express';
import { requireStudent } from '../../common/middleware/auth.middleware';
import { requireAdmin } from '../../common/middleware/auth.middleware';
import { requireRoles } from '../../common/middleware/roles.middleware';
import * as controller from './lessons.controller';

const router = Router();

// Student routes
router.get('/', requireStudent, controller.getLessons);
router.get('/:id', requireStudent, controller.getLessonById);
router.post('/:id/progress', requireStudent, controller.markProgress);

// Admin routes
router.get('/admin/list', requireAdmin, requireRoles('CONTENT_ADMIN', 'SUPER_ADMIN'), controller.adminGetLessons);
router.post('/admin', requireAdmin, requireRoles('CONTENT_ADMIN', 'SUPER_ADMIN'), controller.adminCreateLesson);
router.patch('/admin/:id', requireAdmin, requireRoles('CONTENT_ADMIN', 'SUPER_ADMIN'), controller.adminUpdateLesson);
router.delete('/admin/:id', requireAdmin, requireRoles('CONTENT_ADMIN', 'SUPER_ADMIN'), controller.adminDeleteLesson);

export default router;
