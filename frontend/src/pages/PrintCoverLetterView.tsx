import { useEffect, useState } from "react";
import type { CoverLetterContent } from "@resumebuilder/shared";
import { fetchCoverLetter } from "../api/resumeVersionApi.js";
import CoverLetterDoc from "../templates/CoverLetterDoc.js";

interface Props {
  id: string;
  companyName?: string;
  hiringManagerName?: string;
}

export default function PrintCoverLetterView({ id, companyName, hiringManagerName }: Props) {
  const [letter, setLetter] = useState<CoverLetterContent | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    document.body.classList.add("print-mode");
    fetchCoverLetter(id, { companyName, hiringManagerName })
      .then(setLetter)
      .catch(() => setError(true));
  }, [id, companyName, hiringManagerName]);

  if (error) return <div>Failed to load cover letter.</div>;
  if (!letter) return <div>Loading…</div>;

  return <CoverLetterDoc letter={letter} />;
}
