import { useEffect, useMemo, useState } from "react";
import type { ResumeVersion } from "@resumebuilder/shared";
import { listTrashedResumeVersions, restoreResumeVersion, deleteResumeVersion } from "../api/resumeVersionApi.js";
import GlobalNav from "../components/GlobalNav.js";
import { useSetSidebar } from "../shell/ShellContext.js";

type Status = "loading" | "ready" | "error";

export default function TrashPage() {
  const [versions, setVersions] = useState<ResumeVersion[]>([]);
  const [status, setStatus] = useState<Status>("loading");

  const sidebarNode = useMemo(() => <GlobalNav active="trash" />, []);
  useSetSidebar(sidebarNode);

  function load() {
    setStatus("loading");
    listTrashedResumeVersions()
      .then((v) => {
        setVersions(v);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }

  useEffect(load, []);

  async function handleRestore(id: string) {
    await restoreResumeVersion(id);
    setVersions((prev) => prev.filter((v) => v.id !== id));
  }

  async function handleDelete(id: string) {
    await deleteResumeVersion(id);
    setVersions((prev) => prev.filter((v) => v.id !== id));
  }

  return (
    <div className="app">
      <h1 className="page-title">Trash</h1>
      <p className="status">Resumes you've deleted from My Drive. Restore them, or delete permanently.</p>

      {status === "loading" && <p className="status">Loading…</p>}
      {status === "error" && <p className="status">Failed to load trash.</p>}
      {status === "ready" && versions.length === 0 && <p className="status">Trash is empty.</p>}

      {status === "ready" && versions.length > 0 && (
        <div className="drive-list">
          {versions.map((v) => (
            <div className="drive-row" key={v.id}>
              <div className="drive-row-main">
                <span className="drive-row-title">{v.title}</span>
                <span className="drive-row-meta">
                  Trashed {v.trashedAt ? new Date(v.trashedAt).toLocaleDateString() : "recently"}
                </span>
              </div>
              <div className="drive-row-actions">
                <button className="secondary" onClick={() => handleRestore(v.id)}>
                  Restore
                </button>
                <button className="danger" onClick={() => handleDelete(v.id)}>
                  Delete Forever
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
