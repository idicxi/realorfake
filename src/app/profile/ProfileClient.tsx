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

export default function ProfileClient({
  name,
  image,
  stats,
  achievements,
}: {
  name: string;
  image?: string | null;
  stats: { accuracy: number; winStreak: number; totalRounds: number };
  achievements: Achievement[];
}) {
  const [showAll, setShowAll] = useState(false);
  const list = showAll ? achievements : achievements.slice(0, 3);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-[0_0_0_1px_rgba(255,255,255,0.06)_inset]">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="relative h-16 w-16 overflow-hidden rounded-2xl bg-white/10 shadow-[0_0_0_1px_rgba(255,255,255,0.12)_inset]">
              {image ? (
                <Image src={image} alt={name} fill className="object-cover" />
              ) : (
                <div className="grid h-full w-full place-items-center text-xl font-black text-white/90">
                  {(name?.trim()?.[0] ?? "U").toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <div className="text-2xl font-black tracking-tight">{name}</div>
              <div className="mt-1 text-sm text-white/60">Ваш профиль и прогресс</div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3">
              <div className="text-xs font-semibold text-white/60">Точность</div>
              <div className="mt-1 text-lg font-black">{Math.round(stats.accuracy)}%</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3">
              <div className="text-xs font-semibold text-white/60">Серия</div>
              <div className="mt-1 text-lg font-black">{stats.winStreak}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3">
              <div className="text-xs font-semibold text-white/60">Раунды</div>
              <div className="mt-1 text-lg font-black">{stats.totalRounds}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-[0_0_0_1px_rgba(255,255,255,0.06)_inset]">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-black tracking-tight">Достижения</h2>
          {achievements.length > 3 ? (
            <Button variant="secondary" size="sm" onClick={() => setShowAll((v) => !v)}>
              {showAll ? "Свернуть" : "Показать все"}
            </Button>
          ) : null}
        </div>

        {achievements.length === 0 ? (
          <p className="mt-3 text-sm text-white/70">
            Пока нет достижений. Сыграйте пару раундов — и они появятся.
          </p>
        ) : (
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {list.map((a) => (
              <div
                key={a.id}
                className="rounded-3xl border border-white/10 bg-black/25 p-6"
              >
                <div className="text-xs font-semibold text-violet-200/90">#{a.icon}</div>
                <div className="mt-2 text-lg font-bold">{a.title}</div>
                <div className="mt-2 text-sm text-white/70">{a.description}</div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

