import { useState } from "react";
import { useNav, type AppView } from "../shell/NavContext.js";

export type DashboardView = "apps" | "templates" | "drive" | "shared" | "trash";

interface NavItem {
  id: DashboardView;
  label: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: "apps", label: "Apps", icon: "✨" },
  { id: "templates", label: "Templates", icon: "📑" },
  { id: "drive", label: "My Drive", icon: "🗂️" },
  { id: "shared", label: "Shared with me", icon: "👤" },
  { id: "trash", label: "Trash", icon: "🗑️" },
];

interface Props {
  active: DashboardView;
}

/**
 * The app-level left rail shown on every dashboard page (Apps, Templates,
 * My Drive, Shared with me, Trash) -- distinct from the per-page
 * jump-to-section nav (SectionNav) shown once you're inside an editor.
 */
export default function GlobalNav({ active }: Props) {
  const { navigate } = useNav();
  const [createOpen, setCreateOpen] = useState(false);

  function goCreate(view: AppView) {
    setCreateOpen(false);
    navigate(view);
  }

  return (
    <div className="global-nav">
      <div className="global-nav-create-wrap">
        <button className="global-nav-create" onClick={() => setCreateOpen((v) => !v)} type="button">
          + Create
        </button>
        {createOpen && (
          <div className="global-nav-create-menu">
            <button type="button" onClick={() => goCreate({ page: "editor-profile" })}>
              📄 New Resume
            </button>
            <button type="button" onClick={() => goCreate({ page: "editor-jd" })}>
              ✉️ New Cover Letter
            </button>
          </div>
        )}
      </div>
      <nav className="section-nav" aria-label="Dashboard">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            className={`section-nav-item${active === item.id ? " active" : ""}`}
            onClick={() => navigate({ page: item.id })}
            type="button"
          >
            <span className="section-nav-icon" aria-hidden="true">
              {item.icon}
            </span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
