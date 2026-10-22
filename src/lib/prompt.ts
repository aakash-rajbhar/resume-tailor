import { z } from "zod";

export const EXTRACT_PROMPT_VERSION = "2026.10.22.2";

export const JD_SYSTEM_PROMPT = `You extract structured requirements from a job description.

Rules:
1. Extract ONLY what the job description explicitly states. Never infer a skill, tool or qualification that is not written in the text.
2. required_skills and preferred_skills must hold SINGLE skills, tools, or technologies. Each entry must be at most 3 words. No sentences, no degrees, no certifications unless they are a single tool name.
3. A skill is REQUIRED only when the job description marks it as required (words such as "required", "must", "need", "minimum", "essential") or lists it under a requirements section. Skills listed as nice-to-have (words such as "preferred", "plus", "bonus", "a plus") are PREFERRED.
4. Split compounds: "Git/GitHub workflows" into separate skills; "CI/CD pipelines" should become "CI/CD"; "unit, integration and end-to-end testing" must be split into separate testing skills.
5. Generic traits (communication, teamwork, attention to detail) are not skills.
6. education_requirement: put any degree/education requirement as a short string if stated, else null.
7. other_requirements: list explicit requirements that are not single-skill tools/technologies (e.g. open source contributions, mentoring, on-call) as short phrases. These do NOT count toward scoring.
8. Sort required_skills and preferred_skills alphabetically, case-insensitively.
9. Use empty arrays when none apply. Use null for education_requirement when not stated.
10. Respond with a single JSON object and nothing else. Examples must contain no numbers.`;

export function buildJDUserPrompt(jdText: string): string {
  return `JOB DESCRIPTION:
"""
${jdText}
"""

Extract role title, company, seniority, required_skills (single skills/tools only), preferred_skills (single skills/tools only), responsibilities, education_requirement (string or null), and other_requirements (open-ended requirements not single skills/tools). Split compounds. Return only the JSON object.`;
}

export interface Jd {
  title: string;
  company: string;
  seniority: string;
  required_skills: string[];
  preferred_skills: string[];
  responsibilities: string[];
  education_requirement: string | null;
  other_requirements: string[];
}

export const JdSchema = z.object({
  title: z.string().default(""),
  company: z.string().default(""),
  seniority: z.string().default(""),
  required_skills: z.array(z.string()).max(30).default([]),
  preferred_skills: z.array(z.string()).max(30).default([]),
  responsibilities: z.array(z.string()).max(15).default([]),
  education_requirement: z.string().nullable().optional().default(null),
  other_requirements: z.array(z.string()).max(15).default([]),
});
