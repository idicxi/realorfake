"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

type GameSessionContextValue = {
  activeSessionId: string | null;
  setActiveSessionId: (id: string | null) => void;
};

const GameSessionContext = createContext<GameSessionContextValue | null>(null);

export function GameSessionProvider({ children }: { children: ReactNode }) {
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  const value = useMemo(
    () => ({
      activeSessionId,
      setActiveSessionId,
    }),
    [activeSessionId],
  );

  return <GameSessionContext.Provider value={value}>{children}</GameSessionContext.Provider>;
}

export function useGameSession() {
  return useContext(GameSessionContext);
}
