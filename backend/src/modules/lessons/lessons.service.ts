import { prisma } from '../../database/prisma';
import { Errors } from '../../common/utils/errors';
import { getPaginationParams } from '../../common/utils/pagination';

// Get all published lessons, optionally filtered by level
export const getLessons = async (userId: number, level?: string) => {
  const lessons = await prisma.lesson.findMany({
    where: { isPublished: true, ...(level ? { level } : {}) },
    orderBy: [{ level: 'asc' }, { order: 'asc' }],
    include: {
      progress: { where: { userId }, select: { completedAt: true, watchedSecs: true } },
      _count: { select: { tests: { where: { isPublished: true } } } },
    },
  });
  return lessons.map(lesson => ({
    ...lesson,
    isCompleted: lesson.progress.length > 0,
    progress: lesson.progress[0] ?? null,
  }));
};

export const getLessonById = async (lessonId: number, userId: number) => {
  const lesson = await prisma.lesson.findFirst({
    where: { id: lessonId, isPublished: true },
    include: {
      progress: { where: { userId } },
      dictionary: { take: 10 },
      tests: { where: { isPublished: true }, select: { id: true, title: true, type: true, coinReward: true } },
    },
  });
  if (!lesson) throw Errors.notFound('Lesson');
  return lesson;
};

export const markLessonProgress = async (userId: number, lessonId: number, watchedSecs: number) => {
  const lesson = await prisma.lesson.findFirst({ where: { id: lessonId, isPublished: true } });
  if (!lesson) throw Errors.notFound('Lesson');

  await prisma.lessonProgress.upsert({
    where: { userId_lessonId: { userId, lessonId } },
    update: { watchedSecs, completedAt: new Date() },
    create: { userId, lessonId, watchedSecs },
  });

  // Update streak on lesson activity
  await updateStreak(userId);
};

// Update streak when user has any activity
export const updateStreak = async (userId: number) => {
  const streak = await prisma.streak.findUnique({ where: { userId } });
  if (!streak) return;

  const now = new Date();
  const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const lastActivity = streak.lastActivityAt
    ? new Date(Date.UTC(
        streak.lastActivityAt.getUTCFullYear(),
        streak.lastActivityAt.getUTCMonth(),
        streak.lastActivityAt.getUTCDate()
      ))
    : null;

  if (lastActivity && lastActivity.getTime() === todayUTC.getTime()) {
    // Already logged activity today — no change needed
    return;
  }

  const yesterday = new Date(todayUTC.getTime() - 86400000);
  const isConsecutive = lastActivity && lastActivity.getTime() === yesterday.getTime();

  const newStreak = isConsecutive ? streak.currentStreak + 1 : 1;
  const longestStreak = Math.max(streak.longestStreak, newStreak);

  await prisma.streak.update({
    where: { userId },
    data: { currentStreak: newStreak, longestStreak, lastActivityAt: now },
  });

  // Streak bonus coins
  if (isConsecutive) {
    await awardCoins(userId, 5, 'streak_bonus');
  }
};

export const awardCoins = async (userId: number, amount: number, reason: string) => {
  const coins = await prisma.coins.findUnique({ where: { userId } });
  if (!coins) return;
  await prisma.coins.update({
    where: { userId },
    data: {
      total: { increment: amount },
      transactions: { create: { amount, reason } },
    },
  });
};

// Admin lesson management
export const adminGetLessons = async (skip: number, limit: number) => {
  const [lessons, total] = await Promise.all([
    prisma.lesson.findMany({ orderBy: [{ level: 'asc' }, { order: 'asc' }], skip, take: limit }),
    prisma.lesson.count(),
  ]);
  return { lessons, total };
};

export const adminCreateLesson = async (data: {
  title: string; description?: string; youtubeId: string;
  level: string; order: number; category?: string; thumbnailUrl?: string; durationSecs?: number;
}) => {
  return prisma.lesson.create({ data });
};

export const adminUpdateLesson = async (id: number, data: Partial<{
  title: string; description: string; youtubeId: string; level: string;
  order: number; isPublished: boolean; category: string; thumbnailUrl: string; durationSecs: number;
}>) => {
  const lesson = await prisma.lesson.findUnique({ where: { id } });
  if (!lesson) throw Errors.notFound('Lesson');
  return prisma.lesson.update({ where: { id }, data });
};

export const adminDeleteLesson = async (id: number) => {
  // Soft delete — just unpublish
  const lesson = await prisma.lesson.findUnique({ where: { id } });
  if (!lesson) throw Errors.notFound('Lesson');
  return prisma.lesson.update({ where: { id }, data: { isPublished: false } });
};
