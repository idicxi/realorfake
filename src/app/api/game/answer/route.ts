import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/server/db";
import { awardAchievementsAndListNew } from "@/server/achievements";

const answerSchema = z.object({
  sessionId: z.string().min(1),
  answer: z.boolean().nullable(),
});

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
      quizId: true,
      finishedAt: true,
    },
  });
  if (!game || game.finishedAt) {
    return NextResponse.json({ ok: false, error: "Сессия не найдена." }, { status: 404 });
  }

  const round = await prisma.gameRound.findUnique({
    where: { sessionId_index: { sessionId: game.id, index: game.current } },
    select: { factId: true },
  });
  if (!round?.factId) {
    return NextResponse.json({ ok: false, error: "Раунд не найден." }, { status: 400 });
  }

  const fact = await prisma.fact.findUnique({
    where: { id: round.factId },
    select: {
      id: true,
      text: true,
      isTrue: true,
      explanation: true,
      sources: true,
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

  const [trueVotes, falseVotes] = await Promise.all([
    prisma.gameRound.count({ where: { factId: fact.id, answer: true } }),
    prisma.gameRound.count({ where: { factId: fact.id, answer: false } }),
  ]);
  const totalVotes = trueVotes + falseVotes;
  const truePercent = totalVotes ? Math.round((trueVotes / totalVotes) * 100) : 50;
  const falsePercent = 100 - truePercent;

  let newAchievements: Awaited<ReturnType<typeof awardAchievementsAndListNew>> = [];
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
      select: { totalRounds: true, correctAnswers: true, winStreak: true, accuracy: true },
    });

    const accuracy = next.totalRounds === 0 ? 0 : (next.correctAnswers / next.totalRounds) * 100;
    await prisma.playerStats.update({
      where: { userId: game.userId },
      data: { accuracy },
    });

    newAchievements = await awardAchievementsAndListNew(game.userId);
  }

  let nextFact: { id: string; text: string } | null = null;
  if (!finished) {
    const nextRound = await prisma.gameRound.findUnique({
      where: { sessionId_index: { sessionId: game.id, index: nextCurrent } },
      select: { factId: true },
    });
    if (nextRound?.factId) {
      const nf = await prisma.fact.findUnique({
        where: { id: nextRound.factId },
        select: { id: true, text: true },
      });
      if (nf) nextFact = nf;
    }
  }

  const sessionAfter = await prisma.gameSession.findUnique({
    where: { id: game.id },
    select: { hintsBudgetRemaining: true },
  });

  return NextResponse.json({
    ok: true,
    result: {
      isCorrect,
      correctAnswer: fact.isTrue,
      userAnswer: parsed.data.answer,
      crowd: {
        truePercent,
        falsePercent,
        trueVotes,
        falseVotes,
      },
      explanation: fact.explanation,
      sources: fact.sources,
      funnyComment: fact.funnyComment,
    },
    finished,
    next: nextFact ? { currentIndex: nextCurrent, fact: nextFact } : null,
    hintsBudgetRemaining: sessionAfter?.hintsBudgetRemaining ?? 0,
    newAchievements: newAchievements ?? [],
  });
}

