"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/Button";

type Genre = "SCIENCE" | "HISTORY" | "WEIRD" | "MIXED";

type Stats = {
  accuracy: number;
  winStreak: number;
  totalRounds: number;
};

type GameStartRes =
  | { ok: true; sessionId: string; total: number; currentIndex: number; hintsUsed: number; fact: { id: string; text: string } }
  | { ok: false; error: string };

type HintRes =
  | { ok: true; hint: string; hintsUsed: number; hintsLeft: number }
  | { ok: false; error: string };

type AnswerRes =
  | {
      ok: true;
      result: {
        isCorrect: boolean;
        correctAnswer: boolean;
        crowdText: string;
        explanation: string;
        sources: string;
        funnyComment: string;
      };
      finished: boolean;
      next: null | { currentIndex: number; fact: { id: string; text: string } };
    }
  | { ok: false; error: string };

type Reveal = {
  isCorrect: boolean;
  correctAnswer: boolean;
  crowdText: string;
  explanation: string;
  sources: string;
  funnyComment: string;
};

function Pill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 shadow-[0_0_0_1px_rgba(255,255,255,0.06)_inset]">
      <div className="text-xs font-semibold text-white/60">{label}</div>
      <div className="mt-1 text-2xl font-black tracking-tight">{value}</div>
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
  const [stats, setStats] = useState<Stats>({ accuracy: 0, winStreak: 0, totalRounds: 0 });

  const [genre, setGenre] = useState<Genre>("MIXED");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [factText, setFactText] = useState<string | null>(null);

  const [hints, setHints] = useState<string[]>([]);
  const [hintsLeft, setHintsLeft] = useState(3);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [timer, setTimer] = useState(20);
  const intervalRef = useRef<number | null>(null);

  const [reveal, setReveal] = useState<Reveal | null>(null);
  const [finished, setFinished] = useState(false);

  const playing = useMemo(() => !!sessionId && !!factText && !reveal && !finished, [sessionId, factText, reveal, finished]);

  async function refreshStats() {
    const res = await fetch("/api/me/stats", { cache: "no-store" });
    const data = (await res.json()) as { ok: true; stats: Stats };
    if (data?.ok) setStats(data.stats);
  }

  useEffect(() => {
    refreshStats();
  }, []);

  useEffect(() => {
    if (!playing) return;
    setTimer(20);

    if (intervalRef.current) window.clearInterval(intervalRef.current);
    intervalRef.current = window.setInterval(() => {
      setTimer((t) => t - 1);
    }, 1000);

    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
  }, [playing, currentIndex]);

  async function startGame() {
    setLoading(true);
    setError(null);
    setReveal(null);
    setFinished(false);
    setHints([]);
    setHintsLeft(3);

    const res = await fetch("/api/game/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ genre }),
    });

    const data = (await res.json().catch(() => null)) as GameStartRes | null;
    setLoading(false);

    if (!res.ok || !data || !("ok" in data) || data.ok === false) {
      setError((data && "error" in data ? data.error : null) ?? "Не удалось начать игру.");
      return;
    }

    setSessionId(data.sessionId);
    setTotal(data.total);
    setCurrentIndex(data.currentIndex);
    setFactText(data.fact.text);
  }

  async function takeHint() {
    if (!sessionId) return;
    setLoading(true);
    setError(null);

    const res = await fetch("/api/game/hint", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    });
    const data = (await res.json().catch(() => null)) as HintRes | null;
    setLoading(false);

    if (!res.ok || !data || ("ok" in data && data.ok === false)) {
      setError((data && "error" in data ? data.error : null) ?? "Не удалось получить подсказку.");
      return;
    }

    if (data.ok) {
      setHints((h) => [...h, data.hint]);
      setHintsLeft(data.hintsLeft);
    }
  }

  // Slightly hacky: keep the last answer response in a ref so "Дальше" can advance without extra API.
  const lastAnswerRef = useRef<AnswerRes | null>(null);
  async function submitAnswerAndStore(answer: boolean | null) {
    if (!sessionId) return;
    setLoading(true);
    setError(null);

    if (intervalRef.current) window.clearInterval(intervalRef.current);
    intervalRef.current = null;

    const res = await fetch("/api/game/answer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, answer }),
    });
    const data = (await res.json().catch(() => null)) as AnswerRes | null;
    setLoading(false);

    if (!res.ok || !data || ("ok" in data && data.ok === false)) {
      setError((data && "error" in data ? data.error : null) ?? "Не удалось отправить ответ.");
      return;
    }

    lastAnswerRef.current = data;
    if (data.ok) {
      setReveal(data.result);
      setFinished(data.finished);
      await refreshStats();
    }
  }

  // use submitAnswerAndStore everywhere
  async function onTruth() {
    await submitAnswerAndStore(true);
  }
  async function onLie() {
    await submitAnswerAndStore(false);
  }
  async function onTimeout() {
    await submitAnswerAndStore(null);
  }

  useEffect(() => {
    if (!playing) return;
    if (timer > 0) return;
    void onTimeout();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timer, playing]);

  function advanceFromStoredNext() {
    const data = lastAnswerRef.current;
    if (!data || !("ok" in data) || data.ok === false) return;
    if (!data.next) return;

    setCurrentIndex(data.next.currentIndex);
    setFactText(data.next.fact.text);
    setReveal(null);
    setHints([]);
    setHintsLeft(3);
    setTimer(20);
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-3 sm:grid-cols-3">
        <Pill label="Точность" value={`${Math.round(stats.accuracy)}%`} />
        <Pill label="Серия побед" value={`${stats.winStreak}`} />
        <Pill label="Всего раундов" value={`${stats.totalRounds}`} />
      </section>

      {!sessionId ? (
        <section className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-[0_0_0_1px_rgba(255,255,255,0.06)_inset]">
          <h1 className="text-3xl font-black tracking-tight">Игра</h1>
          <p className="mt-2 text-sm text-white/70">
            Выберите жанр и нажмите «Играть». Подсказок — до 3 на вопрос.
          </p>

          <div className="mt-6 grid gap-2 sm:grid-cols-4">
            {(["MIXED", "SCIENCE", "HISTORY", "WEIRD"] as const).map((g) => (
              <button
                key={g}
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
        <section className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-[0_0_0_1px_rgba(255,255,255,0.06)_inset]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm font-semibold text-white/70">
              Вопрос <span className="text-white">{currentIndex + 1}</span> из{" "}
              <span className="text-white">{total}</span>
            </div>

            <div className="rounded-full border border-white/10 bg-black/30 px-4 py-2 text-sm font-semibold text-white/80">
              Таймер: <span className="text-white">{Math.max(timer, 0)}с</span>
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={takeHint}
              disabled={loading || !!reveal || hintsLeft <= 0}
            >
              Подсказка ({hintsLeft}/3)
            </Button>
          </div>

          <div className="mt-6 rounded-3xl border border-white/10 bg-black/25 p-7">
            <div className="text-xs font-semibold text-white/60">Факт</div>
            <div className="mt-3 text-pretty text-xl font-bold leading-8">{factText}</div>
          </div>

          {hints.length ? (
            <div className="mt-5 grid gap-2">
              {hints.map((h, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-violet-400/20 bg-violet-500/10 px-4 py-3 text-sm text-violet-100/90"
                >
                  <span className="font-semibold text-violet-200">Улика {idx + 1}:</span>{" "}
                  {h}
                </div>
              ))}
            </div>
          ) : null}

          {error ? (
            <div className="mt-5 rounded-2xl border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {error}
            </div>
          ) : null}

          {!reveal ? (
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              <Button size="lg" onClick={onTruth} disabled={loading}>
                Правда
              </Button>
              <Button size="lg" variant="secondary" onClick={onLie} disabled={loading}>
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
                <div className="text-sm font-bold">
                  {reveal.isCorrect ? "Верно!" : "Неверно."}{" "}
                  <span className="text-white/70">
                    Правильный ответ: {reveal.correctAnswer ? "правда" : "ложь"}
                  </span>
                </div>
                <div className="mt-2 text-sm text-white/70">{reveal.crowdText}</div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-black/25 p-6">
                <div className="text-xs font-semibold text-white/60">Почему это правда/ложь?</div>
                <div className="mt-3 text-sm leading-6 text-white/80">{reveal.explanation}</div>
                <div className="mt-4 text-xs font-semibold text-white/60">Источники</div>
                <div className="mt-2 text-sm leading-6 text-white/70">{reveal.sources}</div>
                <div className="mt-4 text-sm text-violet-200/90">{reveal.funnyComment}</div>
              </div>

              {finished ? (
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button size="lg" onClick={() => window.location.reload()}>
                    Сыграть ещё раз
                  </Button>
                  <Button
                    size="lg"
                    variant="secondary"
                    onClick={() => {
                      setSessionId(null);
                      setFactText(null);
                      setReveal(null);
                      setFinished(false);
                      setHints([]);
                      setHintsLeft(3);
                    }}
                  >
                    Выбор жанра
                  </Button>
                </div>
              ) : (
                <Button size="lg" onClick={advanceFromStoredNext}>
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

