import { useMemo, useState } from "react";
import type { CareerToolInsight, CareerToolKind } from "@resumebuilder/shared";
import { fetchCareerToolInsights } from "../api/careerToolsApi.js";
import GlobalNav from "../components/GlobalNav.js";
import { useSetSidebar, useSetTopBarExtra } from "../shell/ShellContext.js";
import { useAiMode } from "../shell/AiModeContext.js";

type Status = "idle" | "loading" | "loaded" | "error";

const TOOL_META: Record<
  CareerToolKind,
  { title: string; description: string; showTargetRole: boolean; showJobContext: boolean }
> = {
  "interview-questions": {
    title: "AI Question Generator",
    description:
      "Generate likely interview questions for an upcoming interview. Paste the job description and company name for questions grounded in the actual posting.",
    showTargetRole: true,
    showJobContext: true,
  },
  "career-path": {
    title: "AI Career Path",
    description: "Plausible next-role paths based on your skills and experience, with a rationale for each.",
    showTargetRole: false,
    showJobContext: false,
  },
  "career-financials": {
    title: "AI Career Financials",
    description:
      "A rough, order-of-magnitude salary estimate for your likely next role. This is a general AI estimate, not a quote, offer, or financial advice -- actual compensation varies significantly by location, company, and market.",
    showTargetRole: true,
    showJobContext: false,
  },
  "linkedin-optimization": {
    title: "LinkedIn Optimization",
    description:
      "AI suggestions for your LinkedIn headline and About section, based on your profile. Copy what's useful into LinkedIn yourself -- this doesn't connect to your LinkedIn account.",
    showTargetRole: false,
    showJobContext: false,
  },
  "letter-review": {
    title: "AI Letter Review",
    description: "AI feedback on what should make a strong cover letter for your background.",
    showTargetRole: true,
    showJobContext: true,
  },
};

interface Props {
  kind: CareerToolKind;
}

export default function CareerToolPage({ kind }: Props) {
  const [status, setStatus] = useState<Status>("idle");
  const [insights, setInsights] = useState<CareerToolInsight[]>([]);
  const [targetRole, setTargetRole] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const { enabled: aiModeEnabled } = useAiMode();
  const meta = TOOL_META[kind];

  const sidebarNode = useMemo(() => <GlobalNav active="apps" />, []);
  useSetSidebar(sidebarNode);
  useSetTopBarExtra(null);

  async function handleGenerate() {
    setStatus("loading");
    try {
      const result = await fetchCareerToolInsights(kind, {
        targetRole: targetRole.trim() || undefined,
        companyName: companyName.trim() || undefined,
        jobDescription: jobDescription.trim() || undefined,
      });
      setInsights(result.insights);
      setStatus("loaded");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="app">
      <h1 className="page-title">{meta.title}</h1>
      <section className="form-section">
        <p className="status">{meta.description}</p>

        {meta.showJobContext && (
          <p className="status">
            This runs entirely on the model's own training knowledge and whatever you paste below -- it can't
            browse the web or look the company up live, so it won't know anything beyond what's public knowledge
            baked into the model or what you give it here.
          </p>
        )}

        {!aiModeEnabled && (
          <p className="status">
            This tool is AI-only -- switch to AI Mode in Settings, then a provider key needs to be configured
            server-side for it to actually run.
          </p>
        )}

        {meta.showTargetRole && (
          <div className="field" style={{ maxWidth: 360 }}>
            <label>Target role (optional)</label>
            <input
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="e.g. Senior Backend Engineer"
            />
          </div>
        )}

        {meta.showJobContext && (
          <>
            <div className="field" style={{ maxWidth: 360 }}>
              <label>Company name (optional)</label>
              <input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Acme Corp"
              />
            </div>
            <div className="field">
              <label>Job description (optional, but recommended)</label>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the job posting here for questions grounded in what it actually asks for..."
                rows={6}
              />
            </div>
          </>
        )}

        <div className="ai-action-cta">
          <button
            type="button"
            className="primary"
            onClick={handleGenerate}
            disabled={!aiModeEnabled || status === "loading"}
          >
            {status === "loading" ? "Generating…" : "Generate"}
          </button>
          {status === "error" && <span className="status">Something went wrong.</span>}
        </div>

        {status === "loaded" && (
          <div className="ai-suggestions">
            {insights.length === 0 ? (
              <p className="status">
                No result -- this usually means no LLM provider key is configured yet, so there's nothing to show.
              </p>
            ) : (
              <ul className="suggestion-list">
                {insights.map((insight) => (
                  <li key={insight.id} className="suggestion">
                    <span className="suggestion-severity-dot suggestion-severity-dot-ai" aria-hidden="true" />
                    <div className="suggestion-body">
                      <span className="suggestion-message">{insight.message}</span>
                      <span className="pill pill-ai suggestion-category-pill">AI</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
