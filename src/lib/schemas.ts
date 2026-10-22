import { z } from "zod";

export const JdSchema = z.object({
  title: z.string().default(""),
  company: z.string().default(""),
  seniority: z.string().default(""),
  required_skills: z.array(z.string()).max(20).default([]),
  preferred_skills: z.array(z.string()).max(15).default([]),
  responsibilities: z.array(z.string()).max(10).default([]),
});

export type Jd = z.infer<typeof JdSchema>;

export const SkillGroupSchema = z.object({
  label: z.string().default(""),
  value: z.string().default(""),
});

export const ExperienceItemSchema = z.object({
  title: z.string().default(""),
  company: z.string().default(""),
  location: z.string().default(""),
  dates: z.string().default(""),
  bullets: z.array(z.string()).default([]),
});

export const ProjectItemSchema = z.object({
  name: z.string().default(""),
  tools: z.string().default(""),
  bullets: z.array(z.string()).default([]),
});

export const EducationItemSchema = z.object({
  school: z.string().default(""),
  degree: z.string().default(""),
  dates: z.string().default(""),
});

export const TailoredResumeSchema = z.object({
  notes: z.array(z.string()).default([]),
  name: z.string().default(""),
  contact: z.string().default(""),
  title: z.string().default(""),
  summary: z.string().default(""),
  skills: z.array(SkillGroupSchema).default([]),
  experience: z.array(ExperienceItemSchema).default([]),
  projects: z.array(ProjectItemSchema).default([]),
  education: z.array(EducationItemSchema).default([]),
  certifications: z.array(z.string()).default([]),
});

export type TailoredResumePayload = z.infer<typeof TailoredResumeSchema>;

export const AnalyzeFormSchema = z.object({
  jdText: z.string().min(1, "Job description is required."),
  resumeText: z.string().default(""),
  provider: z.enum(["gemini", "groq"]).default("gemini"),
  geminiKey: z.string().default(""),
  groqKey: z.string().default(""),
  geminiModel: z.string().optional(),
  groqModel: z.string().optional(),
  additionalPrompt: z.string().default(""),
  singlePage: z.boolean().default(true),
});
