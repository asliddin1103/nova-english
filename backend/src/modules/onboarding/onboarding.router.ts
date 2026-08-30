import { Router } from 'express';
import { requireStudent } from '../../common/middleware/auth.middleware';
import { prisma } from '../../database/prisma';

const router = Router();

// GET /api/v1/onboarding/status
// Foydalanuvchi onboarding holatini qaytaradi
router.get('/status', requireStudent, async (req, res, next) => {
  try {
    const userId = req.student!.userId;
    const onboarding = await prisma.userOnboarding.findUnique({
      where: { userId },
    });

    res.json({
      success: true,
      data: {
        hasOnboarding: !!onboarding,
        isCompleted: onboarding?.isCompleted ?? false,
        // Partial data — foydalanuvchi davom ettirishi uchun
        partial: onboarding && !onboarding.isCompleted ? {
          ageGroup: onboarding.ageGroup,
          gender: onboarding.gender,
          goals: onboarding.goals,
          currentLevel: onboarding.currentLevel,
          skills: onboarding.skills,
          dailyTime: onboarding.dailyTime,
        } : null,
      },
    });
  } catch (err) { next(err); }
});

// POST /api/v1/onboarding/save
// Qisman javoblarni saqlash (foydalanuvchi chiqib ketsa davom ettirish uchun)
router.post('/save', requireStudent, async (req, res, next) => {
  try {
    const userId = req.student!.userId;
    const { ageGroup, gender, goals, currentLevel, skills, dailyTime } = req.body;

    const data: any = {};
    if (ageGroup !== undefined) data.ageGroup = ageGroup;
    if (gender !== undefined) data.gender = gender;
    if (goals !== undefined) data.goals = Array.isArray(goals) ? goals : [];
    if (currentLevel !== undefined) data.currentLevel = currentLevel;
    if (skills !== undefined) data.skills = Array.isArray(skills) ? skills : [];
    if (dailyTime !== undefined) data.dailyTime = dailyTime;

    const onboarding = await prisma.userOnboarding.upsert({
      where: { userId },
      update: data,
      create: { userId, ...data },
    });

    res.json({ success: true, data: onboarding });
  } catch (err) { next(err); }
});

// POST /api/v1/onboarding/complete
// So'rovnomani yakunlash — isCompleted = true
router.post('/complete', requireStudent, async (req, res, next) => {
  try {
    const userId = req.student!.userId;
    const { ageGroup, gender, goals, currentLevel, skills, dailyTime } = req.body || {};

    const cleanGoals = Array.isArray(goals) ? goals : [];
    const cleanSkills = Array.isArray(skills) ? skills : [];

    const onboarding = await prisma.userOnboarding.upsert({
      where: { userId },
      update: {
        ageGroup: ageGroup ? String(ageGroup) : null,
        gender: gender ? String(gender) : null,
        goals: cleanGoals,
        currentLevel: currentLevel ? String(currentLevel) : null,
        skills: cleanSkills,
        dailyTime: dailyTime ? String(dailyTime) : null,
        isCompleted: true,
        completedAt: new Date(),
      },
      create: {
        userId,
        ageGroup: ageGroup ? String(ageGroup) : null,
        gender: gender ? String(gender) : null,
        goals: cleanGoals,
        currentLevel: currentLevel ? String(currentLevel) : null,
        skills: cleanSkills,
        dailyTime: dailyTime ? String(dailyTime) : null,
        isCompleted: true,
        completedAt: new Date(),
      },
    });

    // Level map (o'quvchi darajasini User jadvalida ham aks ettirish)
    if (currentLevel) {
      let mappedLevel = 'A1';
      if (currentLevel.includes('Noldan') || currentLevel.includes("Boshlang'ich")) mappedLevel = 'A1';
      else if (currentLevel.includes("O'rta")) mappedLevel = 'B1';
      else if (currentLevel.includes('Yaxshi')) mappedLevel = 'B2';

      await prisma.user.update({
        where: { id: userId },
        data: { languageLevel: mappedLevel },
      }).catch(() => {});
    }

    res.json({ success: true, data: onboarding });
  } catch (err) {
    console.error('Onboarding complete error:', err);
    next(err);
  }
});

export default router;
