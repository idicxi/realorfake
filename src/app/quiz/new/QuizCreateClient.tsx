"use client";

import { useState } from "react";
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
  text: z.string().trim().min(5),
  isTrue: z.boolean(),
  explanation: z.string().trim().min(10),
  hint: z.string().trim().min(3),
});

const quizDraftSchema = z.object({
  genre: z.enum(["SCIENCE", "HISTORY", "WEIRD", "MIXED"]),
  facts: z.tuple([factSchema, factSchema, factSchema]),
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
  const [facts, setFacts] = useState<FactDraft[]>(() => [emptyFact(), emptyFact(), emptyFact()]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successOpen, setSuccessOpen] = useState(false);

  function updateFact(idx: number, patch: Partial<FactDraft>) {
    setFacts((prev) => prev.map((f, i) => (i === idx ? { ...f, ...patch } : f)));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const draft = { genre, facts };
    const parsed = quizDraftSchema.safeParse(draft);
    if (!parsed.success) {
      setError("Заполните все 3 вопроса: описание, ответ, подсказку и объяснение (от 10 символов).");
      return;
    }

    if (status !== "authenticated" || !session?.user?.id) {
      router.push("/login");
      return;
    }

    setLoading(true);
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
            Ровно <span className="font-semibold text-violet-200">3 вопроса</span> — для каждого укажите
            правду/ложь, текст, подсказку и объединённое объяснение.
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

              <div className="flex items-end rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
                <div>
                  <div className="text-xs font-semibold text-white/50">Вопросов в квизе</div>
                  <div className="mt-1 text-2xl font-black text-violet-200">3</div>
                </div>
              </div>
            </div>

            <div className="space-y-5">
              {facts.map((f, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-white/10 bg-black/25 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.04)_inset] md:p-6"
                >
                  <div className="text-xs font-bold uppercase tracking-wider text-violet-300/90">
                    Вопрос {idx + 1} / 3
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

            {error ? (
              <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                {error}
              </div>
            ) : null}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Button type="button" variant="secondary" size="lg" onClick={() => router.push("/game")}>
                Назад в игру
              </Button>
              <Button type="submit" size="lg" disabled={loading}>
                {loading ? "Сохраняем…" : "Сохранить квиз"}
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
              Квиз успешно создан и появится в игре в выбранном жанре.
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
                  setFacts([emptyFact(), emptyFact(), emptyFact()]);
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
