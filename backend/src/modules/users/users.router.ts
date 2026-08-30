import { Router } from 'express';
import { requireStudent } from '../../common/middleware/auth.middleware';
import { prisma } from '../../database/prisma';

const router = Router();

// GET /me — authenticated student profile
router.get('/me', requireStudent, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.student!.userId },
      include: { streak: true, coins: true, onboarding: true },
    });
    if (!user) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'User not found' } }); return; }

    // Subscription status check
    const now = new Date();
    if (user.isSubscribed && user.subscriptionExpiresAt && user.subscriptionExpiresAt < now) {
      // Auto-expire subscription
      await prisma.user.update({ where: { id: user.id }, data: { isSubscribed: false } });
      user.isSubscribed = false;
    }

    res.json({ success: true, data: user });
  } catch (err) { next(err); }
});

export default router;
