"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

import { Button } from "@/components/ui/Button";
import type { AchievementPayload } from "@/components/AchievementToastHost";
import { useGameSession } from "@/context/GameSessionContext";

type Genre = "SCIENCE" | "HISTORY" | "WEIRD" | "MIXED";

type Stats = {
  accuracy: number;
  winStreak: number;
  totalRounds: number;
};

type GameStartRes =
  | {
      ok: true;
      sessionId: string;
      total: number;
      currentIndex: number;
      hintsUsed: number;
      hintsBudgetRemaining: number;
      maxHintsPerQuestion: number;
      fact: { id: string; text: string };
    }
  | { ok: false; error: string };

type HintRes =
  | {
      ok: true;
      hint: string;
      hintsUsed: number;
      hintsBudgetRemaining: number;
      hintsLeftThisQuestion: number;
    }
  | { ok: false; error: string };

type AnswerRes =
  | {
      ok: true;
      result: {
        isCorrect: boolean;
        correctAnswer: boolean;
        userAnswer: boolean | null;
        crowd: {
          truePercent: number;
          falsePercent: number;
          trueVotes: number;
          falseVotes: number;
        };
        explanation: string;
        sources: string;
      };
      finished: boolean;
      next: null | { currentIndex: number; fact: { id: string; text: string } };
      hintsBudgetRemaining: number;
      newAchievements: AchievementPayload[];
    }
  | { ok: false; error: string };

type Reveal = {
  isCorrect: boolean;
  correctAnswer: boolean;
  userAnswer: boolean | null;
  crowd: {
    truePercent: number;
    falsePercent: number;
    trueVotes: number;
    falseVotes: number;
  };
  explanation: string;
  sources: string;
};

function emitAchievements(list: AchievementPayload[]) {
  if (!list.length) return;
  window.dispatchEvent(new CustomEvent("achievement-unlocked", { detail: list }));
}

function Pill({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass-card rounded-2xl px-5 py-4">
      <div className="text-xs font-semibold text-white/55">{label}</div>
      <div className="mt-1 text-2xl font-black tracking-tight text-white">{value}</div>
    </div>
  );
}

function genreLabel(g: Genre) {
  if (g === "SCIENCE") return "Наука";
  if (g === "HISTORY") return "История";
  if (g === "WEIRD") return "Странное";
  return "Смешанное";
}

