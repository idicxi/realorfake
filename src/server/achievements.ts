import { prisma } from "@/server/db";

export type UnlockedAchievement = { key: string; title: string; description: string };

export async function awardAchievementsAndListNew(
  userId: string,
): Promise<UnlockedAchievement[]> {
  const stats = await prisma.playerStats.findUnique({
    where: { userId },
    select: { totalRounds: true, correctAnswers: true, winStreak: true, accuracy: true },
  });
  if (!stats) return [];

  const keysToAward: string[] = [];
  if (stats.totalRounds >= 1) keysToAward.push("play_1");
  if (stats.correctAnswers >= 1) keysToAward.push("correct_1");
  if (stats.correctAnswers >= 3) keysToAward.push("correct_3");
  if (stats.correctAnswers >= 10) keysToAward.push("correct_10");
  if (stats.totalRounds >= 5) keysToAward.push("play_5");
  if (stats.totalRounds >= 20) keysToAward.push("play_20");
  if (stats.winStreak >= 3) keysToAward.push("streak_3");
  if (stats.winStreak >= 5) keysToAward.push("streak_5");
  if (stats.totalRounds >= 10 && stats.accuracy >= 50) keysToAward.push("accuracy_50");
  if (stats.totalRounds >= 20 && stats.accuracy >= 80) keysToAward.push("accuracy_80");

  if (keysToAward.length === 0) return [];

  const achievements = await prisma.achievement.findMany({
    where: { key: { in: keysToAward } },
    select: { id: true, key: true, title: true, description: true },
  });

  const existing = await prisma.userAchievement.findMany({
    where: { userId, achievementId: { in: achievements.map((a) => a.id) } },
    select: { achievementId: true },
  });
  const have = new Set(existing.map((e) => e.achievementId));

  const newlyUnlocked: UnlockedAchievement[] = [];

  for (const a of achievements) {
    if (have.has(a.id)) continue;
    await prisma.userAchievement.create({
      data: { userId, achievementId: a.id },
    });
    newlyUnlocked.push({
      key: a.key,
      title: a.title,
      description: a.description,
    });
  }

  return newlyUnlocked;
}
