import { Router } from 'express';
import { requireStudent, requireAdmin } from '../../common/middleware/auth.middleware';
import { requireRoles } from '../../common/middleware/roles.middleware';
import { prisma } from '../../database/prisma';
import { getPaginationParams, buildPaginationMeta } from '../../common/utils/pagination';

const router = Router();

router.get('/', requireStudent, async (req, res, next) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query as any);
    const search = req.query.q as string;
    const level = req.query.level as string;
    const where = {
      isPublished: true,
      ...(level ? { level } : {}),
      ...(search ? { OR: [
        { title: { contains: search, mode: 'insensitive' as const } },
        { description: { contains: search, mode: 'insensitive' as const } },
        { tags: { has: search } },
      ]} : {}),
    };
    const [resources, total] = await Promise.all([
      prisma.libraryResource.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit }),
      prisma.libraryResource.count({ where }),
    ]);
    res.json({ success: true, data: resources, meta: buildPaginationMeta(total, page, limit) });
  } catch (err) { next(err); }
});

// Admin CRUD
router.get('/admin', requireAdmin, requireRoles('CONTENT_ADMIN', 'SUPER_ADMIN'), async (req, res, next) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query as any);
    const [resources, total] = await Promise.all([
      prisma.libraryResource.findMany({ orderBy: { createdAt: 'desc' }, skip, take: limit }),
      prisma.libraryResource.count(),
    ]);
    res.json({ success: true, data: resources, meta: buildPaginationMeta(total, page, limit) });
  } catch (err) { next(err); }
});

router.post('/admin', requireAdmin, requireRoles('CONTENT_ADMIN', 'SUPER_ADMIN'), async (req, res, next) => {
  try {
    const resource = await prisma.libraryResource.create({ data: req.body });
    res.status(201).json({ success: true, data: resource });
  } catch (err) { next(err); }
});

router.patch('/admin/:id', requireAdmin, requireRoles('CONTENT_ADMIN', 'SUPER_ADMIN'), async (req, res, next) => {
  try {
    const resource = await prisma.libraryResource.update({ where: { id: parseInt(req.params.id) }, data: req.body });
    res.json({ success: true, data: resource });
  } catch (err) { next(err); }
});

router.delete('/admin/:id', requireAdmin, requireRoles('CONTENT_ADMIN', 'SUPER_ADMIN'), async (req, res, next) => {
  try {
    await prisma.libraryResource.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true, data: { message: 'Resource deleted' } });
  } catch (err) { next(err); }
});

export default router;
