import { z } from "zod";
import { isoMonthSchema, sortOrderSchema } from "./common";

export const certificationInputSchema = z.object({
  name: z.string().min(1, "Name is required.").max(160),
  issuer: z.string().max(120).default(""),
  issuedOn: isoMonthSchema.optional().nullable(),
  url: z.string().url().max(300).optional().nullable(),
  sortOrder: sortOrderSchema,
});

export type CertificationInput = z.infer<typeof certificationInputSchema>;
