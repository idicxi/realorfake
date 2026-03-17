import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";

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
  const where =
    genre === "MIXED"
      ? undefined
      : {
          genre,
        };

  const facts = await prisma.fact.findMany({
    where,
    select: {
      id: true,
      genre: true,
      text: true,
      crowdThinksTrue: true,
      hint1: true,
      hint2: true,
      hint3: true,
      isTrue: true,
      explanation: true,
      sources: true,
      funnyComment: true,
    },
  });

  if (facts.length === 0) {
    return NextResponse.json({ ok: false, error: "Нет фактов в базе." }, { status: 404 });
  }

  const picked = shuffle(facts).slice(0, Math.min(10, facts.length));
  const factIds = picked.map((f) => f.id);

  const game = await prisma.gameSession.create({
    data: {
      userId: session?.user?.id ?? null,
      genre,
      factIdsJson: JSON.stringify(factIds),
      total: picked.length,
      rounds: {
        create: picked.map((f, idx) => ({
          index: idx,
          factId: f.id,
        })),
      },
    },
    select: { id: true, total: true, current: true, hintsUsed: true },
  });

  const first = picked[0]!;
  return NextResponse.json({
    ok: true,
    sessionId: game.id,
    total: game.total,
    currentIndex: 0,
    hintsUsed: 0,
    fact: { id: first.id, text: first.text },
  });
}

