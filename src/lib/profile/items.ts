import type { ExperienceInput } from "@/lib/schemas";
import type {
  ProfileSectionKey,
  ProfileSectionSave,
} from "./schemas";

/**
 * The profile items the editor works with.
 *
 * The database stores jsonb columns, so the rows come back with `unknown`
 * values. These helpers turn a row into a typed item and an item into the
 * payload the API expects. They are pure and client-safe.
 */

export interface ProfileItemBase {
  /** The row id, or null for an item that has not been saved yet. */
  id: string | null;
  /** The optimistic lock version. */
  version: number;
}

export interface ProfileContactItem extends ProfileItemBase {
  fullName: string;
  headline: string;
  summary: string;
  email: string;
  phone: string;
  location: string;
  links: { label: string; url: string }[];
  githubUrl: string;
  linkedinUrl: string;
  portfolioUrl: string;
}

export interface ExperienceItem extends ProfileItemBase {
  company: string;
  title: string;
  location: string;
  employmentType: ExperienceInput["employmentType"];
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  description: string;
  bullets: string[];
}

export interface ProjectItem extends ProfileItemBase {
  name: string;
  summary: string;
  url: string;
  source: "github" | "manual";
  githubRepoId: string;
  importance: number;
  includeByDefault: boolean;
  confirmed: boolean;
  tools: string[];
  bullets: string[];
  startDate: string;
  endDate: string;
}

export interface SkillItem extends ProfileItemBase {
  groupLabel: string;
  name: string;
  evidenceRefs: {
    kind: "resume" | "project" | "experience" | "verified_fact" | "manual";
    refId?: string | null;
    note?: string | null;
  }[];
}

export interface EducationItem extends ProfileItemBase {
  school: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string;
  endDate: string;
}

export interface CertificationItem extends ProfileItemBase {
  name: string;
  issuer: string;
  issuedOn: string;
  url: string;
}

type Row = Record<string, unknown>;

