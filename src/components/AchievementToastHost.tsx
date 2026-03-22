"use client";

import { useEffect, useState } from "react";

export type AchievementPayload = { title: string; description: string; key: string };

type ToastItem = AchievementPayload & { id: string };

export function AchievementToastHost() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<AchievementPayload[]>;
      const list = ce.detail ?? [];
      if (!list.length) return;
      list.forEach((payload, i) => {
        const id = `${payload.key}-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 8)}`;
        setItems((prev) => [...prev, { ...payload, id }]);
        window.setTimeout(() => {
          setItems((prev) => prev.filter((x) => x.id !== id));
        }, 4500 + i * 350);
      });
    };
    window.addEventListener("achievement-unlocked", handler as EventListener);
    return () => window.removeEventListener("achievement-unlocked", handler as EventListener);
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="pointer-events-none fixed bottom-6 left-4 z-[100] flex w-[min(92vw,380px)] flex-col gap-2">
      {items.map((current) => (
        <div
          key={current.id}
          className="pointer-events-auto origin-bottom-left transition-all duration-300 ease-out"
        >
          <div className="rounded-2xl border border-violet-400/40 bg-gradient-to-br from-[#1a0b2e]/95 via-[#12081f]/95 to-[#0d0615]/95 px-5 py-4 shadow-[0_24px_80px_rgba(88,28,135,0.35),0_0_0_1px_rgba(255,255,255,0.08)_inset] backdrop-blur-xl">
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-300/90">
              Новое достижение
            </div>
            <div className="mt-1.5 text-lg font-black tracking-tight text-white">{current.title}</div>
            <div className="mt-1 text-sm leading-snug text-white/65">{current.description}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
