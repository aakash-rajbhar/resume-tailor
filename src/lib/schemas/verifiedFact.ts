import { z } from "zod";

export const verifiedFactInputSchema = z.object({
  questionKey: z.string().min(1, "Question key is required.").max(80),
  question: z.string().max(400).default(""),
  answer: z.string().max(2000).default(""),
  answerType: z.enum(["has", "none", "skipped"]).default("has"),
  status: z.enum(["verified", "pending", "rejected"]).default("verified"),
  source: z.enum(["interview", "resume", "manual"]).default("interview"),
  jobId: z.string().uuid().optional().nullable(),
});

export type VerifiedFactInput = z.infer<typeof verifiedFactInputSchema>;
