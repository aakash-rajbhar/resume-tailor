import { z } from "zod";
import { sortOrderSchema } from "./common";

export const skillEvidenceRefSchema = z.object({
  kind: z.enum([
    "resume",
    "project",
    "experience",
    "verified_fact",
    "manual",
  ]),
  refId: z.string().max(100).optional().nullable(),
  note: z.string().max(300).optional().nullable(),
});

export const skillInputSchema = z.object({
  groupLabel: z.string().max(60).default(""),
  name: z.string().min(1, "Skill name is required.").max(80),
  evidenceRefs: z.array(skillEvidenceRefSchema).max(20).default([]),
  sortOrder: sortOrderSchema,
});

export type SkillInput = z.infer<typeof skillInputSchema>;
export type SkillEvidenceRef = z.infer<typeof skillEvidenceRefSchema>;
