import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { prisma } from "@/server/db";
import { authOptions } from "@/server/auth";

const quizCreateSchema = z.object({
  genre: z.enum(["SCIENCE", "HISTORY", "WEIRD", "MIXED"]),
  facts: z
    .array(
      z.object({
        text: z.string().trim().min(5, "Текст должен быть минимум 5 символов"),
        isTrue: z.boolean(),
        explanation: z.string().trim().min(10, "Объяснение должно быть минимум 10 символов"),
        hint: z.string().trim().min(3, "Подсказка должна быть минимум 3 символа"),
      }),
    )
    .min(5, "Минимум 5 вопросов")
    .max(20, "Максимум 20 вопросов"),
});

export async function POST(req: Request) {
  try {
    console.log("📝 Начало создания квиза");
    
    // Получаем сессию пользователя
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      console.log("❌ Пользователь не авторизован");
      return NextResponse.json(
        { ok: false, error: "Нужно войти в аккаунт." },
        { status: 401 }
      );
    }

    console.log("✅ Пользователь авторизован:", userId);

    // Парсим тело запроса
    const json = await req.json().catch((err) => {
      console.error("❌ Ошибка парсинга JSON:", err);
      return null;
    });
    
    console.log("📦 Получено вопросов:", json?.facts?.length);
    
    if (!json) {
      return NextResponse.json(
        { ok: false, error: "Некорректный JSON в запросе." },
        { status: 400 }
      );
    }

    // Проверяем наличие facts
    if (!json.facts) {
      console.log("❌ Нет поля facts в запросе");
      return NextResponse.json(
        { ok: false, error: "Отсутствуют вопросы (facts)." },
        { status: 400 }
      );
    }

    // Проверяем количество фактов
    if (!Array.isArray(json.facts)) {
      console.log("❌ facts не является массивом");
      return NextResponse.json(
        { ok: false, error: "facts должен быть массивом." },
        { status: 400 }
      );
    }

    if (json.facts.length < 5) {
      console.log(`❌ Слишком мало вопросов: ${json.facts.length}, нужно минимум 5`);
      return NextResponse.json(
        { ok: false, error: `Минимум 5 вопросов, получено ${json.facts.length}.` },
        { status: 400 }
      );
    }

    if (json.facts.length > 20) {
      console.log(`❌ Слишком много вопросов: ${json.facts.length}, нужно максимум 20`);
      return NextResponse.json(
        { ok: false, error: `Максимум 20 вопросов, получено ${json.facts.length}.` },
        { status: 400 }
      );
    }

    // Валидируем данные
    const parsed = quizCreateSchema.safeParse(json);
    
    if (!parsed.success) {
  const errors = parsed.error.issues.map(err => {
    const path = err.path.join('.');
    return `${path}: ${err.message}`;
  }).join(', ');
  
  return NextResponse.json(
    { ok: false, error: `Ошибка валидации: ${errors}` },
    { status: 400 }
  );
}

    const { genre, facts } = parsed.data;
    console.log(`✅ Валидация пройдена. Жанр: ${genre}, вопросов: ${facts.length}`);

    // Сохраняем в базу данных в транзакции
    const result = await prisma.$transaction(async (tx) => {
      console.log("📝 Создаем квиз...");
      
      // 1. Создаем квиз с правильным полем createdByUserId
      const quiz = await tx.quiz.create({
        data: {
          genre,
          title: `Квиз от ${new Date().toLocaleString()}`,
          createdByUserId: userId, // Правильное поле из вашей схемы
        },
        select: { id: true },
      });
      console.log("✅ Квиз создан:", quiz.id);

      // 2. Создаем каждый факт
      const createdFactIds: string[] = [];
      for (let i = 0; i < facts.length; i++) {
        const f = facts[i];
        console.log(`📝 Создаем факт ${i + 1}/${facts.length}`);
        
        const fact = await tx.fact.create({
          data: {
            genre,
            text: f.text,
            isTrue: f.isTrue,
            explanation: f.explanation,
            sources: "Пользовательский контент",
            hint1: f.hint,
            hint2: f.hint,
            hint3: f.hint,
            crowdThinksTrue: 50,
          },
          select: { id: true },
        });
        createdFactIds.push(fact.id);
      }
      console.log(`✅ Создано ${createdFactIds.length} фактов`);

      // 3. Связываем факты с квизом
      console.log("📝 Связываем факты с квизом...");
      await tx.quizFact.createMany({
        data: createdFactIds.map((factId, idx) => ({
          quizId: quiz.id,
          factId,
          index: idx,
        })),
      });
      console.log("✅ Связывание завершено");

      return { quizId: quiz.id };
    });

    // Успешный ответ
    console.log("🎉 Квиз успешно создан!");
    return NextResponse.json({
      ok: true,
      quizId: result.quizId,
      message: `Квиз с ${facts.length} вопросами успешно создан!`,
    });
    
  } catch (error) {
    console.error("❌ Ошибка при создании квиза:", error);
    
    // Обработка ошибок базы данных
    if (error instanceof Error) {
      return NextResponse.json(
        { 
          ok: false, 
          error: `Ошибка сохранения: ${error.message}` 
        },
        { status: 500 },
      );
    }
    
    return NextResponse.json(
      { 
        ok: false, 
        error: "Внутренняя ошибка сервера при создании квиза." 
      },
      { status: 500 },
    );
  }
}