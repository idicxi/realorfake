import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { z } from "zod";

import { prisma } from "@/server/db";

const quizCreateSchema = z.object({
  genre: z.enum(["SCIENCE", "HISTORY", "WEIRD", "MIXED"]),
  facts: z
    .array(
      z.object({
        text: z.string().trim().min(5),
        isTrue: z.boolean(),
        explanation: z.string().trim().min(10),
        hint: z.string().trim().min(3),
      }),
    )
    .length(3),
});

export async function POST(req: Request) {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    return NextResponse.json({ ok: false, error: "Сервер: нет NEXTAUTH_SECRET." }, { status: 500 });
  }

  const token = await getToken({
    // App Router Request совместим с getToken через приведение типа (ожидается req с cookie)
    req: req as Parameters<typeof getToken>[0]["req"],
    secret,
  });

  const userId = token?.sub;
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Нужно войти." }, { status: 401 });
  }

  const json = await req.json().catch(() => null);
  const parsed = quizCreateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "Нужны ровно 3 вопроса: текст от 5 символов, объяснение от 10, подсказка от 3.",
        issues: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const { genre, facts } = parsed.data;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const quiz = await tx.quiz.create({
        data: {
          genre,
          title: `Квиз пользователя`,
          createdByUserId: userId,
        },
        select: { id: true },
      });

      const createdFactIds: string[] = [];
      for (const f of facts) {
        const fact = await tx.fact.create({
          data: {
            genre,
            text: f.text,
            isTrue: f.isTrue,
            explanation: f.explanation,
            sources: "Пользовательский контент",
            funnyComment: "Проверим интуицию!",
            hint1: f.hint,
            hint2: f.hint,
            hint3: f.hint,
            crowdThinksTrue: 50,
          },
          select: { id: true },
        });
        createdFactIds.push(fact.id);
      }

      await tx.quizFact.createMany({
        data: createdFactIds.map((factId, idx) => ({
          quizId: quiz.id,
          factId,
          index: idx,
        })),
      });

      return { quizId: quiz.id };
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    console.error("quiz/create", e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Ошибка сохранения квиза." },
      { status: 500 },
    );
  }
}
