import { Router } from 'express';
import { requireStudent } from '../../common/middleware/auth.middleware';
import { prisma } from '../../database/prisma';

const router = Router();

// GET /api/v1/onboarding/status
// Foydalanuvchi onboarding holatini qaytaradi
router.get('/status', requireStudent, async (req, res, next) => {
  try {
    const userId = req.student!.userId;
    const [user, onboarding] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { onboardingCompleted: true } }),
      prisma.userOnboarding.findUnique({ where: { userId } }),
    ]);

    const isCompleted = Boolean(user?.onboardingCompleted || onboarding?.isCompleted);

    res.json({
      success: true,
      data: {
        hasOnboarding: !!onboarding,
        isCompleted,
        // Partial data — foydalanuvchi davom ettirishi uchun
        partial: onboarding && !isCompleted ? {
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
    const validGenders = ['Erkak', 'Ayol'];
    const sanitizedGender = validGenders.includes(gender) ? gender : null;
    const cleanGoals = Array.isArray(goals) ? goals : [];
    const cleanSkills = Array.isArray(skills) ? skills : [];

    // 1. Foydalanuvchini onboardingCompleted = true qilib belgilash va darajasini yangilash
    let mappedLevel = 'A1';
    if (currentLevel) {
      if (currentLevel.includes('Noldan') || currentLevel.includes("Boshlang'ich")) mappedLevel = 'A1';
      else if (currentLevel.includes("O'rta")) mappedLevel = 'B1';
      else if (currentLevel.includes('Yaxshi')) mappedLevel = 'B2';
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        onboardingCompleted: true,
        botStatus: 'member',
        ...(currentLevel && { languageLevel: mappedLevel }),
      },
    });

    // 2. Tarixiy jadvalga yangi submission yozish (har bir urinish saqlanib qoladi)
    await prisma.onboardingSubmission.create({
      data: {
        userId,
        ageGroup: ageGroup ? String(ageGroup) : null,
        gender: sanitizedGender,
        goals: cleanGoals,
        currentLevel: currentLevel ? String(currentLevel) : null,
        skills: cleanSkills,
        dailyTime: dailyTime ? String(dailyTime) : null,
        submittedAt: new Date(),
      },
    }).catch((err) => {
      console.error('Error creating historical OnboardingSubmission:', err);
    });

    // 3. Joriy (eng so'nggi) onboarding ma'lumotlarini UserOnboarding jadvalida saqlash
    const onboarding = await prisma.userOnboarding.upsert({
      where: { userId },
      update: {
        ageGroup: ageGroup ? String(ageGroup) : null,
        gender: sanitizedGender,
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
        gender: sanitizedGender,
        goals: cleanGoals,
        currentLevel: currentLevel ? String(currentLevel) : null,
        skills: cleanSkills,
        dailyTime: dailyTime ? String(dailyTime) : null,
        isCompleted: true,
        completedAt: new Date(),
      },
    }).catch(() => null);

    res.json({ success: true, data: onboarding });
  } catch (err) {
    console.error('Onboarding complete error:', err);
    next(err);
  }
});

// POST /api/v1/onboarding/skip
// O'tkazib yuborish — keyingi safar qayta ko'rsatilmasligi uchun onboardingCompleted = true
router.post('/skip', requireStudent, async (req, res, next) => {
  try {
    const userId = req.student!.userId;
    await prisma.user.update({
      where: { id: userId },
      data: { onboardingCompleted: true },
    }).catch(() => {});

    res.json({ success: true, message: 'Onboarding skipped' });
  } catch (err) { next(err); }
});

export default router;
