import { z } from "zod";

export const jobInputSchema = z.object({
  company: z.string().max(120).default(""),
  title: z.string().max(120).default(""),
  jdText: z.string().min(1, "Job description is required.").max(60000),
  status: z.enum(["draft", "in_progress", "completed"]).default("draft"),
});

export const jobUpdateSchema = z.object({
  company: z.string().max(120).optional(),
  title: z.string().max(120).optional(),
  status: z.enum(["draft", "in_progress", "completed"]).optional(),
  parsedJd: z.record(z.string(), z.unknown()).optional(),
  selection: z.record(z.string(), z.unknown()).optional(),
  answers: z.record(z.string(), z.unknown()).optional(),
  resume: z.record(z.string(), z.unknown()).optional(),
  modelUsed: z.string().max(120).optional().nullable(),
  scoreBefore: z.number().int().min(0).max(100).optional().nullable(),
  scoreAfter: z.number().int().min(0).max(100).optional().nullable(),
});

export type JobInput = z.infer<typeof jobInputSchema>;
export type JobUpdate = z.infer<typeof jobUpdateSchema>;
