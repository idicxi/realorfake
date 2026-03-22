import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";

import type { Prisma } from "@prisma/client";
import { prisma } from "@/server/db";
import { authOptions } from "@/server/auth";

const startSchema = z.object({
  genre: z.enum(["SCIENCE", "HISTORY", "WEIRD", "MIXED"]),
});

function shuffle<T>(arr: T[]) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const json = await req.json().catch(() => null);
  const parsed = startSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Некорректный жанр." }, { status: 400 });
  }

  const genre = parsed.data.genre;
  const userId = session?.user?.id ?? null;

  const finishedQuizIds = userId
    ? await prisma.gameSession.findMany({
        where: { userId, finishedAt: { not: null } },
        select: { quizId: true },
      }).then((rows) =>
        rows
          .map((r) => r.quizId)
          .filter((id): id is string => !!id),
      )
    : [];

  const baseQuizWhere: Prisma.QuizWhereInput = { genre };
  const quizWhere: Prisma.QuizWhereInput =
    finishedQuizIds.length > 0
      ? { ...baseQuizWhere, id: { notIn: finishedQuizIds } }
      : baseQuizWhere;

  const candidatesRaw = await prisma.quiz.findMany({
    where: quizWhere,
    select: {
      id: true,
      _count: { select: { quizFacts: true } },
    },
  });

  const candidates = candidatesRaw.filter((c) => c._count.quizFacts === 3);

  if (candidates.length === 0) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Нет доступных квизов на 3 вопроса в этом жанре (или вы уже прошли все).",
      },
      { status: 404 },
    );
  }

  const chosenQuizId = shuffle(candidates.map((c) => c.id))[0]!;

  const quizFacts = await prisma.quizFact.findMany({
    where: { quizId: chosenQuizId },
    orderBy: { index: "asc" },
    select: {
      factId: true,
      fact: {
        select: {
          id: true,
          text: true,
          isTrue: true,
          hint1: true,
          hint2: true,
          hint3: true,
          explanation: true,
          sources: true,
          funnyComment: true,
        },
      },
    },
  });

  if (quizFacts.length !== 3) {
    return NextResponse.json(
      { ok: false, error: "Квиз должен содержать ровно 3 вопроса." },
      { status: 500 },
    );
  }

  const game = await prisma.gameSession.create({
    data: {
      userId,
      quizId: chosenQuizId,
      total: quizFacts.length,
      hintsUsed: 0,
      hintsBudgetRemaining: 6,
      current: 0,
      rounds: {
        create: quizFacts.map((qf, idx) => ({
          index: idx,
          factId: qf.factId,
        })),
      },
    },
    select: {
      id: true,
      total: true,
      current: true,
      hintsUsed: true,
      hintsBudgetRemaining: true,
    },
  });

  const first = quizFacts[0]!.fact;
  return NextResponse.json({
    ok: true,
    sessionId: game.id,
    total: game.total,
    currentIndex: 0,
    hintsUsed: 0,
    hintsBudgetRemaining: game.hintsBudgetRemaining,
    maxHintsPerQuestion: 1,
    fact: { id: first.id, text: first.text },
  });
}

