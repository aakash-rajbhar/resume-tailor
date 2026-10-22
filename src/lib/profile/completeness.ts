import type { SkillEvidenceRef } from "@/lib/schemas";

/**
 * Profile completeness.
 *
 * A pure function: given the profile and its sections it returns a 0-100
 * score and the specific items that are still missing. Nothing here calls a
 * model or touches the database, so it is unit tested directly and reused by
 * the overview screen and the review screen.
 */

export interface CompletenessProfile {
  fullName?: string | null;
  headline?: string | null;
  summary?: string | null;
  email?: string | null;
  phone?: string | null;
  location?: string | null;
  githubUrl?: string | null;
  linkedinUrl?: string | null;
  portfolioUrl?: string | null;
  links?: { label?: string | null; url?: string | null }[] | null;
}

export interface CompletenessExperience {
  company?: string | null;
  title?: string | null;
  bullets?: string[] | null;
}

export interface CompletenessProject {
  name?: string | null;
  summary?: string | null;
  bullets?: string[] | null;
}

export interface CompletenessSkill {
  name?: string | null;
  evidenceRefs?: SkillEvidenceRef[] | null;
}

export interface CompletenessEducation {
  school?: string | null;
}

export interface CompletenessCertification {
  name?: string | null;
}

export interface CompletenessInput {
  profile: CompletenessProfile | null;
  experience: CompletenessExperience[];
  projects: CompletenessProject[];
  skills: CompletenessSkill[];
  education: CompletenessEducation[];
  certifications: CompletenessCertification[];
}

export interface CompletenessResult {
  /** 0-100. */
  score: number;
  /** The specific items that are still missing. */
  missing: string[];
  /** Points earned, so a caller can show progress. */
  earned: number;
  /** Points available. */
  total: number;
}

/** The points each check is worth. They add up to 100. */
export const COMPLETENESS_WEIGHTS = {
  name: 8,
  headline: 4,
  summary: 10,
  email: 4,
  phone: 3,
  location: 3,
  links: 3,
  experiencePresent: 10,
  experienceBullets: 10,
  projectsPresent: 8,
  projectBullets: 8,
  skillsPresent: 9,
  skillEvidence: 6,
  educationPresent: 7,
  certificationsPresent: 7,
} as const;

function filled(value: string | null | undefined): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function hasBullets(bullets: string[] | null | undefined): boolean {
  return Array.isArray(bullets) && bullets.some((bullet) => filled(bullet));
}

/**
 * Computes the completeness score and the list of missing items.
 */
export function computeCompleteness(input: CompletenessInput): CompletenessResult {
  const profile = input.profile;
  const experience = input.experience ?? [];
  const projects = input.projects ?? [];
  const skills = input.skills ?? [];
  const education = input.education ?? [];
  const certifications = input.certifications ?? [];

  const missing: string[] = [];
  let earned = 0;

  if (filled(profile?.fullName)) {
    earned += COMPLETENESS_WEIGHTS.name;
  } else {
    missing.push("Add your name");
  }

  if (filled(profile?.headline)) {
    earned += COMPLETENESS_WEIGHTS.headline;
  } else {
    missing.push("Add a headline");
  }

  if (filled(profile?.summary)) {
    earned += COMPLETENESS_WEIGHTS.summary;
  } else {
    missing.push("Add a summary");
  }

  if (filled(profile?.email)) {
    earned += COMPLETENESS_WEIGHTS.email;
  } else {
    missing.push("Add an email address");
  }

  if (filled(profile?.phone)) {
    earned += COMPLETENESS_WEIGHTS.phone;
  } else {
    missing.push("Add a phone number");
  }

  if (filled(profile?.location)) {
    earned += COMPLETENESS_WEIGHTS.location;
  } else {
    missing.push("Add your location");
  }

  const linkCount =
    (filled(profile?.githubUrl) ? 1 : 0) +
    (filled(profile?.linkedinUrl) ? 1 : 0) +
    (filled(profile?.portfolioUrl) ? 1 : 0) +
    (profile?.links ?? []).filter((link) => filled(link?.url)).length;

  if (linkCount > 0) {
    earned += COMPLETENESS_WEIGHTS.links;
  } else {
    missing.push("Add a link to GitHub, LinkedIn or your portfolio");
  }

  if (experience.length > 0) {
    earned += COMPLETENESS_WEIGHTS.experiencePresent;
  } else {
    missing.push("Add work experience");
  }

  const rolesWithoutBullets = experience.filter(
    (role) => !hasBullets(role.bullets),
  ).length;
  if (experience.length > 0) {
    if (rolesWithoutBullets > 0) {
      missing.push(
        `${rolesWithoutBullets} ${rolesWithoutBullets === 1 ? "role has" : "roles have"} no bullets`,
      );
    } else {
      earned += COMPLETENESS_WEIGHTS.experienceBullets;
    }
  }

  if (projects.length > 0) {
    earned += COMPLETENESS_WEIGHTS.projectsPresent;
  } else {
    missing.push("Add a project");
  }

  const projectsWithoutBullets = projects.filter(
    (project) => !hasBullets(project.bullets),
  ).length;
  if (projects.length > 0) {
    if (projectsWithoutBullets > 0) {
      missing.push(
        `${projectsWithoutBullets} ${projectsWithoutBullets === 1 ? "project has" : "projects have"} no bullets`,
      );
    } else {
      earned += COMPLETENESS_WEIGHTS.projectBullets;
    }
  }

  if (skills.length > 0) {
    earned += COMPLETENESS_WEIGHTS.skillsPresent;
  } else {
    missing.push("Add a skill");
  }

  const skillsWithoutEvidence = skills.filter(
    (skill) => (skill.evidenceRefs ?? []).length === 0,
  ).length;
  if (skills.length > 0) {
    if (skillsWithoutEvidence > 0) {
      missing.push(
        `${skillsWithoutEvidence} ${skillsWithoutEvidence === 1 ? "skill has" : "skills have"} no evidence`,
      );
    } else {
      earned += COMPLETENESS_WEIGHTS.skillEvidence;
    }
  }

  if (education.length > 0) {
    earned += COMPLETENESS_WEIGHTS.educationPresent;
  } else {
    missing.push("Add education");
  }

  if (certifications.length > 0) {
    earned += COMPLETENESS_WEIGHTS.certificationsPresent;
  } else {
    missing.push("Add a certification (optional)");
  }

  const total = Object.values(COMPLETENESS_WEIGHTS).reduce(
    (sum, weight) => sum + weight,
    0,
  );

  return {
    score: Math.max(0, Math.min(100, Math.round((earned / total) * 100))),
    missing,
    earned,
    total,
  };
}
