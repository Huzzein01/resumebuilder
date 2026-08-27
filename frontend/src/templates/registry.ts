import type { ComponentType } from "react";
import type { TailoredResume, ResumeTemplateId } from "@resumebuilder/shared";
import { DEFAULT_RESUME_TEMPLATE_ID } from "@resumebuilder/shared";
import SingleColumnResume from "./SingleColumnResume.js";
import ModernSidebarResume from "./ModernSidebarResume.js";

interface TemplateProps {
  resume: TailoredResume;
}

const REGISTRY: Record<ResumeTemplateId, ComponentType<TemplateProps>> = {
  "single-column": SingleColumnResume,
  "modern-sidebar": ModernSidebarResume,
};

export function resolveTemplateComponent(templateName: string | undefined): ComponentType<TemplateProps> {
  if (templateName && templateName in REGISTRY) return REGISTRY[templateName as ResumeTemplateId];
  return REGISTRY[DEFAULT_RESUME_TEMPLATE_ID];
}
