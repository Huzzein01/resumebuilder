import { useMemo } from "react";
import GlobalNav from "../components/GlobalNav.js";
import { useSetSidebar } from "../shell/ShellContext.js";
import { useNav, type AppView } from "../shell/NavContext.js";

interface AppCard {
  id: string;
  icon: string;
  title: string;
  description: string;
  view: AppView;
  group: "Create/Import" | "AI Tools";
}

const CARDS: AppCard[] = [
  {
    id: "resume-builder",
    icon: "📄",
    title: "Resume Builder",
    description: "Create a standout, professional resume with smart, guided sections.",
    view: { page: "editor-profile" },
    group: "Create/Import",
  },
  {
    id: "cover-letter-builder",
    icon: "✉️",
    title: "Cover Letter Builder",
    description: "Generate a cover letter tailored to a specific job description.",
    view: { page: "editor-jd" },
    group: "Create/Import",
  },
  {
    id: "ai-resume-review",
    icon: "🔎",
    title: "AI Resume Review",
    description: "Get instant, qualitative AI feedback to strengthen your resume.",
    view: { page: "editor-profile" },
    group: "AI Tools",
  },
  {
    id: "ai-letter-review",
    icon: "📝",
    title: "AI Letter Review",
    description: "Get AI feedback on what makes a strong cover letter for your background.",
    view: { page: "career-tool", kind: "letter-review" },
    group: "AI Tools",
  },
  {
    id: "ai-question-generator",
    icon: "❓",
    title: "AI Question Generator",
    description: "Generate tailored interview questions for any target role, instantly.",
    view: { page: "career-tool", kind: "interview-questions" },
    group: "AI Tools",
  },
  {
    id: "ai-career-path",
    icon: "🧭",
    title: "AI Career Path",
    description: "Discover plausible next-role paths based on your skills and experience.",
    view: { page: "career-tool", kind: "career-path" },
    group: "AI Tools",
  },
  {
    id: "ai-career-financials",
    icon: "📈",
    title: "AI Career Financials",
    description: "A rough, AI-estimated salary range for your likely next role -- not a quote.",
    view: { page: "career-tool", kind: "career-financials" },
    group: "AI Tools",
  },
  {
    id: "linkedin-optimization",
    icon: "in",
    title: "LinkedIn Optimization",
    description: "AI suggestions for your LinkedIn headline and About section.",
    view: { page: "career-tool", kind: "linkedin-optimization" },
    group: "AI Tools",
  },
];

export default function AppsHome() {
  const { navigate } = useNav();
  const sidebarNode = useMemo(() => <GlobalNav active="apps" />, []);
  useSetSidebar(sidebarNode);

  return (
    <div className="app">
      <h1 className="page-title">What would you like to do today?</h1>
      <p className="status">Choose from the tools below to build, review, or plan around your resume.</p>

      {(["Create/Import", "AI Tools"] as const).map((group) => (
        <div key={group} className="apps-group">
          <h2 className="apps-group-title">{group}</h2>
          <div className="apps-grid">
            {CARDS.filter((c) => c.group === group).map((card) => (
              <button key={card.id} className="app-card" onClick={() => navigate(card.view)} type="button">
                <span className="app-card-icon" aria-hidden="true">
                  {card.icon}
                </span>
                <span className="app-card-title">{card.title}</span>
                <span className="app-card-description">{card.description}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
