import { prisma } from "./prisma";

const WASHOKU_TYPES = ["和食", "寿司", "焼鳥", "割烹", "懐石", "天ぷら", "うなぎ"];
const SETTAI_SCENES = ["接待", "クロージング"];

async function checkAndAwardBadges(userId: string) {
  const [reviewCount, washokuCount, settaiCount] = await Promise.all([
    prisma.publicReview.count({ where: { userId } }),
    prisma.publicReview.count({
      where: { userId, venue: { cuisineType: { in: WASHOKU_TYPES } } },
    }),
    prisma.publicReview.count({
      where: { userId, businessScene: { in: SETTAI_SCENES } },
    }),
  ]);

  const earned: string[] = [];
  if (reviewCount >= 10) earned.push("kaishoku_master");
  if (washokuCount >= 5) earned.push("washoku_expert");
  if (settaiCount >= 5) earned.push("settai_master");

  for (const badgeType of earned) {
    await prisma.userBadge.upsert({
      where: { userId_badgeType: { userId, badgeType } },
      create: { userId, badgeType },
      update: {},
    });
  }
}

export async function addPoints(userId: string, points: number, reason: string, relatedId?: string) {
  await prisma.$transaction(async (tx) => {
    const existing = await tx.userPoint.findUnique({ where: { userId } });
    if (existing) {
      await tx.userPoint.update({
        where: { userId },
        data: {
          points: existing.points + points,
          totalEarned: points > 0 ? existing.totalEarned + points : existing.totalEarned,
        },
      });
    } else {
      await tx.userPoint.create({
        data: {
          userId,
          points: Math.max(0, points),
          totalEarned: Math.max(0, points),
        },
      });
    }
    await tx.pointHistory.create({
      data: { userId, points, reason, relatedId: relatedId ?? null },
    });
  });

  await checkAndAwardBadges(userId);
}
