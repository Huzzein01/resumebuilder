import { useEffect, useMemo, useState } from "react";
import type { ResumeVersion } from "@resumebuilder/shared";
import { listResumeVersions, renameResumeVersion, trashResumeVersion } from "../api/resumeVersionApi.js";
import { API_BASE_URL } from "../api/config.js";
import GlobalNav from "../components/GlobalNav.js";
import { useSetSidebar } from "../shell/ShellContext.js";

type Status = "loading" | "ready" | "error";

function shareEmailHref(version: ResumeVersion): string {
  const pdfUrl = `${API_BASE_URL}/resume-versions/${version.id}/pdf`;
  const subject = encodeURIComponent(`Resume: ${version.title}`);
  const body = encodeURIComponent(`Here's my resume, "${version.title}":\n\n${pdfUrl}`);
  return `mailto:?subject=${subject}&body=${body}`;
}

function shareLinkedInHref(version: ResumeVersion): string {
  const pdfUrl = `${API_BASE_URL}/resume-versions/${version.id}/pdf`;
  return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(pdfUrl)}`;
}

export default function MyDrive() {
  const [versions, setVersions] = useState<ResumeVersion[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const sidebarNode = useMemo(() => <GlobalNav active="drive" />, []);
  useSetSidebar(sidebarNode);

  function load() {
    setStatus("loading");
    listResumeVersions()
      .then((v) => {
        setVersions(v);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }

  useEffect(load, []);

  async function handleTrash(id: string) {
    await trashResumeVersion(id);
    setVersions((prev) => prev.filter((v) => v.id !== id));
  }

  function startRename(version: ResumeVersion) {
    setRenamingId(version.id);
    setRenameValue(version.title);
  }

  async function commitRename(id: string) {
    if (!renameValue.trim()) {
      setRenamingId(null);
      return;
    }
    const updated = await renameResumeVersion(id, renameValue.trim());
    setVersions((prev) => prev.map((v) => (v.id === id ? updated : v)));
    setRenamingId(null);
  }

  return (
    <div className="app">
      <h1 className="page-title">My Drive</h1>
      <p className="status">Every resume version you've generated -- rename, export, share, or move to trash.</p>

      {status === "loading" && <p className="status">Loading…</p>}
      {status === "error" && <p className="status">Failed to load your drive.</p>}
      {status === "ready" && versions.length === 0 && (
        <p className="status">
          Nothing here yet -- generate a resume from the Tailor Resume flow and it'll show up here.
        </p>
      )}

      {status === "ready" && versions.length > 0 && (
        <div className="drive-list">
          {versions.map((v) => (
            <div className="drive-row" key={v.id}>
              <div className="drive-row-main">
                {renamingId === v.id ? (
                  <input
                    autoFocus
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onBlur={() => commitRename(v.id)}
                    onKeyDown={(e) => e.key === "Enter" && commitRename(v.id)}
                  />
                ) : (
                  <span className="drive-row-title" onClick={() => startRename(v)}>
                    {v.title}
                  </span>
                )}
                <span className="drive-row-meta">
                  Score {v.overallScore} · Updated {new Date(v.updatedAt).toLocaleDateString()}
                </span>
              </div>
              <div className="drive-row-actions">
                <a className="secondary" href={`${API_BASE_URL}/resume-versions/${v.id}/pdf`} target="_blank" rel="noreferrer">
                  PDF
                </a>
                <a className="secondary" href={`${API_BASE_URL}/resume-versions/${v.id}/docx`} target="_blank" rel="noreferrer">
                  DOCX
                </a>
                <a className="secondary" href={shareEmailHref(v)}>
                  Email
                </a>
                <a className="secondary" href={shareLinkedInHref(v)} target="_blank" rel="noreferrer">
                  LinkedIn
                </a>
                <button className="danger" onClick={() => handleTrash(v.id)}>
                  Trash
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
