import { z } from "zod";
import { isoMonthSchema, sortOrderSchema } from "./common";

export const projectInputSchema = z.object({
  name: z.string().min(1, "Name is required.").max(160),
  summary: z.string().max(2000).default(""),
  url: z.string().url().max(300).optional().nullable(),
  source: z.enum(["github", "manual"]).default("manual"),
  githubRepoId: z.string().max(100).optional().nullable(),
  importance: z.number().int().min(1).max(5).default(3),
  includeByDefault: z.boolean().default(true),
  confirmed: z.boolean().default(false),
  tools: z.array(z.string().min(1).max(60)).max(30).default([]),
  bullets: z.array(z.string().min(1).max(600)).max(20).default([]),
  startDate: isoMonthSchema.optional().nullable(),
  endDate: isoMonthSchema.optional().nullable(),
  sortOrder: sortOrderSchema,
});

export type ProjectInput = z.infer<typeof projectInputSchema>;
