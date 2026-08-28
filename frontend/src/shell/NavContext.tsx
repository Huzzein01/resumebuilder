import { createContext, useContext, type ReactNode } from "react";
import type { CareerToolKind, ResumeTemplateId } from "@resumebuilder/shared";

export type AppView =
  | { page: "apps" }
  | { page: "templates" }
  | { page: "drive" }
  | { page: "shared" }
  | { page: "trash" }
  | { page: "account-profile" }
  | { page: "account-settings" }
  /** `initialTemplateId` pre-selects a template -- e.g. opening a My Drive resume in the editor starts on the template it was saved with. */
  | { page: "editor-profile"; initialTemplateId?: ResumeTemplateId }
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
