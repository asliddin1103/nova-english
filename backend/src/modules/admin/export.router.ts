import { Router, Request, Response, NextFunction } from 'express';
import { requireAdmin } from '../../common/middleware/auth.middleware';
import { prisma } from '../../database/prisma';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

const router = Router();

// ─────────────────────────────────────────────────────────
// Helper: novada brand rang
// ─────────────────────────────────────────────────────────
const BRAND_BLUE = '1A73E8';
const BRAND_DARK = '0A1628';
const BRAND_YELLOW = 'FFC107';

// ─────────────────────────────────────────────────────────
// GET /api/v1/admin/export/users?q=&isSubscribed=
// Foydalanuvchilar ro'yxatini Excel (.xlsx) sifatida export qilish
// ─────────────────────────────────────────────────────────
router.get('/users', requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const search = (req.query.q as string) || '';
    const isSubscribedFilter = req.query.isSubscribed as string;

    // Filter qurilish
    const where: any = {};
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } },
        { telegramId: { contains: search } },
      ];
    }
    if (isSubscribedFilter === 'true') where.isSubscribed = true;
    if (isSubscribedFilter === 'false') where.isSubscribed = false;

    // Barcha foydalanuvchilarni olish (pagination yo'q — export uchun)
    const users = await prisma.user.findMany({
      where,
      include: {
        coins: true,
        streak: true,
        onboarding: true,
        _count: { select: { progress: true, payments: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // ExcelJS workbook yaratish
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Nova English Admin';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Foydalanuvchilar', {
      pageSetup: { paperSize: 9, orientation: 'landscape' },
    });

    // Sarlavha (merged cells)
    sheet.mergeCells('A1:O1');
    const titleRow = sheet.getRow(1);
    titleRow.getCell(1).value = `Nova English — Foydalanuvchilar Ro'yxati (${new Date().toLocaleDateString('uz-UZ')})`;
    titleRow.getCell(1).font = { bold: true, size: 14, color: { argb: 'FF' + BRAND_DARK } };
    titleRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + BRAND_YELLOW } };
    titleRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
    titleRow.height = 28;

    // Ustun sarlavhalari
    const headers = [
      { header: 'ID', key: 'id', width: 8 },
      { header: 'Ism', key: 'firstName', width: 16 },
      { header: 'Familiya', key: 'lastName', width: 16 },
      { header: 'Telegram Username', key: 'username', width: 20 },
      { header: 'Telegram ID', key: 'telegramId', width: 16 },
      { header: "Ro'yxatdan o'tgan sana", key: 'createdAt', width: 22 },
      { header: 'Obuna', key: 'isSubscribed', width: 10 },
      { header: 'Daraja', key: 'languageLevel', width: 10 },
      { header: 'Yosh guruhi', key: 'ageGroup', width: 14 },
      { header: 'Jins', key: 'gender', width: 14 },
      { header: 'Maqsad', key: 'goals', width: 40 },
      { header: "Hozirgi daraja (o'z bahosi)", key: 'currentLevel', width: 22 },
      { header: "Ko'nikmalar", key: 'skills', width: 50 },
      { header: 'Kunlik vaqt', key: 'dailyTime', width: 16 },
      { header: "Tugallangan darslar", key: 'lessonsCount', width: 20 },
    ];

    sheet.columns = headers;

    // Ustun sarlavhasi (2-qator)
    const headerRow = sheet.getRow(2);
    headers.forEach((h, idx) => {
      const cell = headerRow.getCell(idx + 1);
      cell.value = h.header;
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + BRAND_BLUE } };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE0E0E0' } },
        bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } },
        left: { style: 'thin', color: { argb: 'FFE0E0E0' } },
        right: { style: 'thin', color: { argb: 'FFE0E0E0' } },
      };
    });
    headerRow.height = 36;

    // Ma'lumotlar
    users.forEach((u, rowIdx) => {
      const row = sheet.addRow({
        id: u.id,
        firstName: u.firstName,
        lastName: u.lastName ?? '',
        username: u.username ? `@${u.username}` : '',
        telegramId: u.telegramId,
        createdAt: new Date(u.createdAt).toLocaleString('uz-UZ'),
        isSubscribed: u.isSubscribed ? 'Ha ✓' : "Yo'q",
        languageLevel: u.languageLevel,
        ageGroup: u.onboarding?.ageGroup ?? '',
        gender: u.onboarding?.gender ?? '',
        goals: u.onboarding?.goals?.join(', ') ?? '',
        currentLevel: u.onboarding?.currentLevel ?? '',
        skills: u.onboarding?.skills?.join(', ') ?? '',
        dailyTime: u.onboarding?.dailyTime ?? '',
        lessonsCount: u._count.progress,
      });

      // Qatorlar rangi alternativa
      const bgColor = rowIdx % 2 === 0 ? 'FFFFFFFF' : 'FFF8FAFF';
      row.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
        cell.border = {
          top: { style: 'hair', color: { argb: 'FFE8E8E8' } },
          bottom: { style: 'hair', color: { argb: 'FFE8E8E8' } },
          left: { style: 'hair', color: { argb: 'FFE8E8E8' } },
          right: { style: 'hair', color: { argb: 'FFE8E8E8' } },
        };
        cell.alignment = { vertical: 'middle', wrapText: false };
      });

      // Obuna ustuniga rang
      const subCell = row.getCell(7);
      if (u.isSubscribed) {
        subCell.font = { color: { argb: 'FF059669' }, bold: true };
      }
    });

    // Freeze top 2 rows
    sheet.views = [{ state: 'frozen', ySplit: 2, activeCell: 'A3' }];

    // Auto filter
    sheet.autoFilter = { from: { row: 2, column: 1 }, to: { row: 2, column: headers.length } };

    // HTTP response headers
    const filename = `nova-users-${Date.now()}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────
// GET /api/v1/admin/export/payments?status=&dateFrom=&dateTo=
// To'lovlar tarixini Excel sifatida export qilish
// ─────────────────────────────────────────────────────────
router.get('/payments', requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const statusFilter = req.query.status as string;
    const dateFrom = req.query.dateFrom as string;
    const dateTo = req.query.dateTo as string;

    const where: any = {};
    if (statusFilter && ['PENDING', 'APPROVED', 'REJECTED'].includes(statusFilter)) {
      where.status = statusFilter;
    }
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo + 'T23:59:59.999Z');
    }

    const payments = await prisma.payment.findMany({
      where,
      include: {
        user: { select: { firstName: true, lastName: true, username: true, telegramId: true } },
        approvedBy: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Nova English Admin';

    const sheet = workbook.addWorksheet("To'lovlar", {
      pageSetup: { paperSize: 9, orientation: 'landscape' },
    });

    // Sarlavha
    sheet.mergeCells('A1:H1');
    const titleRow = sheet.getRow(1);
    titleRow.getCell(1).value = `Nova English — To'lovlar Tarixi (${new Date().toLocaleDateString('uz-UZ')})`;
    titleRow.getCell(1).font = { bold: true, size: 14, color: { argb: 'FF' + BRAND_DARK } };
    titleRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + BRAND_YELLOW } };
    titleRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
    titleRow.height = 28;

    const headers = [
      { header: 'ID', key: 'id', width: 8 },
      { header: 'Sana', key: 'createdAt', width: 22 },
      { header: 'Foydalanuvchi', key: 'user', width: 24 },
      { header: 'Telegram Username', key: 'username', width: 20 },
      { header: "Summa (so'm)", key: 'amount', width: 16 },
      { header: 'Status', key: 'status', width: 14 },
      { header: "To'lov usuli", key: 'method', width: 16 },
      { header: 'Tasdiqlagan', key: 'approvedBy', width: 18 },
    ];

    sheet.columns = headers;

    const headerRow = sheet.getRow(2);
    headers.forEach((h, idx) => {
      const cell = headerRow.getCell(idx + 1);
      cell.value = h.header;
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + BRAND_BLUE } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE0E0E0' } },
        bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } },
        left: { style: 'thin', color: { argb: 'FFE0E0E0' } },
        right: { style: 'thin', color: { argb: 'FFE0E0E0' } },
      };
    });
    headerRow.height = 36;

    const STATUS_LABELS: Record<string, string> = {
      PENDING: "Kutilmoqda",
      APPROVED: "Tasdiqlandi",
      REJECTED: "Rad etildi",
    };

    const METHOD_LABELS: Record<string, string> = {
      MANUAL_CARD: "Karta (manual)",
      PAYME: "Payme",
      CLICK: "Click",
      UZUMBANK: "Uzum Bank",
    };

    payments.forEach((p, rowIdx) => {
      const row = sheet.addRow({
        id: p.id,
        createdAt: new Date(p.createdAt).toLocaleString('uz-UZ'),
        user: `${p.user.firstName} ${p.user.lastName ?? ''}`.trim(),
        username: p.user.username ? `@${p.user.username}` : p.user.telegramId,
        amount: p.amount,
        status: STATUS_LABELS[p.status] ?? p.status,
        method: METHOD_LABELS[p.method] ?? p.method,
        approvedBy: p.approvedBy?.name ?? '',
      });

      const bgColor = rowIdx % 2 === 0 ? 'FFFFFFFF' : 'FFF8FAFF';
      row.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
        cell.border = {
          top: { style: 'hair', color: { argb: 'FFE8E8E8' } },
          bottom: { style: 'hair', color: { argb: 'FFE8E8E8' } },
          left: { style: 'hair', color: { argb: 'FFE8E8E8' } },
          right: { style: 'hair', color: { argb: 'FFE8E8E8' } },
        };
        cell.alignment = { vertical: 'middle' };
      });

      // Status rangi
      const statusCell = row.getCell(6);
      if (p.status === 'APPROVED') statusCell.font = { color: { argb: 'FF059669' }, bold: true };
      if (p.status === 'REJECTED') statusCell.font = { color: { argb: 'FFDC2626' }, bold: true };
      if (p.status === 'PENDING') statusCell.font = { color: { argb: 'FFD97706' }, bold: true };

      // Summa formati
      const amountCell = row.getCell(5);
      amountCell.numFmt = '#,##0';
      amountCell.alignment = { horizontal: 'right', vertical: 'middle' };
    });

    // Jami summa
    const totalRow = sheet.addRow({
      id: '', createdAt: '', user: '', username: 'JAMI:',
      amount: payments.filter(p => p.status === 'APPROVED').reduce((s, p) => s + p.amount, 0),
      status: '', method: '', approvedBy: '',
    });
    totalRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F5E9' } };
      cell.font = { bold: true };
    });
    const totalAmountCell = totalRow.getCell(5);
    totalAmountCell.numFmt = '#,##0';
    totalAmountCell.font = { bold: true, color: { argb: 'FF059669' } };
    totalAmountCell.alignment = { horizontal: 'right', vertical: 'middle' };

    sheet.views = [{ state: 'frozen', ySplit: 2, activeCell: 'A3' }];
    sheet.autoFilter = { from: { row: 2, column: 1 }, to: { row: 2, column: headers.length } };

    const filename = `nova-payments-${Date.now()}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────
// GET /api/v1/admin/export/report
// Statistika va onboarding xulosasi — PDF hisobot
// ─────────────────────────────────────────────────────────
router.get('/report', requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Barcha statistikalarni parallel olish
    const [
      totalUsers,
      subscribedUsers,
      newUsersLast30,
      totalRevenue,
      allOnboardings,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isSubscribed: true } }),
      prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.payment.aggregate({ where: { status: 'APPROVED' }, _sum: { amount: true } }),
      prisma.userOnboarding.findMany({ where: { isCompleted: true } }),
    ]);

    const completedOnboardings = allOnboardings.length;

    // Onboarding statistikasi hisoblash
    const countItems = (arr: string[][], separator?: boolean) => {
      const counts: Record<string, number> = {};
      arr.flat().forEach(item => {
        if (item) counts[item] = (counts[item] || 0) + 1;
      });
      return Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .map(([label, count]) => ({ label, count, pct: completedOnboardings > 0 ? Math.round((count / completedOnboardings) * 100) : 0 }));
    };

    const ageStats = countItems(allOnboardings.map(o => [o.ageGroup ?? '']));
    const genderStats = countItems(allOnboardings.map(o => [o.gender ?? '']));
    const goalStats = countItems(allOnboardings.map(o => o.goals));
    const levelStats = countItems(allOnboardings.map(o => [o.currentLevel ?? '']));
    const skillStats = countItems(allOnboardings.map(o => o.skills));
    const timeStats = countItems(allOnboardings.map(o => [o.dailyTime ?? '']));

    // ── PDFKit document
    const doc = new PDFDocument({ size: 'A4', margin: 50, info: { Title: 'Nova English Hisobot' } });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="nova-report-${Date.now()}.pdf"`);
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');

    doc.pipe(res);

    // ── HELPER FUNCTIONS
    const drawBar = (label: string, count: number, pct: number, x: number, y: number, width: number) => {
      const BAR_MAX = width - 160;
      const barWidth = Math.max(4, Math.round((pct / 100) * BAR_MAX));

      doc.fontSize(9).fillColor('#334155').text(label, x, y, { width: 130, ellipsis: true });
      // Background
      doc.roundedRect(x + 140, y - 1, BAR_MAX, 14, 4).fill('#EFF6FF');
      // Fill
      doc.roundedRect(x + 140, y - 1, barWidth, 14, 4).fill('#1A73E8');
      // Percentage text
      doc.fontSize(8).fillColor('#FFFFFF');
      if (barWidth > 30) {
        doc.text(`${pct}%`, x + 143, y + 2, { width: barWidth - 6, align: 'right' });
      }
      doc.fontSize(8).fillColor('#64748B').text(`${count}`, x + 140 + BAR_MAX + 6, y + 1);
    };

    const sectionTitle = (title: string) => {
      const y = doc.y + 14;
      doc.rect(50, y, 495, 24).fill('#1A73E8');
      doc.fontSize(11).fillColor('#FFFFFF').font('Helvetica-Bold')
        .text(title, 58, y + 6, { width: 479 });
      doc.font('Helvetica').fillColor('#334155');
      doc.y = y + 34;
    };

    const statBox = (label: string, value: string, x: number, y: number, w: number, h: number, color: string) => {
      doc.roundedRect(x, y, w, h, 8).fill(color);
      doc.fontSize(22).fillColor('#FFFFFF').font('Helvetica-Bold').text(value, x, y + 12, { width: w, align: 'center' });
      doc.fontSize(8).fillColor('#FFFFFFCC').font('Helvetica').text(label, x, y + h - 22, { width: w, align: 'center' });
    };

    // ── COVER / HEADER
    doc.rect(0, 0, 595, 90).fill('#0A1628');
    doc.fontSize(22).fillColor('#FFFFFF').font('Helvetica-Bold').text('NOVA', 50, 28);
    doc.fillColor('#FFC107').text(' ENGLISH', 50 + doc.widthOfString('NOVA'), 28);
    doc.fillColor('#94A3B8').fontSize(10).font('Helvetica').text('Boshqaruv Paneli — Statistika Hisoboti', 50, 58);
    doc.fillColor('#64748B').fontSize(9).text(`Sana: ${new Date().toLocaleDateString('uz-UZ')} | Admin tomonidan generatsiya qilindi`, 50, 72);
    doc.y = 110;

    // ── KO'RSATKICHLAR (stat boxes)
    sectionTitle("Umumiy Ko'rsatkichlar");
    const conversionRate = totalUsers > 0 ? Math.round((subscribedUsers / totalUsers) * 100) : 0;
    const statsY = doc.y;
    statBox('Jami foydalanuvchilar', totalUsers.toString(), 50, statsY, 110, 64, '#1A73E8');
    statBox('Aktiv obunalar', subscribedUsers.toString(), 172, statsY, 110, 64, '#059669');
    statBox('Yangi (30 kun)', newUsersLast30.toString(), 294, statsY, 110, 64, '#7C3AED');
    statBox('Konversiya', `${conversionRate}%`, 416, statsY, 110, 64, '#D97706');
    doc.y = statsY + 74;

    // Daromad
    const revenue = totalRevenue._sum.amount ?? 0;
    doc.roundedRect(50, doc.y, 495, 36, 8).fill('#F0FDF4');
    doc.fontSize(11).fillColor('#059669').font('Helvetica-Bold')
      .text(`Jami tasdiqlangan daromad: ${revenue.toLocaleString('uz-UZ')} so'm`, 60, doc.y + 10, { width: 475, align: 'center' });
    doc.y += 46;

    // ── ONBOARDING SO'ROVNOMA XULOSASI
    if (completedOnboardings === 0) {
      doc.y += 10;
      doc.roundedRect(50, doc.y, 495, 40, 8).fill('#FFF7ED');
      doc.fontSize(11).fillColor('#92400E').font('Helvetica')
        .text('Hali hech bir foydalanuvchi onboarding so\'rovnomasini to\'ldirmagan.', 60, doc.y + 12, { width: 475, align: 'center' });
      doc.y += 50;
    } else {
      doc.y += 8;
      sectionTitle(`Onboarding So'rovnoma Xulosasi (${completedOnboardings} ta ishtirokchi)`);

      const CHART_X = 50;
      const CHART_W = 495;

      const renderSection = (title: string, stats: { label: string; count: number; pct: number }[]) => {
        if (doc.y > 680) { doc.addPage(); doc.y = 50; }
        doc.fontSize(9).fillColor('#64748B').font('Helvetica-Bold').text(title, CHART_X, doc.y);
        doc.y += 12;
        stats.filter(s => s.label).slice(0, 8).forEach(s => {
          if (doc.y > 720) { doc.addPage(); doc.y = 50; }
          drawBar(s.label, s.count, s.pct, CHART_X, doc.y, CHART_W);
          doc.y += 20;
        });
        doc.y += 8;
      };

      renderSection('Yosh Guruhlar', ageStats);
      renderSection('Jins', genderStats);
      renderSection('O\'rganish Maqsadlari', goalStats);
      renderSection('Hozirgi Daraja (o\'z bahosi)', levelStats);
      renderSection('Rivojlantirmoqchi bo\'lgan Ko\'nikmalar', skillStats);
      renderSection('Kuniga Ajratiladigan Vaqt', timeStats);
    }

    // ── FOOTER (har bir sahifaga)
    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);
      doc.rect(0, 800, 595, 42).fill('#0A1628');
      doc.fontSize(8).fillColor('#94A3B8').font('Helvetica')
        .text(`Nova English Admin Panel — Maxfiy hujjat`, 50, 814)
        .text(`${i + 1} / ${pages.count}`, 50, 814, { width: 495, align: 'right' });
    }

    doc.end();
  } catch (err) { next(err); }
});

export default router;
