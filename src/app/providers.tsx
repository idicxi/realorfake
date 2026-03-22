"use client";

import { SessionProvider } from "next-auth/react";
import type { Session } from "next-auth";

import { AchievementToastHost } from "@/components/AchievementToastHost";
import { GameSessionProvider } from "@/context/GameSessionContext";

export function Providers({
  children,
  session,
}: {
  children: React.ReactNode;
  session: Session | null;
}) {
  return (
    <SessionProvider session={session}>
      <GameSessionProvider>
        <AchievementToastHost />
        {children}
      </GameSessionProvider>
    </SessionProvider>
  );
}

