import { useState } from "react";
import ProfileEditor from "./pages/ProfileEditor.js";
import JobDescriptionPage from "./pages/JobDescriptionPage.js";
import AppsHome from "./pages/AppsHome.js";
import TemplatesGallery from "./pages/TemplatesGallery.js";
import MyDrive from "./pages/MyDrive.js";
import SharedWithMe from "./pages/SharedWithMe.js";
import TrashPage from "./pages/TrashPage.js";
import MyProfilePage from "./pages/MyProfilePage.js";
import SettingsPage from "./pages/SettingsPage.js";
import CareerToolPage from "./pages/CareerToolPage.js";
import AppShell from "./shell/AppShell.js";
import { ShellProvider } from "./shell/ShellContext.js";
import { AiModeProvider } from "./shell/AiModeContext.js";
import { NavProvider, type AppView } from "./shell/NavContext.js";

function renderView(view: AppView) {
  switch (view.page) {
    case "apps":
      return <AppsHome />;
    case "templates":
      return <TemplatesGallery />;
    case "drive":
      return <MyDrive />;
    case "shared":
      return <SharedWithMe />;
    case "trash":
      return <TrashPage />;
    case "account-profile":
      return <MyProfilePage />;
    case "account-settings":
      return <SettingsPage />;
    case "editor-profile":
      // Keyed on the requested template so opening a different My Drive
      // resume (a different initialTemplateId) remounts with the new
      // starting template instead of reusing whatever the last-open
      // editor instance already settled on.
      return <ProfileEditor key={view.initialTemplateId ?? "default"} initialTemplateId={view.initialTemplateId} />;
    case "editor-jd":
      return <JobDescriptionPage />;
    case "career-tool":
      return <CareerToolPage kind={view.kind} />;
  }
}

/** Editor-style views get a "✕ Close" button back to the Apps dashboard, matching every other view's clickable-brand affordance but more discoverable while deep in an editor. */
function isEditorView(view: AppView): boolean {
  return view.page === "editor-profile" || view.page === "editor-jd" || view.page === "career-tool";
}

export default function App() {
  const [view, setView] = useState<AppView>({ page: "apps" });

  return (
    <AiModeProvider>
      <ShellProvider>
        <NavProvider navigate={setView}>
          <AppShell onHome={() => setView({ page: "apps" })} showClose={isEditorView(view)}>
            {renderView(view)}
          </AppShell>
        </NavProvider>
      </ShellProvider>
    </AiModeProvider>
  );
}
