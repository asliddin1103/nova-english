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
      ...(level ? { level } : {}),
      ...(search ? { OR: [
        { word: { contains: search, mode: 'insensitive' as const } },
        { translation: { contains: search, mode: 'insensitive' as const } },
      ]} : {}),
    };
    const [words, total] = await Promise.all([
      prisma.dictionaryWord.findMany({ where, orderBy: { word: 'asc' }, skip, take: limit }),
      prisma.dictionaryWord.count({ where }),
    ]);
    res.json({ success: true, data: words, meta: buildPaginationMeta(total, page, limit) });
  } catch (err) { next(err); }
});

router.post('/admin', requireAdmin, requireRoles('CONTENT_ADMIN', 'SUPER_ADMIN'), async (req, res, next) => {
  try {
    const word = await prisma.dictionaryWord.create({ data: req.body });
    res.status(201).json({ success: true, data: word });
  } catch (err) { next(err); }
});

router.patch('/admin/:id', requireAdmin, requireRoles('CONTENT_ADMIN', 'SUPER_ADMIN'), async (req, res, next) => {
  try {
    const word = await prisma.dictionaryWord.update({ where: { id: parseInt(String(req.params.id)) }, data: req.body });
    res.json({ success: true, data: word });
  } catch (err) { next(err); }
});

router.delete('/admin/:id', requireAdmin, requireRoles('CONTENT_ADMIN', 'SUPER_ADMIN'), async (req, res, next) => {
  try {
    await prisma.dictionaryWord.delete({ where: { id: parseInt(String(req.params.id)) } });
    res.json({ success: true, data: { message: 'Word deleted' } });
  } catch (err) { next(err); }
});

export default router;
