import { prisma } from '../../database/prisma';

export const getMyGamification = async (userId: number) => {
  const [coins, streak] = await Promise.all([
    prisma.coins.findUnique({
      where: { userId },
      include: { transactions: { orderBy: { createdAt: 'desc' }, take: 10 } },
    }),
    prisma.streak.findUnique({ where: { userId } }),
  ]);
  return { coins, streak };
};

export const getLeaderboard = async (userId: number) => {
  // Top 20 by total coins
  const top20 = await prisma.coins.findMany({
    orderBy: { total: 'desc' },
    take: 20,
    include: {
      user: { select: { firstName: true, lastName: true, username: true, photoUrl: true } },
    },
  });

  // Find user rank (even if outside top 20)
  const userRank = await prisma.coins.count({ where: { total: { gt: (await prisma.coins.findUnique({ where: { userId } }))?.total ?? 0 } } });

  return {
    top20: top20.map((c, i) => ({ rank: i + 1, ...c })),
    myRank: userRank + 1,
  };
};
