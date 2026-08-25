import { Router } from 'express';
import { requireAdmin } from '../../common/middleware/auth.middleware';
import { requireRoles } from '../../common/middleware/roles.middleware';
import { prisma } from '../../database/prisma';
import { hashPassword } from '../../common/utils/hash';
import { createAuditLog } from '../../common/middleware/audit.middleware';
import { getPaginationParams, buildPaginationMeta } from '../../common/utils/pagination';

const router = Router();

// Dashboard stats
router.get('/dashboard', requireAdmin, async (_req, res, next) => {
  try {
    const [totalUsers, subscribedUsers, totalRevenue, pendingPayments, pendingSubmissions] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isSubscribed: true } }),
      prisma.payment.aggregate({ where: { status: 'APPROVED' }, _sum: { amount: true } }),
      prisma.payment.count({ where: { status: 'PENDING' } }),
      prisma.submission.count({ where: { status: 'PENDING' } }),
    ]);
    const conversionRate = totalUsers > 0 ? Math.round((subscribedUsers / totalUsers) * 100) : 0;
    res.json({ success: true, data: {
      totalUsers, subscribedUsers, conversionRate,
      totalRevenue: totalRevenue._sum.amount ?? 0,
      pendingPayments, pendingSubmissions,
    }});
  } catch (err) { next(err); }
});

// Users list
router.get('/users', requireAdmin, async (req, res, next) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query as any);
    const search = req.query.q as string;
    const where = search ? {
      OR: [
        { firstName: { contains: search, mode: 'insensitive' as const } },
        { username: { contains: search, mode: 'insensitive' as const } },
        { telegramId: { contains: search } },
      ]
    } : {};
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: { coins: true, streak: true, _count: { select: { payments: true } } },
        orderBy: { createdAt: 'desc' },
        skip, take: limit,
      }),
      prisma.user.count({ where }),
    ]);
    res.json({ success: true, data: users, meta: buildPaginationMeta(total, page, limit) });
  } catch (err) { next(err); }
});

router.get('/users/:id', requireAdmin, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        payments: { include: { receipt: true }, orderBy: { createdAt: 'desc' } },
        progress: { include: { lesson: { select: { title: true } } }, orderBy: { completedAt: 'desc' }, take: 20 },
        submissions: { include: { test: { select: { title: true } } }, orderBy: { submittedAt: 'desc' } },
        coins: true, streak: true,
      },
    });
    if (!user) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'User not found' } }); return; }
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
});

// Staff management (SUPER_ADMIN only)
router.get('/staff', requireAdmin, requireRoles('SUPER_ADMIN'), async (_req, res, next) => {
  try {
    const staff = await prisma.staffAccount.findMany({
      select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
    });
    res.json({ success: true, data: staff });
  } catch (err) { next(err); }
});

router.post('/staff', requireAdmin, requireRoles('SUPER_ADMIN'), async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    const hashed = await hashPassword(password);
    const staff = await prisma.staffAccount.create({
      data: { name, email, password: hashed, role },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });
    await createAuditLog(req.admin!.staffId, 'CREATE_STAFF', 'StaffAccount', staff.id, undefined, { email, role }, req.ip);
    res.status(201).json({ success: true, data: staff });
  } catch (err) { next(err); }
});

router.patch('/staff/:id', requireAdmin, requireRoles('SUPER_ADMIN'), async (req, res, next) => {
  try {
    const { role, isActive, name } = req.body;
    const old = await prisma.staffAccount.findUnique({ where: { id: parseInt(req.params.id) } });
    const staff = await prisma.staffAccount.update({
      where: { id: parseInt(req.params.id) },
      data: { ...(role && { role }), ...(isActive !== undefined && { isActive }), ...(name && { name }) },
      select: { id: true, name: true, email: true, role: true, isActive: true },
    });
    await createAuditLog(req.admin!.staffId, 'UPDATE_STAFF', 'StaffAccount', staff.id, old ?? undefined, req.body, req.ip);
    res.json({ success: true, data: staff });
  } catch (err) { next(err); }
});

// Audit logs
router.get('/audit-logs', requireAdmin, requireRoles('SUPER_ADMIN'), async (req, res, next) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query as any);
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        include: { staff: { select: { name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        skip, take: limit,
      }),
      prisma.auditLog.count(),
    ]);
    res.json({ success: true, data: logs, meta: buildPaginationMeta(total, page, limit) });
  } catch (err) { next(err); }
});

// Stats
router.get('/stats', requireAdmin, requireRoles('FINANCE_ADMIN', 'SUPER_ADMIN'), async (_req, res, next) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [revenueByDay, newUsersByDay, totalByLevel] = await Promise.all([
      prisma.payment.groupBy({
        by: ['createdAt'], where: { status: 'APPROVED', createdAt: { gte: thirtyDaysAgo } },
        _sum: { amount: true },
      }),
      prisma.user.groupBy({
        by: ['createdAt'], where: { createdAt: { gte: thirtyDaysAgo } },
        _count: { id: true },
      }),
      prisma.user.groupBy({ by: ['languageLevel'], _count: { id: true } }),
    ]);
    res.json({ success: true, data: { revenueByDay, newUsersByDay, totalByLevel } });
  } catch (err) { next(err); }
});

export default router;
