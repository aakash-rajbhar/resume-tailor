import { z } from "zod";

/** `YYYY-MM`, the only date format the profile stores. */
export const isoMonthSchema = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Use the YYYY-MM format.");

export const sortOrderSchema = z.number().int().min(0).max(1000).default(0);
