import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/server/auth";
import { prisma } from "@/server/db";
import { awardAchievementsAndListNew } from "@/server/achievements";

const bodySchema = z.object({
  sessionId: z.string().min(1),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Некорректный запрос." }, { status: 400 });
  }

  const game = await prisma.gameSession.findUnique({
    where: { id: parsed.data.sessionId },
    select: { id: true, userId: true, current: true, total: true, finishedAt: true },
  });

  if (!game || game.finishedAt) {
    return NextResponse.json({ ok: false, error: "Сессия не найдена." }, { status: 404 });
  }

  if (session?.user?.id && game.userId && game.userId !== session.user.id) {
    return NextResponse.json({ ok: false, error: "Нельзя завершить чужую сессию." }, { status: 403 });
  }

  const rounds = await prisma.gameRound.findMany({
    where: { sessionId: game.id, index: { gte: game.current } },
    orderBy: { index: "asc" },
    select: { index: true, answer: true },
  });

  let abandoned = 0;
  for (const r of rounds) {
    if (r.answer !== null && r.answer !== undefined) continue;
    await prisma.gameRound.update({
      where: { sessionId_index: { sessionId: game.id, index: r.index } },
      data: { answer: null, isCorrect: false, crowdShown: true },
    });
    abandoned += 1;
  }

  await prisma.gameSession.update({
    where: { id: game.id },
    data: {
      finishedAt: new Date(),
      current: game.total,
      hintsUsed: 0,
    },
  });

  let newAchievements: Awaited<ReturnType<typeof awardAchievementsAndListNew>> = [];
  if (game.userId && abandoned > 0) {
    await prisma.playerStats.upsert({
      where: { userId: game.userId },
      update: {
        totalRounds: { increment: abandoned },
        winStreak: { set: 0 },
      },
      create: {
        userId: game.userId,
        totalRounds: abandoned,
        correctAnswers: 0,
        winStreak: 0,
        accuracy: 0,
      },
    });

    const s = await prisma.playerStats.findUnique({
      where: { userId: game.userId },
      select: { totalRounds: true, correctAnswers: true },
    });
    if (s) {
      const accuracy = s.totalRounds === 0 ? 0 : (s.correctAnswers / s.totalRounds) * 100;
      await prisma.playerStats.update({
        where: { userId: game.userId },
        data: { accuracy },
      });
    }

    newAchievements = await awardAchievementsAndListNew(game.userId);
  }

  return NextResponse.json({ ok: true, abandoned, newAchievements: newAchievements ?? [] });
}
