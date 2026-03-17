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
    select: { id: true, current: true, total: true, hintsUsed: true, factIdsJson: true, finishedAt: true },
  });
  if (!game || game.finishedAt) {
    return NextResponse.json({ ok: false, error: "Сессия не найдена." }, { status: 404 });
  }
  if (game.hintsUsed >= 3) {
    return NextResponse.json({ ok: false, error: "Подсказки закончились." }, { status: 400 });
  }

  const factIds = JSON.parse(game.factIdsJson) as string[];
  const factId = factIds[game.current];
  if (!factId) {
    return NextResponse.json({ ok: false, error: "Раунд не найден." }, { status: 400 });
  }

  const fact = await prisma.fact.findUnique({
    where: { id: factId },
    select: { hint1: true, hint2: true, hint3: true },
  });
  if (!fact) {
    return NextResponse.json({ ok: false, error: "Факт не найден." }, { status: 404 });
  }

  const nextHintIndex = game.hintsUsed + 1;
  const hintText = nextHintIndex === 1 ? fact.hint1 : nextHintIndex === 2 ? fact.hint2 : fact.hint3;

  const updated = await prisma.gameSession.update({
    where: { id: game.id },
    data: { hintsUsed: { increment: 1 } },
    select: { hintsUsed: true },
  });

  return NextResponse.json({
    ok: true,
    hint: hintText,
    hintsUsed: updated.hintsUsed,
    hintsLeft: Math.max(0, 3 - updated.hintsUsed),
  });
}

