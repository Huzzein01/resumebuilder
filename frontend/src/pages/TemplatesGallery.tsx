import { useMemo } from "react";
import { RESUME_TEMPLATES } from "@resumebuilder/shared";
import GlobalNav from "../components/GlobalNav.js";
import { useSetSidebar } from "../shell/ShellContext.js";
import { useNav } from "../shell/NavContext.js";

export default function TemplatesGallery() {
  const { navigate } = useNav();
  const sidebarNode = useMemo(() => <GlobalNav active="templates" />, []);
  useSetSidebar(sidebarNode);

  return (
    <div className="app">
      <h1 className="page-title">Templates</h1>
      <p className="status">
        Pick a template while tailoring a resume, or in the Resume Builder's own preview -- both switch live as you
        hover. Every template exports to both PDF and DOCX.
      </p>
      <div className="template-gallery">
        {RESUME_TEMPLATES.map((t) => (
          <button
            key={t.id}
            className="template-gallery-card"
            onClick={() => navigate({ page: "editor-jd" })}
            type="button"
          >
            <div className={`template-thumb template-thumb-${t.id}`}>
              {t.id === "modern-sidebar" && <div className="template-thumb-sidebar" />}
              <div className="template-thumb-lines">
                <div className="template-thumb-line template-thumb-line-title" />
                <div className="template-thumb-line" />
                <div className="template-thumb-line" />
                <div className="template-thumb-line short" />
              </div>
            </div>
            <span className="template-gallery-name">{t.name}</span>
            <div className="template-gallery-badges">
              {t.atsFriendly && <span className="pill pill-nice">ATS-Friendly</span>}
              <span className="pill pill-nice">PDF</span>
              <span className="pill pill-nice">DOCX</span>
            </div>
            <span className="template-gallery-description">{t.description}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
