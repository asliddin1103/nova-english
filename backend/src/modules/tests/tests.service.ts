import { prisma } from '../../database/prisma';
import { Errors } from '../../common/utils/errors';
import { awardCoins, updateStreak } from '../lessons/lessons.service';
import { notifySubmissionReviewed } from '../notifications/notifications.service';
import { createAuditLog } from '../../common/middleware/audit.middleware';

// Auto-graded test types
const AUTO_GRADED_TYPES = ['VOCABULARY', 'GRAMMAR', 'IELTS_LISTENING', 'IELTS_READING'];

export const getTests = async (level?: string, type?: string) => {
  return prisma.test.findMany({
    where: {
      isPublished: true,
      ...(level ? { level } : {}),
      ...(type ? { type: type as any } : {}),
    },
    select: {
      id: true, title: true, description: true, type: true,
      level: true, coinReward: true, timeLimit: true,
      _count: { select: { questions: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
};

export const getTestById = async (testId: number, userId: number) => {
  const test = await prisma.test.findFirst({
    where: { id: testId, isPublished: true },
    include: {
      questions: {
        orderBy: { order: 'asc' },
        select: {
          id: true, text: true, type: true,
          options: true, audioUrl: true, imageUrl: true, order: true,
          // Never expose correctAnswer to client
        },
      },
    },
  });
  if (!test) throw Errors.notFound('Test');

  // Check if user has already submitted
  const existingResult = await prisma.testResult.findFirst({
    where: { userId, testId },
    orderBy: { completedAt: 'desc' },
  });

  return { ...test, previousResult: existingResult ?? null };
};

// Submit auto-graded test answers
export const submitAutoTest = async (
  userId: number,
  testId: number,
  answers: { questionId: number; answer: string }[],
  timeTaken?: number
) => {
  const test = await prisma.test.findFirst({ where: { id: testId, isPublished: true } });
  if (!test) throw Errors.notFound('Test');

  if (!AUTO_GRADED_TYPES.includes(test.type)) {
    throw Errors.badRequest('This test requires manual submission. Use /submissions endpoint instead.');
  }

  // Fetch correct answers (server-side only)
  const questions = await prisma.question.findMany({ where: { testId } });

  let correctCount = 0;
  const gradedAnswers = answers.map(({ questionId, answer }) => {
    const question = questions.find(q => q.id === questionId);
    const isCorrect = question?.correctAnswer === answer;
    if (isCorrect) correctCount++;
    return { questionId, givenAnswer: answer, isCorrect };
  });

  const score = questions.length > 0 ? correctCount / questions.length : 0;
  const passed = score >= 0.7;

  // Award coins if passed
  let coinsEarned = 0;
  if (passed) {
    coinsEarned = test.coinReward;
    if (score === 1.0) coinsEarned += 5; // Perfect score bonus
    if (coinsEarned > 0) await awardCoins(userId, coinsEarned, 'test_completed');
  }

  // Save result
  const result = await prisma.testResult.create({
    data: {
      userId, testId, score, coinsEarned, timeTaken,
      answers: { create: gradedAnswers },
    },
  });

  // Update streak
  await updateStreak(userId);

  return { result, score, passed, correctCount, totalQuestions: questions.length, coinsEarned };
};

// Submit speaking/writing (manual review)
export const submitManualTest = async (
  userId: number,
  testId: number,
  type: 'AUDIO' | 'TEXT' | 'FILE',
  content?: string,
  fileUrl?: string
) => {
  const test = await prisma.test.findFirst({ where: { id: testId, isPublished: true } });
  if (!test) throw Errors.notFound('Test');

  if (AUTO_GRADED_TYPES.includes(test.type)) {
    throw Errors.badRequest('This test is auto-graded. Use /tests/:id/submit instead.');
  }

  return prisma.submission.create({
    data: { userId, testId, type, content, fileUrl, status: 'PENDING' },
  });
};

// Get user own submissions
export const getUserSubmissions = async (userId: number) => {
  return prisma.submission.findMany({
    where: { userId },
    include: { test: { select: { title: true, type: true } } },
    orderBy: { submittedAt: 'desc' },
  });
};

// Admin: get pending submissions
export const getPendingSubmissions = async () => {
  return prisma.submission.findMany({
    where: { status: 'PENDING' },
    include: {
      user: { select: { firstName: true, lastName: true, telegramId: true } },
      test: { select: { title: true, type: true } },
    },
    orderBy: { submittedAt: 'asc' },
  });
};

// Teacher reviews a submission
export const reviewSubmission = async (
  submissionId: number,
  staffId: number,
  feedback: string,
  score?: string,
  reject = false
) => {
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: {
      user: { select: { telegramId: true } },
      test: { select: { title: true } },
    },
  });
  if (!submission) throw Errors.notFound('Submission');
  if (submission.status !== 'PENDING') throw Errors.conflict('Submission already reviewed');

  const updated = await prisma.submission.update({
    where: { id: submissionId },
    data: {
      status: reject ? 'REJECTED' : 'REVIEWED',
      feedback, score,
      reviewedById: staffId,
      reviewedAt: new Date(),
    },
  });

  await createAuditLog(staffId, reject ? 'REJECT_SUBMISSION' : 'REVIEW_SUBMISSION', 'Submission', submissionId);

  // Notify student
  notifySubmissionReviewed(submission.user.telegramId, submission.test.title, feedback, score).catch(console.error);

  return updated;
};
