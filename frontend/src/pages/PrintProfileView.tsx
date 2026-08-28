import { useEffect, useState } from "react";
import { buildFullResume, isResumeTemplateId, DEFAULT_RESUME_TEMPLATE_ID, type Profile } from "@resumebuilder/shared";
import { fetchProfile } from "../api/profileApi.js";
import { resolveTemplateComponent } from "../templates/registry.js";

interface Props {
  templateParam: string | null;
}

/** Puppeteer's target for the Master Profile "Download" button -- see backend/src/export/pdf.ts renderProfileToPdf. Renders the whole profile, untailored, in the requested template. */
export default function PrintProfileView({ templateParam }: Props) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    document.body.classList.add("print-mode");
    fetchProfile()
      .then(setProfile)
      .catch(() => setError(true));
  }, []);

  if (error) return <div>Failed to load profile.</div>;
  if (!profile) return <div>Loading…</div>;

  const templateId = isResumeTemplateId(templateParam) ? templateParam : DEFAULT_RESUME_TEMPLATE_ID;
  const Template = resolveTemplateComponent(templateId);
  return <Template resume={buildFullResume(profile)} />;
}
