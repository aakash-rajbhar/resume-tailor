import type { TailoredResume } from "./types";

/**
 * Flattens a resume into plain text so scoring sees every skill, tool and
 * phrase the candidate claims. Contact details are skipped: they never carry
 * keywords.
 */
export function resumeToText(resume: TailoredResume): string {
  const parts: string[] = [];

  if (resume.title) parts.push(resume.title);
  if (resume.summary) parts.push(resume.summary);

  for (const group of resume.skills ?? []) {
    parts.push(group.label, group.value);
  }

  for (const role of resume.experience ?? []) {
    parts.push(role.title, role.company, role.location);
    parts.push(...(role.bullets ?? []));
  }

  for (const project of resume.projects ?? []) {
    parts.push(project.name, project.tools);
    parts.push(...(project.bullets ?? []));
  }

  for (const entry of resume.education ?? []) {
    parts.push(entry.school, entry.degree);
  }

  parts.push(...(resume.certifications ?? []));

  return parts.filter(Boolean).join("\n");
}
