import type {
  TailoredResume,
  SkillGroup,
  ExperienceItem,
  ProjectItem,
  EducationItem,
} from "./types";

/**
 * Treats all API/LLM output as untrusted. Coerces every field into the
 * expected shape so a missing/null/malformed field can never crash the UI.
 */
function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown, fallback = 0): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asStringArray(value: unknown): string[] {
  return asArray(value)
    .map((v) => (typeof v === "string" ? v : ""))
    .filter((v) => v.length > 0);
}

export function normalizeTailoredResume(raw: unknown): TailoredResume {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;

  const skills: SkillGroup[] = asArray(r.skills)
    .map((s) => {
      const item = (s && typeof s === "object" ? s : {}) as Record<string, unknown>;
      return { label: asString(item.label), value: asString(item.value) };
    })
    .filter((s) => s.label || s.value);

  const experience: ExperienceItem[] = asArray(r.experience)
    .map((e) => {
      const item = (e && typeof e === "object" ? e : {}) as Record<string, unknown>;
      return {
        title: asString(item.title),
        company: asString(item.company),
        location: asString(item.location),
        dates: asString(item.dates),
        bullets: asStringArray(item.bullets),
      };
    })
    .filter((e) => e.title || e.company || e.bullets.length > 0);

  const projects: ProjectItem[] = asArray(r.projects)
    .map((p) => {
      const item = (p && typeof p === "object" ? p : {}) as Record<string, unknown>;
      return {
        name: asString(item.name),
        tools: asString(item.tools),
        bullets: asStringArray(item.bullets),
      };
    })
    .filter((p) => p.name || p.bullets.length > 0);

  const education: EducationItem[] = asArray(r.education)
    .map((e) => {
      const item = (e && typeof e === "object" ? e : {}) as Record<string, unknown>;
      return {
        school: asString(item.school),
        degree: asString(item.degree),
        dates: asString(item.dates),
      };
    })
    .filter((e) => e.school || e.degree);

  return {
    atsScoreBefore: asNumber(r.atsScoreBefore),
    atsScoreAfter: asNumber(r.atsScoreAfter),
    matchedKeywords: asStringArray(r.matchedKeywords),
    missingKeywords: asStringArray(r.missingKeywords),
    notes: asStringArray(r.notes),
    name: asString(r.name, "Resume") || "Resume",
    contact: asString(r.contact),
    title: asString(r.title),
    summary: asString(r.summary),
    skills,
    experience,
    projects,
    education,
    certifications: asStringArray(r.certifications),
    addedKeywords: asStringArray(r.addedKeywords),
    modelUsed: asString(r.modelUsed),
    fallbackUsed: r.fallbackUsed === true,
    jdModelUsed: asString(r.jdModelUsed),
    extractionModelUsed: asString(r.extractionModelUsed),
    extractionFallback: r.extractionFallback === true,
    educationRequirement: typeof r.educationRequirement === "string" ? r.educationRequirement : null,
    otherRequirements: asStringArray(r.otherRequirements),
  };
}
