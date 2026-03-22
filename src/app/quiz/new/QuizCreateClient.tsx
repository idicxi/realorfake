"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { z } from "zod";

import { Button } from "@/components/ui/Button";

type Genre = "SCIENCE" | "HISTORY" | "WEIRD" | "MIXED";

type FactDraft = {
  text: string;
  isTrue: boolean;
  explanation: string;
  hint: string;
};

const factSchema = z.object({
  text: z.string().trim().min(5, "Текст должен быть минимум 5 символов"),
  isTrue: z.boolean(),
  explanation: z.string().trim().min(10, "Объяснение должно быть минимум 10 символов"),
  hint: z.string().trim().min(3, "Подсказка должна быть минимум 3 символа"),
});

const quizDraftSchema = z.object({
  genre: z.enum(["SCIENCE", "HISTORY", "WEIRD", "MIXED"]),
  facts: z.array(factSchema).min(5, "Минимум 5 вопросов").max(20, "Максимум 20 вопросов"),
});

const emptyFact = (): FactDraft => ({
  text: "",
  isTrue: true,
  explanation: "",
  hint: "",
});

export default function QuizCreateClient() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [genre, setGenre] = useState<Genre>("SCIENCE");
  const [facts, setFacts] = useState<FactDraft[]>([emptyFact()]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successOpen, setSuccessOpen] = useState(false);

  // Проверка авторизации при загрузке страницы
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  function addFact() {
    if (facts.length >= 20) {
      setError("Максимум 20 вопросов в одном квизе");
      return;
    }
    setFacts([...facts, emptyFact()]);
    setError(null);
  }

  function removeFact(index: number) {
    if (facts.length <= 1) {
      setError("Минимум 1 вопрос");
      return;
    }
    setFacts(facts.filter((_, i) => i !== index));
    setError(null);
  }

  function updateFact(idx: number, patch: Partial<FactDraft>) {
    setFacts((prev) => prev.map((f, i) => (i === idx ? { ...f, ...patch } : f)));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Проверка авторизации перед отправкой
    if (status !== "authenticated" || !session?.user?.id) {
      router.push("/login");
      return;
    }

    // Проверяем, что есть минимум 5 вопросов
    if (facts.length < 5) {
      setError(`Нужно добавить еще ${5 - facts.length} вопрос(ов). Минимум 5 вопросов для создания квиза.`);
      return;
    }

    const draft = { genre, facts };
    const parsed = quizDraftSchema.safeParse(draft);
    
    if (!parsed.success) {
      const errors = parsed.error.errors.map(err => err.message).join(", ");
      setError(`Ошибка валидации: ${errors}`);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/quiz/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(draft),
      });
      
      const data = (await res.json().catch(() => null)) as null | {
        ok: boolean;
        error?: string;
        quizId?: string;
      };
      setLoading(false);

      if (!res.ok || !data?.ok) {
        setError(data?.error ?? "Не удалось сохранить квиз.");
        return;
      }

      setSuccessOpen(true);
    } catch (err) {
      setLoading(false);
      setError("Произошла ошибка при отправке запроса");
      console.error(err);
    }
  }

  // Показываем загрузку пока проверяется авторизация
  if (status === "loading") {
    return (
      <main className="relative mx-auto w-full max-w-4xl px-4 py-10">
        <div className="glass-card p-8 text-center">
          <p className="text-white">Проверка авторизации...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="relative mx-auto w-full max-w-4xl px-4 py-10">
      <div className="glass-card relative overflow-hidden p-8 md:p-10">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-violet-500/25 blur-3xl" />
        <div className="relative">
          <h1 className="text-3xl font-black tracking-tight text-white md:text-4xl">
            Создать квиз
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/60">
            Минимум <span className="font-semibold text-violet-200">5 вопросов</span> для создания квиза.
            Для каждого укажите правду/ложь, текст, подсказку и объединённое объяснение.
          </p>

          <form onSubmit={onSubmit} className="mt-8 space-y-6">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <div className="text-xs font-semibold text-white/70">Жанр</div>
                <select
                  value={genre}
                  onChange={(e) => setGenre(e.target.value as Genre)}
                  className="mt-2 h-11 w-full rounded-2xl border border-white/10 bg-black/40 px-4 text-sm text-white outline-none ring-violet-500/0 transition focus:border-violet-400/50 focus:ring-2 focus:ring-violet-500/30"
                >
                  <option value="SCIENCE">Наука</option>
                  <option value="HISTORY">История</option>
                  <option value="WEIRD">Странное</option>
                  <option value="MIXED">Смешанное</option>
                </select>
              </label>

              <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
                <div>
                  <div className="text-xs font-semibold text-white/50">Вопросов в квизе</div>
                  <div className="mt-1 text-2xl font-black text-violet-200">{facts.length}</div>
                </div>
                <div className="text-xs text-white/40">
                  {facts.length < 5 ? `нужно еще ${5 - facts.length}` : "готово к созданию"}
                </div>
              </div>
            </div>

            <div className="space-y-5">
              {facts.map((f, idx) => (
                <div
                  key={idx}
                  className="relative rounded-2xl border border-white/10 bg-black/25 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.04)_inset] md:p-6"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold uppercase tracking-wider text-violet-300/90">
                      Вопрос {idx + 1} / {facts.length}
                    </div>
                    {facts.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeFact(idx)}
                        className="rounded-full bg-red-500/20 p-1.5 text-red-300 transition hover:bg-red-500/40"
                        aria-label="Удалить вопрос"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <label className="block sm:col-span-2">
                      <div className="text-xs font-semibold text-white/70">Текст факта</div>
                      <textarea
                        value={f.text}
                        onChange={(e) => updateFact(idx, { text: e.target.value })}
                        placeholder="Формулировка для игрока…"
                        className="mt-2 min-h-[4.5rem] w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none transition focus:border-violet-400/45"
                        required
                      />
                    </label>

                    <label className="block">
                      <div className="text-xs font-semibold text-white/70">Правда / ложь</div>
                      <select
                        value={f.isTrue ? "true" : "false"}
                        onChange={(e) => updateFact(idx, { isTrue: e.target.value === "true" })}
                        className="mt-2 h-11 w-full rounded-2xl border border-white/10 bg-black/40 px-4 text-sm text-white outline-none focus:border-violet-400/45"
                      >
                        <option value="true">Правда</option>
                        <option value="false">Ложь</option>
                      </select>
                    </label>

                    <label className="block">
                      <div className="text-xs font-semibold text-white/70">Подсказка</div>
                      <input
                        value={f.hint}
                        onChange={(e) => updateFact(idx, { hint: e.target.value })}
                        placeholder="Короткая улика"
                        className="mt-2 h-11 w-full rounded-2xl border border-white/10 bg-black/40 px-4 text-sm text-white outline-none focus:border-violet-400/45"
                        required
                      />
                    </label>

                    <label className="block sm:col-span-2">
                      <div className="text-xs font-semibold text-white/70">
                        Объяснение и почему это так
                      </div>
                      <textarea
                        value={f.explanation}
                        onChange={(e) => updateFact(idx, { explanation: e.target.value })}
                        placeholder="Почему это правда или миф — одним текстом"
                        className="mt-2 min-h-[7rem] w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-violet-400/45"
                        required
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>

            {/* Кнопка добавления нового факта */}
            <button
              type="button"
              onClick={addFact}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-white/20 bg-black/20 py-4 text-sm text-white/60 transition hover:border-violet-400/50 hover:bg-black/40 hover:text-white"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Добавить вопрос
            </button>

            {error ? (
              <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                {error}
              </div>
            ) : null}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Button type="button" variant="secondary" size="lg" onClick={() => router.push("/game")}>
                Назад в игру
              </Button>
              <Button 
                type="submit" 
                size="lg" 
                disabled={loading || facts.length < 5}
                title={facts.length < 5 ? `Нужно добавить еще ${5 - facts.length} вопрос(ов)` : ""}
              >
                {loading ? "Сохраняем…" : facts.length < 5 ? `Еще ${5 - facts.length} вопрос(ов) нужно` : "Сохранить квиз"}
              </Button>
            </div>
          </form>
        </div>
      </div>

      {successOpen ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-labelledby="quiz-success-title"
        >
          <div className="glass-card relative w-full max-w-md overflow-hidden p-8 text-center shadow-2xl">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-violet-500 via-fuchsia-400 to-violet-500" />
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-emerald-500/20 text-2xl ring-1 ring-emerald-400/40">
              ✓
            </div>
            <h2 id="quiz-success-title" className="mt-5 text-2xl font-black text-white">
              Всё готово!
            </h2>
            <p className="mt-2 text-sm text-white/65">
              Квиз с {facts.length} вопросами успешно создан и появится в игре в выбранном жанре.
            </p>
            <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <Button type="button" size="lg" className="sm:min-w-[140px]" onClick={() => router.push("/game")}>
                В игру
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="lg"
                className="sm:min-w-[140px]"
                onClick={() => {
                  setSuccessOpen(false);
                  setFacts([emptyFact()]);
                  setError(null);
                }}
              >
                Создать ещё
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}