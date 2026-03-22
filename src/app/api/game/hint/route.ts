import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/server/db";

const hintSchema = z.object({
  sessionId: z.string().min(1),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = hintSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Некорректный запрос." }, { status: 400 });
  }

  const game = await prisma.gameSession.findUnique({
    where: { id: parsed.data.sessionId },
    select: {
      id: true,
      current: true,
      total: true,
      hintsUsed: true,
      hintsBudgetRemaining: true,
      finishedAt: true,
    },
  });
  if (!game || game.finishedAt) {
    return NextResponse.json({ ok: false, error: "Сессия не найдена." }, { status: 404 });
  }
  if (game.hintsBudgetRemaining <= 0) {
    return NextResponse.json({ ok: false, error: "Подсказки на квиз закончились." }, { status: 400 });
  }
  if (game.hintsUsed >= 1) {
    return NextResponse.json(
      { ok: false, error: "На этом вопросе можно взять только одну подсказку." },
      { status: 400 },
    );
  }

  const round = await prisma.gameRound.findUnique({
    where: { sessionId_index: { sessionId: game.id, index: game.current } },
    select: { factId: true },
  });
  if (!round) {
    return NextResponse.json({ ok: false, error: "Раунд не найден." }, { status: 400 });
  }

  const fact = await prisma.fact.findUnique({
    where: { id: round.factId },
    select: { hint1: true, hint2: true, hint3: true },
  });
  if (!fact) {
    return NextResponse.json({ ok: false, error: "Факт не найден." }, { status: 404 });
  }

  const hintText = fact.hint1;

  const updated = await prisma.gameSession.update({
    where: { id: game.id },
    data: {
      hintsUsed: { increment: 1 },
      hintsBudgetRemaining: { decrement: 1 },
    },
    select: { hintsUsed: true, hintsBudgetRemaining: true },
  });

  return NextResponse.json({
    ok: true,
    hint: hintText,
    hintsUsed: updated.hintsUsed,
    hintsBudgetRemaining: updated.hintsBudgetRemaining,
    hintsLeftThisQuestion: Math.max(0, 1 - updated.hintsUsed),
  });
}

