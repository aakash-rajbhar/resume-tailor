import { z } from "zod";
import { isoMonthSchema, sortOrderSchema } from "./common";

export const experienceInputSchema = z.object({
  company: z.string().min(1, "Company is required.").max(120),
  title: z.string().min(1, "Title is required.").max(120),
  location: z.string().max(120).default(""),
  employmentType: z
    .enum([
      "full_time",
      "part_time",
      "contract",
      "internship",
      "freelance",
      "other",
    ])
    .default("other"),
  startDate: isoMonthSchema.optional().nullable(),
  endDate: isoMonthSchema.optional().nullable(),
  isCurrent: z.boolean().default(false),
  description: z.string().max(2000).default(""),
  bullets: z.array(z.string().min(1).max(600)).max(20).default([]),
  sortOrder: sortOrderSchema,
});

export type ExperienceInput = z.infer<typeof experienceInputSchema>;
