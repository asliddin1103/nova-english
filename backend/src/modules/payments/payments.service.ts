import { prisma } from '../../database/prisma';
import { Errors } from '../../common/utils/errors';
import { env } from '../../config/env';
import { notifyPaymentApproved, notifyPaymentRejected } from '../notifications/notifications.service';
import { createAuditLog } from '../../common/middleware/audit.middleware';

// Get card info to show to student
export const getCardInfo = () => ({
  cardNumber: env.PAYMENT_CARD_NUMBER,
  cardHolder: env.PAYMENT_CARD_HOLDER,
  instructions: [
    "1. Ko'rsatilgan karta raqamiga pul o'tkazing",
    "2. To'lov chekining rasmini oling",
    "3. Chek rasmini yuklang",
    "4. Admin tekshirib, obunangizni faollashtiradi",
  ],
});

// Student uploads receipt — creates Receipt + pending Payment
export const uploadReceipt = async (userId: number, fileUrl: string, amount: number) => {
  // Check if user has a pending payment already (prevent spam)
  const existingPending = await prisma.payment.findFirst({
    where: { userId, status: 'PENDING' },
  });
  if (existingPending) {
    throw Errors.conflict('Sizda allaqachon tekshirilayotgan to\'lov mavjud. Iltimos, natijani kuting.');
  }

  // Create receipt and linked payment in a transaction
  const result = await prisma.$transaction(async (tx) => {
    const receipt = await tx.receipt.create({
      data: { userId, fileUrl },
    });
    const payment = await tx.payment.create({
      data: {
        userId,
        amount,
        receiptId: receipt.id,
        status: 'PENDING',
        method: 'MANUAL_CARD',
        durationDays: 30,
      },
    });
    return { receipt, payment };
  });

  return result;
};

// Admin approves a payment — activates subscription
export const approvePayment = async (paymentId: number, staffId: number, ipAddress?: string) => {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { user: true },
  });

  if (!payment) throw Errors.notFound('Payment');
  if (payment.status !== 'PENDING') {
    throw Errors.conflict('This payment has already been processed');
  }

  const now = new Date();
  // Extend subscription: if already subscribed, add to expiry; otherwise start from now
  const currentExpiry = payment.user.subscriptionExpiresAt;
  const baseDate = currentExpiry && currentExpiry > now ? currentExpiry : now;
  const newExpiry = new Date(baseDate.getTime() + payment.durationDays * 24 * 60 * 60 * 1000);

  const oldPayment = { ...payment };

  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: paymentId },
      data: {
        status: 'APPROVED',
        approvedById: staffId,
        approvedAt: now,
      },
    });
    await tx.user.update({
      where: { id: payment.userId },
      data: {
        isSubscribed: true,
        subscriptionExpiresAt: newExpiry,
      },
    });
  });

  // Audit log (non-blocking)
  await createAuditLog(staffId, 'APPROVE_PAYMENT', 'Payment', paymentId,
    { status: oldPayment.status },
    { status: 'APPROVED', approvedById: staffId },
    ipAddress
  );

  // Notify student via Telegram bot (non-blocking — failure does not affect response)
  notifyPaymentApproved(payment.user.telegramId, newExpiry).catch(console.error);

  return { message: 'Payment approved and subscription activated', newExpiry };
};

// Admin rejects a payment
export const rejectPayment = async (
  paymentId: number,
  staffId: number,
  reason: string,
  ipAddress?: string
) => {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { user: true },
  });

  if (!payment) throw Errors.notFound('Payment');
  if (payment.status !== 'PENDING') {
    throw Errors.conflict('This payment has already been processed');
  }

  await prisma.payment.update({
    where: { id: paymentId },
    data: {
      status: 'REJECTED',
      approvedById: staffId,
      approvedAt: new Date(),
      rejectedReason: reason,
    },
  });

  await createAuditLog(staffId, 'REJECT_PAYMENT', 'Payment', paymentId,
    { status: 'PENDING' },
    { status: 'REJECTED', reason },
    ipAddress
  );

  notifyPaymentRejected(payment.user.telegramId, reason).catch(console.error);

  return { message: 'Payment rejected' };
};

// Get student own payment history
export const getUserPayments = async (userId: number) => {
  return prisma.payment.findMany({
    where: { userId },
    include: { receipt: true },
    orderBy: { createdAt: 'desc' },
  });
};

// Admin: get all pending payments (with receipt images)
export const getPendingPayments = async () => {
  return prisma.payment.findMany({
    where: { status: 'PENDING' },
    include: {
      user: { select: { id: true, firstName: true, lastName: true, telegramId: true, username: true } },
      receipt: true,
    },
    orderBy: { createdAt: 'asc' }, // Oldest first (FIFO)
  });
};

// Admin: get all payments with pagination
export const getAllPayments = async (skip: number, limit: number, status?: string) => {
  const where = status ? { status: status as any } : {};
  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      include: {
        user: { select: { id: true, firstName: true, lastName: true, username: true } },
        receipt: true,
        approvedBy: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.payment.count({ where }),
  ]);
  return { payments, total };
};
