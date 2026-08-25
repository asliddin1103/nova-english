import { Router } from 'express';
import { telegramAuth, adminLogin, devAuth } from './auth.controller';

const router = Router();

// POST /auth/telegram  — Student Telegram auth
router.post('/telegram', telegramAuth);

// POST /auth/dev-login — Dev browser login (testing outside Telegram)
router.post('/dev-login', devAuth);

// POST /auth/admin/login  — Admin email/password auth
router.post('/admin/login', adminLogin);

export default router;

