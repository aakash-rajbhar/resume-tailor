import { z } from "zod";
import { isoMonthSchema, sortOrderSchema } from "./common";

export const educationInputSchema = z.object({
  school: z.string().min(1, "School is required.").max(160),
  degree: z.string().max(120).default(""),
  fieldOfStudy: z.string().max(120).default(""),
  startDate: isoMonthSchema.optional().nullable(),
  endDate: isoMonthSchema.optional().nullable(),
  sortOrder: sortOrderSchema,
});

export type EducationInput = z.infer<typeof educationInputSchema>;
