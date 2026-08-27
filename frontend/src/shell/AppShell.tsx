import type { ReactNode } from "react";
import { useShellSlots } from "./ShellContext.js";
import AiModeToggle from "../components/AiModeToggle.js";
import Logo from "../components/Logo.js";

type Tab = "profile" | "jobDescription";

interface AppShellProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  saveStatus?: ReactNode;
  children: ReactNode;
}

/**
 * Persistent app chrome: a top toolbar (brand, tab switcher, page-specific
 * promoted action) and a left sidebar (page-specific section nav), wrapping
 * a scrollable main content area. Replaces the old scroll-down-the-page
 * layout where every feature -- including the cover letter -- was buried
 * behind whatever came before it.
 */
export default function AppShell({ activeTab, onTabChange, saveStatus, children }: AppShellProps) {
  const { sidebar, topBarExtra } = useShellSlots();

  return (
    <div className="shell">
      <header className="shell-topbar">
        <div className="shell-brand">
          <Logo />
          <span className="brand-name">Resume Tailor</span>
        </div>
        <nav className="shell-tabs" aria-label="Main">
          <button className={activeTab === "profile" ? "active" : ""} onClick={() => onTabChange("profile")}>
            Profile
          </button>
          <button
            className={activeTab === "jobDescription" ? "active" : ""}
            onClick={() => onTabChange("jobDescription")}
          >
            Tailor Resume
          </button>
        </nav>
        <div className="shell-topbar-extra">
          <AiModeToggle />
          {topBarExtra}
          {saveStatus}
        </div>
      </header>
      <div className="shell-body">
        <aside className="shell-sidebar">{sidebar}</aside>
        <main className="shell-main">{children}</main>
      </div>
    </div>
  );
}
