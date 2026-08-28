import { createContext, useContext, type ReactNode } from "react";
import type { CareerToolKind } from "@resumebuilder/shared";

export type AppView =
  | { page: "apps" }
  | { page: "templates" }
  | { page: "drive" }
  | { page: "shared" }
  | { page: "trash" }
  | { page: "account-profile" }
  | { page: "account-settings" }
  | { page: "editor-profile" }
  | { page: "editor-jd"; resumeVersionId?: string }
  | { page: "career-tool"; kind: CareerToolKind };

interface NavContextValue {
  navigate: (view: AppView) => void;
}

const NavContext = createContext<NavContextValue | null>(null);

export function NavProvider({ navigate, children }: { navigate: (view: AppView) => void; children: ReactNode }) {
  return <NavContext.Provider value={{ navigate }}>{children}</NavContext.Provider>;
}

export function useNav(): NavContextValue {
  const ctx = useContext(NavContext);
  if (!ctx) throw new Error("useNav must be used within a NavProvider");
  return ctx;
}
