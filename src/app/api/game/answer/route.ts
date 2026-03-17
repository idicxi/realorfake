import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/server/db";

const answerSchema = z.object({
  sessionId: z.string().min(1),
  answer: z.boolean().nullable(),
});

async function awardAchievements(userId: string) {
  const stats = await prisma.playerStats.findUnique({
    where: { userId },
    select: { totalRounds: true, correctAnswers: true, winStreak: true },
  });
  if (!stats) return;

  const toAward: string[] = [];
  if (stats.correctAnswers >= 1) toAward.push("first_win");
  if (stats.winStreak >= 5) toAward.push("streak_5");
  if (stats.totalRounds >= 10) toAward.push("truth_seeker");

  if (toAward.length === 0) return;

  const achievements = await prisma.achievement.findMany({
    where: { key: { in: toAward } },
    select: { id: true },
  });

  for (const a of achievements) {
    await prisma.userAchievement.upsert({
      where: { userId_achievementId: { userId, achievementId: a.id } },
      update: {},
      create: { userId, achievementId: a.id },
    });
  }
}

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = answerSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Некорректный запрос." }, { status: 400 });
  }

  const game = await prisma.gameSession.findUnique({
    where: { id: parsed.data.sessionId },
    select: {
      id: true,
      userId: true,
      current: true,
      total: true,
      factIdsJson: true,
      finishedAt: true,
    },
  });
  if (!game || game.finishedAt) {
    return NextResponse.json({ ok: false, error: "Сессия не найдена." }, { status: 404 });
  }

  const factIds = JSON.parse(game.factIdsJson) as string[];
  const factId = factIds[game.current];
  if (!factId) {
    return NextResponse.json({ ok: false, error: "Раунд не найден." }, { status: 400 });
  }

  const fact = await prisma.fact.findUnique({
    where: { id: factId },
    select: {
      id: true,
      text: true,
      isTrue: true,
      crowdThinksTrue: true,
      explanation: true,
      sources: true,
      funnyComment: true,
    },
  });
  if (!fact) {
    return NextResponse.json({ ok: false, error: "Факт не найден." }, { status: 404 });
  }

  const isCorrect =
    parsed.data.answer === null ? false : parsed.data.answer === fact.isTrue;

  await prisma.gameRound.update({
    where: { sessionId_index: { sessionId: game.id, index: game.current } },
    data: { answer: parsed.data.answer, isCorrect, crowdShown: true },
  });

  const nextCurrent = game.current + 1;
  const finished = nextCurrent >= game.total;

  await prisma.gameSession.update({
    where: { id: game.id },
    data: finished
      ? { current: nextCurrent, finishedAt: new Date(), hintsUsed: 0 }
      : { current: nextCurrent, hintsUsed: 0 },
  });

  if (game.userId) {
    const next = await prisma.playerStats.upsert({
      where: { userId: game.userId },
      update: {
        totalRounds: { increment: 1 },
        correctAnswers: isCorrect ? { increment: 1 } : undefined,
        winStreak: isCorrect ? { increment: 1 } : { set: 0 },
      },
      create: {
        userId: game.userId,
        totalRounds: 1,
        correctAnswers: isCorrect ? 1 : 0,
        winStreak: isCorrect ? 1 : 0,
        accuracy: isCorrect ? 100 : 0,
      },
      select: { totalRounds: true, correctAnswers: true, winStreak: true },
    });

    const accuracy = next.totalRounds === 0 ? 0 : (next.correctAnswers / next.totalRounds) * 100;
    await prisma.playerStats.update({
      where: { userId: game.userId },
      data: { accuracy },
    });

    await awardAchievements(game.userId);
  }

  let nextFact: { id: string; text: string } | null = null;
  if (!finished) {
    const nextFactId = factIds[nextCurrent];
    if (nextFactId) {
      const nf = await prisma.fact.findUnique({
        where: { id: nextFactId },
        select: { id: true, text: true },
      });
      if (nf) nextFact = nf;
    }
  }

  return NextResponse.json({
    ok: true,
    result: {
      isCorrect,
      correctAnswer: fact.isTrue,
      crowdText: `${fact.crowdThinksTrue}% игроков считают это правдой`,
      explanation: fact.explanation,
      sources: fact.sources,
      funnyComment: fact.funnyComment,
    },
    finished,
    next: nextFact ? { currentIndex: nextCurrent, fact: nextFact } : null,
  });
}

