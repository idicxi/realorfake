"use client";

import Image from "next/image";
import { useState } from "react";

import { Button } from "@/components/ui/Button";

type Achievement = {
  id: string;
  title: string;
  description: string;
  icon: string;
  createdAt: string;
};

type LockedAchievement = {
  id: string;
  title: string;
  description: string;
  icon: string;
};

export default function ProfileClient({
  name,
  image,
  stats,
  achievements,
  lockedAchievements,
}: {
  name: string;
  image?: string | null;
  stats: { accuracy: number; winStreak: number; totalRounds: number };
  achievements: Achievement[];
  lockedAchievements: LockedAchievement[];
}) {
  const [showAllUnlocked, setShowAllUnlocked] = useState(false);
  const previewUnlocked = showAllUnlocked ? achievements : achievements.slice(0, 2);

  return (
    <div className="space-y-8">
      <section className="glass-card relative overflow-hidden p-8 md:p-10">
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-0 h-48 w-48 rounded-full bg-fuchsia-500/15 blur-3xl" />
        <div className="relative flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-5">
            <div className="relative h-20 w-20 overflow-hidden rounded-2xl border border-white/15 bg-white/10 shadow-[0_0_0_1px_rgba(255,255,255,0.08)_inset] ring-2 ring-violet-500/20">
              {image ? (
                <Image src={image} alt={name} fill className="object-cover" />
              ) : (
                <div className="grid h-full w-full place-items-center text-2xl font-black text-white/90">
                  {(name?.trim()?.[0] ?? "U").toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <div className="text-3xl font-black tracking-tight text-white">{name}</div>
              <div className="mt-1 text-sm text-white/55">Профиль и прогресс</div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Точность", value: `${Math.round(stats.accuracy)}%` },
              { label: "Серия", value: `${stats.winStreak}` },
              { label: "Раунды", value: `${stats.totalRounds}` },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-center shadow-inner"
              >
                <div className="text-[10px] font-bold uppercase tracking-wider text-white/45">
                  {s.label}
                </div>
                <div className="mt-1 text-xl font-black text-violet-100">{s.value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="glass-card p-8 md:p-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-2xl font-black tracking-tight text-white">Достижения</h2>
          {achievements.length > 2 ? (
            <Button variant="secondary" size="sm" onClick={() => setShowAllUnlocked((v) => !v)}>
              {showAllUnlocked ? "Свернуть" : "Развернуть все"}
            </Button>
          ) : null}
        </div>

        {achievements.length === 0 ? (
          <p className="mt-4 text-sm text-white/60">
            Пока нет открытых достижений — сыграйте квиз из трёх вопросов.
          </p>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {previewUnlocked.map((a) => (
              <div
                key={a.id}
                className="rounded-2xl border border-violet-400/25 bg-gradient-to-br from-violet-500/15 to-transparent p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.06)_inset]"
              >
                <div className="text-xs font-semibold text-violet-200/80">{a.icon}</div>
                <div className="mt-2 text-lg font-bold text-white">{a.title}</div>
                <div className="mt-2 text-sm leading-relaxed text-white/70">{a.description}</div>
              </div>
            ))}
          </div>
        )}

        {lockedAchievements.length > 0 ? (
          <>
            <div className="my-10 flex items-center gap-4">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/25 to-transparent" />
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-white/35">
                ещё не открыто
              </span>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/25 to-transparent" />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {lockedAchievements.map((a) => (
                <div
                  key={a.id}
                  className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 opacity-45 grayscale-[0.3]"
                >
                  <div className="text-xs font-semibold text-white/35">{a.icon}</div>
                  <div className="mt-2 text-base font-bold text-white/50">{a.title}</div>
                  <div className="mt-2 text-sm text-white/40">{a.description}</div>
                  <div className="mt-3 inline-flex rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/35">
                    Закрыто
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : null}
      </section>
    </div>
  );
}