export default function GameClient() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const gameSession = useGameSession();
  const setActiveSessionId = gameSession?.setActiveSessionId;

  const [stats, setStats] = useState<Stats>({ accuracy: 0, winStreak: 0, totalRounds: 0 });

  const [genre, setGenre] = useState<Genre>("MIXED");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [factText, setFactText] = useState<string | null>(null);

  const [hints, setHints] = useState<string[]>([]);
  const [hintsBudgetRemaining, setHintsBudgetRemaining] = useState(3);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [timer, setTimer] = useState(20);
  const intervalRef = useRef<number | null>(null);
  const questionEndsAtRef = useRef<number | null>(null);
  const timeoutSubmittedRef = useRef(false);
  const mountedRef = useRef(true);

  const QUESTION_SECONDS = 20;

  const [crowdAnim, setCrowdAnim] = useState<{ truePercent: number; falsePercent: number }>({
    truePercent: 0,
    falsePercent: 0,
  });

  const [reveal, setReveal] = useState<Reveal | null>(null);
  const [finished, setFinished] = useState(false);

  const playing = useMemo(
    () => !!sessionId && !!factText && !reveal && !finished,
    [sessionId, factText, reveal, finished],
  );

  const questionHintUsed = hints.length >= 1;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      intervalRef.current = null;
      setActiveSessionId?.(null);
    };
  }, [setActiveSessionId]);

  async function refreshStats() {
    const res = await fetch("/api/me/stats", { cache: "no-store", credentials: "include" });
    const data = (await res.json()) as { ok: true; stats: Stats };
    if (data?.ok) setStats(data.stats);
  }

  useEffect(() => {
    queueMicrotask(() => {
      void refreshStats();
    });
  }, []);

  const lastAnswerRef = useRef<AnswerRes | null>(null);

  const submitAnswerAndStore = useCallback(
    async (answer: boolean | null) => {
      if (!sessionId) return;
      setLoading(true);
      setError(null);

      if (intervalRef.current) window.clearInterval(intervalRef.current);
      intervalRef.current = null;

      const res = await fetch("/api/game/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ sessionId, answer }),
      });
      const data = (await res.json().catch(() => null)) as AnswerRes | null;
      if (!mountedRef.current) return;
      setLoading(false);

      if (!res.ok || !data || ("ok" in data && data.ok === false)) {
        setError((data && "error" in data ? data.error : null) ?? "Не удалось отправить ответ.");
        return;
      }

      lastAnswerRef.current = data;
      if (data.ok) {
        setReveal(data.result);
        setFinished(data.finished);
        setCrowdAnim({ truePercent: 0, falsePercent: 0 });
        setHintsBudgetRemaining(data.hintsBudgetRemaining);
        emitAchievements(data.newAchievements ?? []);
        if (data.finished) setActiveSessionId?.(null);
        await refreshStats();
      }
    },
    [sessionId, setActiveSessionId],
  );

  useEffect(() => {
    if (!playing) return;

    queueMicrotask(() => {
      timeoutSubmittedRef.current = false;
      questionEndsAtRef.current = Date.now() + QUESTION_SECONDS * 1000;
      setTimer(QUESTION_SECONDS);
    });

    if (intervalRef.current) window.clearInterval(intervalRef.current);
    intervalRef.current = window.setInterval(() => {
      const endsAt = questionEndsAtRef.current;
      if (!endsAt) return;
      const remainingMs = endsAt - Date.now();
      const nextTimer = Math.max(0, Math.ceil(remainingMs / 1000));
      setTimer(nextTimer);

      if (remainingMs <= 0 && !timeoutSubmittedRef.current) {
        timeoutSubmittedRef.current = true;
        if (intervalRef.current) window.clearInterval(intervalRef.current);
        intervalRef.current = null;
        void submitAnswerAndStore(null);
      }
    }, 200);

    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      intervalRef.current = null;
      questionEndsAtRef.current = null;
    };
  }, [playing, currentIndex, submitAnswerAndStore]);

  async function startGame() {
    // Проверка авторизации - редирект на вход
    if (status !== "authenticated" || !session?.user?.id) {
      router.push("/login");
      return;
    }

    console.log("🎮 Starting game with genre:", genre);
    setLoading(true);
    setError(null);
    setReveal(null);
    setFinished(false);
    setHints([]);
    setHintsBudgetRemaining(3);

    try {
      const res = await fetch("/api/game/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ genre }),
      });

      console.log("📡 Response status:", res.status);
      const rawData = await res.text();
      console.log("📦 Raw response:", rawData);

      let data: GameStartRes | null = null;
      try {
        data = JSON.parse(rawData) as GameStartRes;
      } catch (e) {
        console.error("❌ Failed to parse JSON:", e);
        setError("Сервер вернул некорректный ответ");
        setLoading(false);
        return;
      }

      if (!mountedRef.current) return;
      setLoading(false);

      if (!res.ok || !data || !("ok" in data) || data.ok === false) {
        const errorMsg = (data && "error" in data ? data.error : null) ?? "Не удалось начать игру.";
        console.error("❌ Game start failed:", errorMsg);
        setError(errorMsg);
        return;
      }

      console.log("✅ Game started successfully:", data);
      setSessionId(data.sessionId);
      setActiveSessionId?.(data.sessionId);
      setTotal(data.total);
      setCurrentIndex(data.currentIndex);
      setFactText(data.fact.text);
      setHintsBudgetRemaining(data.hintsBudgetRemaining);
    } catch (err) {
      console.error("🔥 Unexpected error:", err);
      setError("Произошла ошибка при запуске игры");
      setLoading(false);
    }
  }

  async function takeHint() {
    if (!sessionId) return;
    if (questionHintUsed) return;
    setLoading(true);
    setError(null);

    const res = await fetch("/api/game/hint", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ sessionId }),
    });
    const data = (await res.json().catch(() => null)) as HintRes | null;
    if (!mountedRef.current) return;
    setLoading(false);

    if (!res.ok || !data || ("ok" in data && data.ok === false)) {
      setError((data && "error" in data ? data.error : null) ?? "Не удалось получить подсказку.");
      return;
    }

    if (data.ok) {
      setHints((h) => [...h, data.hint]);
      setHintsBudgetRemaining(data.hintsBudgetRemaining);
    }
  }

  useEffect(() => {
    if (!reveal) return;
    const toTrue = reveal.crowd.truePercent;
    const durationMs = 900;
    const start = performance.now();

    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      const nextTrue = Math.round(toTrue * eased);
      setCrowdAnim({ truePercent: nextTrue, falsePercent: 100 - nextTrue });
      if (t < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reveal]);

  function resetToLobby() {
    if (intervalRef.current) window.clearInterval(intervalRef.current);
    intervalRef.current = null;
    questionEndsAtRef.current = null;
    setActiveSessionId?.(null);
    setSessionId(null);
    setFactText(null);
    setReveal(null);
    setFinished(false);
    setHints([]);
    setHintsBudgetRemaining(3);
    setError(null);
    lastAnswerRef.current = null;
  }

  async function exitGame() {
    if (!sessionId) {
      resetToLobby();
      return;
    }

    if (intervalRef.current) window.clearInterval(intervalRef.current);
    intervalRef.current = null;
    questionEndsAtRef.current = null;

    setLoading(true);
    const res = await fetch("/api/game/abandon", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ sessionId }),
    });
    const data = (await res.json().catch(() => null)) as null | {
      ok: boolean;
      newAchievements?: AchievementPayload[];
      error?: string;
    };
    if (!mountedRef.current) return;
    setLoading(false);

    if (data?.ok) {
      emitAchievements(data.newAchievements ?? []);
      await refreshStats();
    } else {
      setError(data?.error ?? "Не удалось сохранить выход на сервере, но экран игры сброшен.");
    }

    resetToLobby();
  }

  async function onTruth() {
    await submitAnswerAndStore(true);
  }
  async function onLie() {
    await submitAnswerAndStore(false);
  }

  function advanceFromStoredNext() {
    const data = lastAnswerRef.current;
    if (!data || !("ok" in data) || data.ok === false) return;
    if (!data.next) return;

    setCurrentIndex(data.next.currentIndex);
    setFactText(data.next.fact.text);
    setReveal(null);
    setHints([]);
    setHintsBudgetRemaining(data.hintsBudgetRemaining);
    setTimer(QUESTION_SECONDS);
  }

  return (
    <div className="relative z-0 space-y-6">
      <section className="grid gap-3 sm:grid-cols-3">
        <Pill label="Точность" value={`${Math.round(stats.accuracy)}%`} />
        <Pill label="Серия побед" value={`${stats.winStreak}`} />
        <Pill label="Всего раундов" value={`${stats.totalRounds}`} />
      </section>

      {!sessionId ? (
        <section className="glass-card p-8 md:p-10">
          <h1 className="text-3xl font-black tracking-tight text-white md:text-4xl">Игра</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/65">
            В каждом квизе может быть от 5 до 20 вопросов. На весь раунд — до 3 подсказок; на один вопрос — одна
            подсказка.
          </p>

          <div className="mt-6 grid gap-2 sm:grid-cols-4">
            {(["MIXED", "SCIENCE", "HISTORY", "WEIRD"] as const).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGenre(g)}
                className={`h-12 rounded-2xl border text-sm font-semibold transition ${
                  genre === g
                    ? "border-violet-400/50 bg-violet-500/15 text-white"
                    : "border-white/10 bg-black/25 text-white/75 hover:bg-white/5 hover:text-white"
                }`}
              >
                {genreLabel(g)}
              </button>
            ))}
          </div>

          {error ? (
            <div className="mt-5 rounded-2xl border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {error}
            </div>
          ) : null}

          <div className="mt-6">
            <Button size="lg" onClick={startGame} disabled={loading}>
              {loading ? "Запускаем..." : "Играть"}
            </Button>
          </div>
        </section>
      ) : (
        <section className="glass-card p-8 md:p-10">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="text-sm font-semibold text-white/70">
              Вопрос <span className="text-white">{currentIndex + 1}</span> из{" "}
              <span className="text-white">{total}</span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-3">
                <div className="relative grid h-12 w-12 place-items-center">
                  <div
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: `conic-gradient(from 180deg, rgba(124,58,237,0.95) ${(
                        (timer / QUESTION_SECONDS) *
                        100
                      ).toFixed(0)}%, rgba(255,255,255,0.10) 0%)`,
                    }}
                  />
                  <div className="relative grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-black/25">
                    <div className="text-xs font-black text-white">{Math.max(timer, 0)}с</div>
                  </div>
                </div>
                <div className="text-sm font-semibold text-white/70">Таймер</div>
              </div>

              <div className="flex items-center gap-2 rounded-full bg-black/40 px-3 py-1.5">
                <span className="text-xs text-white/70">💡 Осталось:</span>
                <span className="text-sm font-bold text-violet-300">{hintsBudgetRemaining}</span>
                <span className="text-xs text-white/50">/ 3</span>
              </div>

              <Button
                variant="secondary"
                size="sm"
                type="button"
                onClick={takeHint}
                disabled={loading || !!reveal || questionHintUsed || hintsBudgetRemaining <= 0}
              >
                Подсказка {hintsBudgetRemaining}/{3}
              </Button>

              <Button variant="ghost" size="sm" type="button" onClick={exitGame} disabled={loading}>
                Выйти из игры
              </Button>
            </div>
          </div>

          <div className="mt-6 rounded-3xl border border-white/10 bg-black/25 p-7">
            <div className="text-xs font-semibold text-white/60">Факт</div>
            <div className="mt-3 text-pretty text-xl font-bold leading-8">{factText}</div>
          </div>

          {hints.length ? (
            <div className="mt-5 grid gap-2">
              {hints.map((h, idx) => {
                const totalHints = hints.length + hintsBudgetRemaining;
                return (
                  <div
                    key={idx}
                    className="rounded-2xl border border-violet-400/20 bg-violet-500/10 px-4 py-3 text-sm text-violet-100/90"
                  >
                    <span className="font-semibold text-violet-200">
                      Подсказка {idx + 1}/{totalHints}:
                    </span> {h}
                  </div>
                );
              })}
            </div>
          ) : null}

          {error ? (
            <div className="mt-5 rounded-2xl border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {error}
            </div>
          ) : null}

          {!reveal ? (
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              <Button size="lg" type="button" onClick={onTruth} disabled={loading}>
                Правда
              </Button>
              <Button size="lg" variant="secondary" type="button" onClick={onLie} disabled={loading}>
                Ложь
              </Button>
            </div>
          ) : (
            <div className="mt-7 space-y-4">
              <div
                className={`rounded-3xl border px-6 py-5 ${
                  reveal.isCorrect
                    ? "border-emerald-400/25 bg-emerald-500/10"
                    : "border-rose-400/25 bg-rose-500/10"
                }`}
              >
                <div className="text-sm font-bold">{reveal.isCorrect ? "Верно!" : "Неверно."}</div>
                <div className="mt-2 text-sm text-white/70">
                  Правильный ответ: {reveal.correctAnswer ? "правда" : "ложь"}
                  {reveal.userAnswer === null ? " (время вышло)" : ""}
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                    <div className="text-xs font-semibold text-white/60">Правда</div>
                    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-violet-400/80"
                        style={{ width: `${crowdAnim.truePercent}%` }}
                      />
                    </div>
                    <div className="mt-2 text-right text-sm font-bold text-white/90">
                      {crowdAnim.truePercent}%
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                    <div className="text-xs font-semibold text-white/60">Ложь</div>
                    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-fuchsia-400/80"
                        style={{ width: `${crowdAnim.falsePercent}%` }}
                      />
                    </div>
                    <div className="mt-2 text-right text-sm font-bold text-white/90">
                      {crowdAnim.falsePercent}%
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-black/25 p-6">
                <div className="text-xs font-semibold text-white/60">Почему это правда/ложь?</div>
                <div className="mt-3 text-sm leading-6 text-white/80">{reveal.explanation}</div>
                {reveal.sources && reveal.sources.trim() !== "" && (
                  <>
                    <div className="mt-4 text-xs font-semibold text-white/60">Источники</div>
                    <div className="mt-2 text-sm leading-6 text-white/70">{reveal.sources}</div>
                  </>
                )}
              </div>

              {finished ? (
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button size="lg" type="button" onClick={() => window.location.reload()}>
                    Сыграть ещё раз
                  </Button>
                  <Button size="lg" variant="secondary" type="button" onClick={resetToLobby}>
                    Выбор жанра
                  </Button>
                </div>
              ) : (
                <Button size="lg" type="button" onClick={advanceFromStoredNext}>
                  Дальше
                </Button>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
}