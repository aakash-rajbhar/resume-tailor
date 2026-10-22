import { z } from "zod";

import {
  certificationInputSchema,
  educationInputSchema,
  experienceInputSchema,
  profileInputSchema,
  projectInputSchema,
  skillInputSchema,
} from "@/lib/schemas";

/**
 * Schemas for the profile builder.
 *
 * Two families live here:
 *  - the extraction schemas, which describe what a model may return. They are
 *    deliberately bounded (arrays and strings have a maximum) and every field
 *    is optional, so a short or noisy resume still validates.
 *  - the section save schemas, which describe what the browser may send back.
 *    They are the only way data enters the database.
 */

export const profileSectionKeySchema = z.enum([
  "profile",
  "experience",
  "projects",
  "skills",
  "education",
  "certifications",
]);

export type ProfileSectionKey = z.infer<typeof profileSectionKeySchema>;

/* ------------------------------------------------------------------ *
 * Extraction schemas (model output)
 * ------------------------------------------------------------------ */

export const profileSummaryExtractionSchema = z.object({
  headline: z.string().max(160).default(""),
  summary: z.string().max(4000).default(""),
  location: z.string().max(120).default(""),
});

export const profileExperienceExtractionSchema = z.object({
  items: z
    .array(
      z.object({
        company: z.string().max(120).default(""),
        title: z.string().max(120).default(""),
        location: z.string().max(120).default(""),
        /** The date exactly as written in the resume, e.g. "Jan 2021". */
        startDate: z.string().max(40).default(""),
        endDate: z.string().max(40).default(""),
        isCurrent: z.boolean().default(false),
        bullets: z.array(z.string().max(600)).max(12).default([]),
      }),
    )
    .max(10)
    .default([]),
});

export const profileProjectsExtractionSchema = z.object({
  items: z
    .array(
      z.object({
        name: z.string().max(160).default(""),
        summary: z.string().max(1000).default(""),
        bullets: z.array(z.string().max(600)).max(12).default([]),
        tools: z.array(z.string().max(60)).max(20).default([]),
        startDate: z.string().max(40).default(""),
        endDate: z.string().max(40).default(""),
      }),
    )
    .max(10)
    .default([]),
});

export const profileSkillsExtractionSchema = z.object({
  items: z
    .array(
      z.object({
        name: z.string().min(1).max(80),
        groupLabel: z.string().max(60).default(""),
      }),
    )
    .max(60)
    .default([]),
});

export const profileEducationExtractionSchema = z.object({
  items: z
    .array(
      z.object({
        school: z.string().max(160).default(""),
        degree: z.string().max(120).default(""),
        fieldOfStudy: z.string().max(120).default(""),
        startDate: z.string().max(40).default(""),
        endDate: z.string().max(40).default(""),
      }),
    )
    .max(8)
    .default([]),
});

export const profileCertificationsExtractionSchema = z.object({
  items: z
    .array(
      z.object({
        name: z.string().max(160).default(""),
        issuer: z.string().max(120).default(""),
        issuedOn: z.string().max(40).default(""),
      }),
    )
    .max(12)
    .default([]),
});

export type ProfileSummaryExtraction = z.infer<
  typeof profileSummaryExtractionSchema
>;
export type ProfileExperienceExtraction = z.infer<
  typeof profileExperienceExtractionSchema
>;
export type ProfileProjectsExtraction = z.infer<
  typeof profileProjectsExtractionSchema
>;
export type ProfileSkillsExtraction = z.infer<
  typeof profileSkillsExtractionSchema
>;
export type ProfileEducationExtraction = z.infer<
  typeof profileEducationExtractionSchema
>;
export type ProfileCertificationsExtraction = z.infer<
  typeof profileCertificationsExtractionSchema
>;

/* ------------------------------------------------------------------ *
 * Section save schemas (browser input)
 * ------------------------------------------------------------------ */

/** A row that already exists in the database carries its id and version. */
const savedFields = {
  id: z.string().uuid().optional(),
  version: z.number().int().min(1).optional(),
};

export const profileSectionSaveSchema = z.discriminatedUnion("section", [
  z.object({
    section: z.literal("profile"),
    profile: profileInputSchema,
    version: z.number().int().min(1).optional(),
  }),
  z.object({
    section: z.literal("experience"),
    items: z.array(experienceInputSchema.extend(savedFields)).max(50),
  }),
  z.object({
    section: z.literal("projects"),
    items: z.array(projectInputSchema.extend(savedFields)).max(50),
  }),
  z.object({
    section: z.literal("skills"),
    items: z.array(skillInputSchema.extend(savedFields)).max(200),
  }),
  z.object({
    section: z.literal("education"),
    items: z.array(educationInputSchema.extend(savedFields)).max(30),
  }),
  z.object({
    section: z.literal("certifications"),
    items: z.array(certificationInputSchema.extend(savedFields)).max(30),
  }),
]);

export type ProfileSectionSave = z.infer<typeof profileSectionSaveSchema>;
