import { z } from "zod";

export const profileLinkSchema = z.object({
  label: z.string().min(1).max(40),
  url: z.string().url().max(300),
});

export const profileInputSchema = z.object({
  fullName: z.string().min(1, "Name is required.").max(120),
  headline: z.string().max(160).default(""),
  summary: z.string().max(4000).default(""),
  email: z.string().email().max(200).optional().nullable(),
  phone: z.string().max(40).optional().nullable(),
  location: z.string().max(120).optional().nullable(),
  links: z.array(profileLinkSchema).max(10).default([]),
  githubUrl: z.string().url().max(300).optional().nullable(),
  linkedinUrl: z.string().url().max(300).optional().nullable(),
  portfolioUrl: z.string().url().max(300).optional().nullable(),
});

export type ProfileInput = z.infer<typeof profileInputSchema>;
export type ProfileLink = z.infer<typeof profileLinkSchema>;
