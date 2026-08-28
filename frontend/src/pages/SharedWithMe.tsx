import { useMemo } from "react";
import GlobalNav from "../components/GlobalNav.js";
import { useSetSidebar } from "../shell/ShellContext.js";

export default function SharedWithMe() {
  const sidebarNode = useMemo(() => <GlobalNav active="shared" />, []);
  useSetSidebar(sidebarNode);

  return (
    <div className="app">
      <h1 className="page-title">Shared with me</h1>
      <section className="form-section">
        <p className="status">
          This app runs as a single profile with no user accounts yet, so there's no one else who could share a
          resume with you here. From My Drive, you can already share a resume you own via email or LinkedIn --
          receiving one from someone else needs real multi-user accounts, which isn't built yet.
        </p>
      </section>
    </div>
  );
}
