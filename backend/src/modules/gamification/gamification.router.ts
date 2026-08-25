import { Router } from 'express';
import { requireStudent } from '../../common/middleware/auth.middleware';
import { getMyGamification, getLeaderboard } from './gamification.service';

const router = Router();

router.get('/me', requireStudent, async (req, res, next) => {
  try {
    const data = await getMyGamification(req.student!.userId);
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

router.get('/leaderboard', requireStudent, async (req, res, next) => {
  try {
    const data = await getLeaderboard(req.student!.userId);
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

export default router;
