import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { getAiModeEnabled, setAiModeEnabled } from "../aiMode.js";

interface AiModeContextValue {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
}

const AiModeContext = createContext<AiModeContextValue | null>(null);

export function AiModeProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabledState] = useState<boolean>(getAiModeEnabled);

  const value = useMemo<AiModeContextValue>(
    () => ({
      enabled,
      setEnabled: (next: boolean) => {
        setAiModeEnabled(next);
        setEnabledState(next);
      },
    }),
    [enabled]
  );

  return <AiModeContext.Provider value={value}>{children}</AiModeContext.Provider>;
}

export function useAiMode(): AiModeContextValue {
  const ctx = useContext(AiModeContext);
  if (!ctx) throw new Error("useAiMode must be used within an AiModeProvider");
  return ctx;
}