function str(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function num(value: unknown): number {
  return typeof value === "number" ? value : 0;
}

function bool(value: unknown): boolean {
  return value === true;
}

function strList(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function objList(value: unknown): { label: string; url: string }[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is Row => typeof item === "object" && item !== null)
    .map((item) => ({ label: str(item.label), url: str(item.url) }));
}

function base(row: Row): ProfileItemBase {
  return { id: str(row.id) || null, version: num(row.version) || 1 };
}

const EMPLOYMENT_TYPES: ExperienceInput["employmentType"][] = [
  "full_time",
  "part_time",
  "contract",
  "internship",
  "freelance",
  "other",
];

/** Keeps the employment type inside the set the database accepts. */
function employmentType(value: string): ExperienceInput["employmentType"] {
  return EMPLOYMENT_TYPES.includes(value as ExperienceInput["employmentType"])
    ? (value as ExperienceInput["employmentType"])
    : "other";
}

export function toContactItem(row: unknown): ProfileContactItem {
  const source = (row ?? {}) as Row;
  return {
    ...base(source),
    fullName: str(source.fullName),
    headline: str(source.headline),
    summary: str(source.summary),
    email: str(source.email),
    phone: str(source.phone),
    location: str(source.location),
    links: objList(source.links),
    githubUrl: str(source.githubUrl),
    linkedinUrl: str(source.linkedinUrl),
    portfolioUrl: str(source.portfolioUrl),
  };
}

export function toExperienceItem(row: unknown): ExperienceItem {
  const source = (row ?? {}) as Row;
  return {
    ...base(source),
    company: str(source.company),
    title: str(source.title),
    location: str(source.location),
    employmentType: employmentType(str(source.employmentType)),
    startDate: str(source.startDate),
    endDate: str(source.endDate),
    isCurrent: bool(source.isCurrent),
    description: str(source.description),
    bullets: strList(source.bullets),
  };
}

export function toProjectItem(row: unknown): ProjectItem {
  const source = (row ?? {}) as Row;
  return {
    ...base(source),
    name: str(source.name),
    summary: str(source.summary),
    url: str(source.url),
    source: source.source === "github" ? "github" : "manual",
    githubRepoId: str(source.githubRepoId),
    importance: num(source.importance) || 3,
    includeByDefault: bool(source.includeByDefault),
    confirmed: bool(source.confirmed),
    tools: strList(source.tools),
    bullets: strList(source.bullets),
    startDate: str(source.startDate),
    endDate: str(source.endDate),
  };
}

export function toSkillItem(row: unknown): SkillItem {
  const source = (row ?? {}) as Row;
  const refs = Array.isArray(source.evidenceRefs)
    ? source.evidenceRefs.filter(
        (item): item is Row => typeof item === "object" && item !== null,
      )
    : [];
  return {
    ...base(source),
    groupLabel: str(source.groupLabel),
    name: str(source.name),
    evidenceRefs: refs.map((ref) => ({
      kind: (str(ref.kind) || "manual") as SkillItem["evidenceRefs"][number]["kind"],
      refId: str(ref.refId) || null,
      note: str(ref.note) || null,
    })),
  };
}

export function toEducationItem(row: unknown): EducationItem {
  const source = (row ?? {}) as Row;
  return {
    ...base(source),
    school: str(source.school),
    degree: str(source.degree),
    fieldOfStudy: str(source.fieldOfStudy),
    startDate: str(source.startDate),
    endDate: str(source.endDate),
  };
}

export function toCertificationItem(row: unknown): CertificationItem {
  const source = (row ?? {}) as Row;
  return {
    ...base(source),
    name: str(source.name),
    issuer: str(source.issuer),
    issuedOn: str(source.issuedOn),
    url: str(source.url),
  };
}

function withoutBase(item: ProfileItemBase) {
  const { id, version, ...rest } = item;
  return { id: id ?? undefined, version: version || undefined, ...rest };
}

/**
 * The payload for one section. The order of the array is the order of the
 * rows.
 */
export function toSectionPayload(
  section: ProfileSectionKey,
  items: unknown,
): ProfileSectionSave {
  switch (section) {
    case "profile": {
      const item = items as ProfileContactItem;
      return {
        section: "profile",
        profile: {
          fullName: item.fullName,
          headline: item.headline,
          summary: item.summary,
          email: item.email || null,
          phone: item.phone || null,
          location: item.location || null,
          links: item.links.filter((link) => link.url.trim().length > 0),
          githubUrl: item.githubUrl || null,
          linkedinUrl: item.linkedinUrl || null,
          portfolioUrl: item.portfolioUrl || null,
        },
        version: item.version || undefined,
      };
    }
    case "experience":
      return {
        section: "experience",
        items: (items as ExperienceItem[]).map((item) => ({
          ...withoutBase(item),
          company: item.company,
          title: item.title,
          location: item.location,
          employmentType: item.employmentType,
          startDate: item.startDate || null,
          endDate: item.endDate || null,
          isCurrent: item.isCurrent,
          description: item.description,
          bullets: item.bullets,
          sortOrder: 0,
        })),
      };
    case "projects":
      return {
        section: "projects",
        items: (items as ProjectItem[]).map((item) => ({
          ...withoutBase(item),
          name: item.name,
          summary: item.summary,
          url: item.url || null,
          source: item.source,
          githubRepoId: item.githubRepoId || null,
          importance: item.importance,
          includeByDefault: item.includeByDefault,
          confirmed: item.confirmed,
          tools: item.tools,
          bullets: item.bullets,
          startDate: item.startDate || null,
          endDate: item.endDate || null,
          sortOrder: 0,
        })),
      };
    case "skills":
      return {
        section: "skills",
        items: (items as SkillItem[]).map((item) => ({
          ...withoutBase(item),
          groupLabel: item.groupLabel,
          name: item.name,
          evidenceRefs: item.evidenceRefs,
          sortOrder: 0,
        })),
      };
    case "education":
      return {
        section: "education",
        items: (items as EducationItem[]).map((item) => ({
          ...withoutBase(item),
          school: item.school,
          degree: item.degree,
          fieldOfStudy: item.fieldOfStudy,
          startDate: item.startDate || null,
          endDate: item.endDate || null,
          sortOrder: 0,
        })),
      };
    case "certifications":
      return {
        section: "certifications",
        items: (items as CertificationItem[]).map((item) => ({
          ...withoutBase(item),
          name: item.name,
          issuer: item.issuer,
          issuedOn: item.issuedOn || null,
          url: item.url || null,
          sortOrder: 0,
        })),
      };
  }
}
