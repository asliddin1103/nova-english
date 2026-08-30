import { prisma } from '../../database/prisma';
import { validateTelegramInitData } from './telegram.validator';
import { signStudentToken, signAdminToken } from '../../common/utils/jwt';
import { comparePassword } from '../../common/utils/hash';
import { Errors } from '../../common/utils/errors';

export const devLogin = async (telegramId = "123456789", firstName = "Student", lastName = "Test", username = "novastudent") => {
  const dbUser = await prisma.user.upsert({
    where: { telegramId: String(telegramId) },
    update: {
      firstName,
      lastName,
      username,
    },
    create: {
      telegramId: String(telegramId),
      firstName,
      lastName,
      username,
      languageLevel: "A1",
      isSubscribed: true,
      subscriptionExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days active for dev
      streak: { create: { currentStreak: 5, longestStreak: 12, lastActivityAt: new Date() } },
      coins: { create: { total: 250 } },
    },
    include: {
      streak: true,
      coins: true,
      onboarding: true,
    },
  });

  const token = signStudentToken({
    userId: dbUser.id,
    telegramId: dbUser.telegramId,
  });

  return { token, user: dbUser };
};

export const authWithTelegram = async (initData: string) => {
  // Support dev testing fallback
  if (process.env.NODE_ENV !== 'production' && initData === 'mock_init_data') {
    return devLogin();
  }

  // 1. Validate and parse initData
  const { user } = validateTelegramInitData(initData);


  // 2. Upsert user record (creates on first visit, updates on subsequent)
  const dbUser = await prisma.user.upsert({
    where: { telegramId: String(user.id) },
    update: {
      firstName: user.first_name,
      lastName: user.last_name ?? null,
      username: user.username ?? null,
      photoUrl: user.photo_url ?? null,
    },
    create: {
      telegramId: String(user.id),
      firstName: user.first_name,
      lastName: user.last_name ?? null,
      username: user.username ?? null,
      photoUrl: user.photo_url ?? null,
      // Initialize gamification records
      streak: { create: {} },
      coins: { create: { total: 0 } },
    },
    include: {
      streak: true,
      coins: true,
      onboarding: true,
    },
  });

  // 3. Issue JWT
  const token = signStudentToken({
    userId: dbUser.id,
    telegramId: dbUser.telegramId,
  });

  return { token, user: dbUser };
};

export const loginAdmin = async (email: string, password: string) => {
  const staff = await prisma.staffAccount.findUnique({ where: { email } });

  if (!staff || !staff.isActive) {
    // Generic message — don't reveal whether email exists
    throw Errors.unauthorized('Invalid email or password');
  }

  const isValid = await comparePassword(password, staff.password);
  if (!isValid) {
    throw Errors.unauthorized('Invalid email or password');
  }

  const token = signAdminToken({
    staffId: staff.id,
    email: staff.email,
    role: staff.role,
  });

  return {
    token,
    staff: {
      id: staff.id,
      name: staff.name,
      email: staff.email,
      role: staff.role,
    },
  };
};
