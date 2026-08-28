import type { ReactNode } from "react";
import { useShellSlots } from "./ShellContext.js";
import Logo from "../components/Logo.js";
import AccountMenu from "../components/AccountMenu.js";

interface AppShellProps {
  /** Called when the brand/logo is clicked -- returns to the Apps dashboard. */
  onHome: () => void;
  /** Optional close ("X") button shown in editor views, returning to the dashboard the same way clicking the brand does. */
  showClose?: boolean;
  saveStatus?: ReactNode;
  children: ReactNode;
}

/**
 * Persistent app chrome: a top toolbar (brand, page-specific promoted
 * action) and a left sidebar (page-specific nav -- either the global
 * Apps/Templates/My Drive/Trash rail on dashboard pages, or a
 * jump-to-section nav inside an editor, both via useSetSidebar), wrapping a
 * scrollable main content area. Primary navigation lives in the sidebar
 * (GlobalNav) rather than a top tab switcher, matching the left-rail
 * structure of the app's reference design.
 */
export default function AppShell({ onHome, showClose, saveStatus, children }: AppShellProps) {
  const { sidebar, topBarExtra } = useShellSlots();

  return (
    <div className="shell">
      <header className="shell-topbar">
        <button className="shell-brand shell-brand-button" onClick={onHome} title="Back to Apps">
          <Logo />
          <span className="brand-name">Resume Tailor</span>
        </button>
        <div className="shell-topbar-extra">
          {topBarExtra}
          {saveStatus}
          <AccountMenu />
          {showClose && (
            <button className="shell-close" onClick={onHome} title="Close" aria-label="Close">
              ✕
            </button>
          )}
        </div>
      </header>
      <div className="shell-body">
        <aside className="shell-sidebar">{sidebar}</aside>
        <main className="shell-main">{children}</main>
      </div>
    </div>
  );
}
