import { useState } from "react";
import ProfileEditor from "./pages/ProfileEditor.js";
import JobDescriptionPage from "./pages/JobDescriptionPage.js";
import AppShell from "./shell/AppShell.js";
import { ShellProvider } from "./shell/ShellContext.js";

type Tab = "profile" | "jobDescription";

export default function App() {
  const [tab, setTab] = useState<Tab>("profile");

  return (
    <ShellProvider>
      <AppShell activeTab={tab} onTabChange={setTab}>
        {tab === "profile" ? <ProfileEditor /> : <JobDescriptionPage />}
      </AppShell>
    </ShellProvider>
  );
}
