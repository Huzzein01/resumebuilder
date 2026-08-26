import { useEffect, useState } from "react";
import { buildTailoredResume, type ResumeVersion } from "@resumebuilder/shared";
import { fetchResumeVersion } from "../api/resumeVersionApi.js";
import SingleColumnResume from "../templates/SingleColumnResume.js";

interface Props {
  id: string;
}

export default function PrintView({ id }: Props) {
  const [version, setVersion] = useState<ResumeVersion | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    document.body.classList.add("print-mode");
    fetchResumeVersion(id)
      .then(setVersion)
      .catch(() => setError(true));
  }, [id]);

  if (error) return <div>Failed to load resume.</div>;
  if (!version) return <div>Loading…</div>;

  const resume = buildTailoredResume(version.profileSnapshot, version.selection);
  return <SingleColumnResume resume={resume} />;
}
