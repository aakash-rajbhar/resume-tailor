import { parseResumeDate } from "./dates";
import type { DatePrecision } from "./dates";
import type {
  ProfileCertificationsExtraction,
  ProfileEducationExtraction,
  ProfileExperienceExtraction,
  ProfileProjectsExtraction,
  ProfileSkillsExtraction,
  ProfileSummaryExtraction,
} from "./schemas";

/**
 * The drafts the extraction produces.
 *
 * A draft is a suggestion, not a fact. Nothing here is written to the
 * database until the user reviews it and saves the section. The dates keep
 * both the normalized `YYYY-MM` value and the text the resume used, so the
 * review screen can show what was actually written.
 */

export interface DraftDate {
  /** `YYYY-MM`, or null when there is no usable date. */
  iso: string | null;
  /** The date exactly as the resume wrote it. */
  raw: string;
  /** True when the source named a year but no month. */
  yearOnly: boolean;
  /** True for "Present" and similar. */
  isCurrent: boolean;
}

export interface SummaryDraft {
  headline: string;
  summary: string;
  location: string;
}

export interface ExperienceDraft {
  draftId: string;
  company: string;
  title: string;
  location: string;
  startDate: DraftDate;
  endDate: DraftDate;
  isCurrent: boolean;
  bullets: string[];
}

export interface ProjectDraft {
  draftId: string;
  name: string;
  summary: string;
  bullets: string[];
  tools: string[];
  startDate: DraftDate;
  endDate: DraftDate;
}

export interface SkillDraft {
  draftId: string;
  name: string;
  groupLabel: string;
}

export interface EducationDraft {
  draftId: string;
  school: string;
  degree: string;
  fieldOfStudy: string;
  startDate: DraftDate;
  endDate: DraftDate;
}

export interface CertificationDraft {
  draftId: string;
  name: string;
  issuer: string;
  issuedOn: DraftDate;
}

export interface ProfileDrafts {
  summary: SummaryDraft;
  experience: ExperienceDraft[];
  projects: ProjectDraft[];
  skills: SkillDraft[];
  education: EducationDraft[];
  certifications: CertificationDraft[];
}

export const EMPTY_SUMMARY_DRAFT: SummaryDraft = {
  headline: "",
  summary: "",
  location: "",
};

export const EMPTY_PROFILE_DRAFTS: ProfileDrafts = {
  summary: EMPTY_SUMMARY_DRAFT,
  experience: [],
  projects: [],
  skills: [],
  education: [],
  certifications: [],
};

function trim(value: string | undefined | null): string {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function trimMultiline(value: string | undefined | null): string {
  return (value ?? "").trim();
}

function toDraftDate(raw: string): DraftDate {
  const parsed = parseResumeDate(raw);
  return {
    iso: parsed.iso,
    raw: parsed.raw,
    yearOnly: parsed.precision === "year",
    isCurrent: parsed.isCurrent,
  };
}

/** A stable id for a draft, unique inside one extraction. */
export function draftId(section: string, index: number): string {
  return `${section}-${index + 1}`;
}

/**
 * Turns the raw model output into drafts: strings are trimmed, empty entries
 * are dropped, dates are parsed and the lists are sorted in code.
 */
export function normalizeDrafts(input: {
  summary: ProfileSummaryExtraction;
  experience: ProfileExperienceExtraction;
  projects: ProfileProjectsExtraction;
  skills: ProfileSkillsExtraction;
  education: ProfileEducationExtraction;
  certifications: ProfileCertificationsExtraction;
}): ProfileDrafts {
  const summary: SummaryDraft = {
    headline: trim(input.summary.headline),
    summary: trimMultiline(input.summary.summary),
    location: trim(input.summary.location),
  };

  const experience: ExperienceDraft[] = input.experience.items
    .map((item, index) => {
      const startDate = toDraftDate(item.startDate);
      const endDate = toDraftDate(item.endDate);
      return {
        draftId: draftId("exp", index),
        company: trim(item.company),
        title: trim(item.title),
        location: trim(item.location),
        startDate,
        endDate,
        isCurrent: item.isCurrent || endDate.isCurrent,
        bullets: (item.bullets ?? [])
          .map((bullet) => trimMultiline(bullet))
          .filter((bullet) => bullet.length > 0)
          .slice(0, 20),
      };
    })
    .filter((item) => item.company || item.title || item.bullets.length > 0)
    .map((item, index) => ({ ...item, draftId: draftId("exp", index) }))
    .sort((a, b) => (b.startDate.iso ?? "").localeCompare(a.startDate.iso ?? ""));

  const projects: ProjectDraft[] = input.projects.items
    .map((item, index) => ({
      draftId: draftId("proj", index),
      name: trim(item.name),
      summary: trimMultiline(item.summary),
      bullets: (item.bullets ?? [])
        .map((bullet) => trimMultiline(bullet))
        .filter((bullet) => bullet.length > 0)
        .slice(0, 20),
      tools: (item.tools ?? [])
        .map((tool) => trim(tool))
        .filter((tool) => tool.length > 0)
        .slice(0, 30),
      startDate: toDraftDate(item.startDate),
      endDate: toDraftDate(item.endDate),
    }))
    .filter((item) => item.name || item.summary || item.bullets.length > 0)
    .map((item, index) => ({ ...item, draftId: draftId("proj", index) }))
    .sort((a, b) => (b.startDate.iso ?? "").localeCompare(a.startDate.iso ?? ""));

  const seenSkills = new Set<string>();
  const skills: SkillDraft[] = input.skills.items
    .map((item, index) => ({
      draftId: draftId("skill", index),
      name: trim(item.name),
      groupLabel: trim(item.groupLabel),
    }))
    .filter((item) => {
      if (!item.name) return false;
      const key = item.name.toLowerCase();
      if (seenSkills.has(key)) return false;
      seenSkills.add(key);
      return true;
    })
    .map((item, index) => ({ ...item, draftId: draftId("skill", index) }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const education: EducationDraft[] = input.education.items
    .map((item, index) => ({
      draftId: draftId("edu", index),
      school: trim(item.school),
      degree: trim(item.degree),
      fieldOfStudy: trim(item.fieldOfStudy),
      startDate: toDraftDate(item.startDate),
      endDate: toDraftDate(item.endDate),
    }))
    .filter((item) => item.school || item.degree || item.fieldOfStudy)
    .map((item, index) => ({ ...item, draftId: draftId("edu", index) }))
    .sort((a, b) => a.school.localeCompare(b.school));

  const certifications: CertificationDraft[] = input.certifications.items
    .map((item, index) => ({
      draftId: draftId("cert", index),
      name: trim(item.name),
      issuer: trim(item.issuer),
      issuedOn: toDraftDate(item.issuedOn),
    }))
    .filter((item) => item.name)
    .map((item, index) => ({ ...item, draftId: draftId("cert", index) }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return { summary, experience, projects, skills, education, certifications };
}

/** The precision of a draft date, for display. */
export function draftDatePrecision(date: DraftDate): DatePrecision {
  if (date.isCurrent) return "none";
  if (!date.iso) return "none";
  return date.yearOnly ? "year" : "month";
}
