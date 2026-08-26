import { useState } from "react";
import ProfileEditor from "./pages/ProfileEditor.js";
import JobDescriptionPage from "./pages/JobDescriptionPage.js";

type Tab = "profile" | "jobDescription";

export default function App() {
  const [tab, setTab] = useState<Tab>("profile");

  return (
    <>
      <header className="site-hero">
        <div className="site-hero-inner">
          <div className="brand">
            <span className="brand-mark" aria-hidden="true">
              🧵
            </span>
            <span className="brand-name">Resume Tailor</span>
          </div>
          <nav className="tabs" aria-label="Main">
            <button className={tab === "profile" ? "active" : ""} onClick={() => setTab("profile")}>
              Profile
            </button>
            <button
              className={tab === "jobDescription" ? "active" : ""}
              onClick={() => setTab("jobDescription")}
            >
              Tailor Resume
            </button>
          </nav>
        </div>
        <p className="site-tagline">
          One master profile, tailored to any job — scored transparently, never a black box.
        </p>
      </header>
      {tab === "profile" ? <ProfileEditor /> : <JobDescriptionPage />}
    </>
  );
}
