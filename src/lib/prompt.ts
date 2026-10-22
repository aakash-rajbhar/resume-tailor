import type { KeywordSet } from "./score";

/**
 * Bumped whenever a prompt changes so cached LLM responses are invalidated.
 */
export const PROMPT_VERSION = "2026.10.22.1";

export const JD_SYSTEM_PROMPT = `You extract structured requirements from a job description.

Rules:
1. Extract ONLY what the job description explicitly states. Never infer a skill, tool or qualification that is not written in the text.
2. A skill is REQUIRED only when the job description marks it as required (words such as "required", "must", "need", "minimum", "essential") or lists it under a requirements section. Skills listed as nice-to-have (words such as "preferred", "plus", "bonus", "a plus") are PREFERRED.
3. Keep the exact wording of the job description for each skill.
4. Do not treat generic traits (communication, teamwork, attention to detail) as skills.
5. Sort every array alphabetically, case-insensitively.
6. Use an empty string for a field the job description does not state.
7. Respond with a single JSON object and nothing else.

EXAMPLE JOB DESCRIPTION:
Requirements: React and TypeScript. Must have hands-on experience with REST APIs and PostgreSQL.
Preferred: Docker experience is a plus.

EXAMPLE OUTPUT:
{
  "title": "",
  "company": "",
  "seniority": "",
  "required_skills": ["PostgreSQL", "React", "REST APIs", "TypeScript"],
  "preferred_skills": ["Docker"],
  "responsibilities": []
}`;

export function buildJDUserPrompt(jdText: string): string {
  return `JOB DESCRIPTION:
"""
${jdText}
"""

Extract the role title, company, seniority, required skills, preferred skills and responsibilities exactly as stated. Return only the JSON object.`;
}

export const SYSTEM_PROMPT = `You rewrite resumes so they score higher against a specific job description while staying 100% truthful to the source material.

Hard rules — never break these:
1. NEVER invent employers, job titles, dates, degrees, certifications, metrics, tools or skills. Every statement must come from the source resume or the user's own instructions.
2. NUMBERS: use a number, percentage, duration or quantity ONLY when that exact figure is present in the source material you were given. Never create, round up, estimate or infer a figure. When no figure exists, describe the scope, the technology and the outcome in words instead of a number.
3. KEYWORDS: you may use a target keyword only where the source material supports it. Never attach a skill to a role, project or bullet that does not evidence it.
4. PRESERVE THE SOURCE: keep every role, project, certification and education entry that exists in the source. Keep the same number of bullets for each role and each project as the source has. Never pad, never merge two roles, never invent a bullet, never drop a bullet.
5. BULLET FORMAT: strong action verb, then what was done, then the tools or approach, then the outcome or scope. Fifteen to twenty-five words per bullet. One idea per bullet. No first person pronouns.
6. CONTACT: keep the name, contact line and links exactly as they appear in the source.
7. NOTES: give two to five short, actionable tips. A tip may suggest a certification or a learning step, but never claim the candidate has a skill they do not have.
8. Respond with a single JSON object and nothing else. No markdown fences, no commentary.

FORMAT EXAMPLE (structure only, contains no numbers): "Implemented role-based access control with JWT authentication and server-side validation across the REST API layer."`;

export interface TailoringPromptInput {
  resumeText: string;
  jdText: string;
  keywords: KeywordSet;
  responsibilities?: string[];
  additionalPrompt?: string;
  singlePage?: boolean;
}

function formatVocabulary(input: TailoringPromptInput): string {
  const required = input.keywords.required ?? [];
  const preferred = input.keywords.preferred ?? [];
  const lines: string[] = [];

  if (required.length) {
    lines.push(`REQUIRED KEYWORDS (use only where the source supports them):`);
    lines.push(required.join(", "));
  }
  if (preferred.length) {
    lines.push(`PREFERRED KEYWORDS (use only where the source supports them):`);
    lines.push(preferred.join(", "));
  }
  if (input.responsibilities?.length) {
    lines.push(`RESPONSIBILITIES THE ROLE OWNS:`);
    lines.push(input.responsibilities.join("; "));
  }
  return lines.join("\n");
}

export function buildUserPrompt(input: TailoringPromptInput): string {
  let prompt = `SOURCE RESUME (the only truth about this candidate):
"""
${input.resumeText}
"""

JOB DESCRIPTION (target role):
"""
${input.jdText}
"""

TARGET VOCABULARY (extracted from the job description):
${formatVocabulary(input)}`;

  if (input.additionalPrompt && input.additionalPrompt.trim()) {
    prompt += `

THE CANDIDATE'S OWN INSTRUCTIONS:
"""
${input.additionalPrompt.trim()}
"""
Apply these instructions while staying truthful to the source resume. Facts the candidate supplies here may be used; anything else may not be invented.`;
  }

  if (input.singlePage === false) {
    prompt += `

LENGTH: this is a comprehensive resume. Include every role, project, certification and education entry from the source, keeping all of the source bullets.`;
  } else {
    prompt += `

LENGTH: this is a single-page resume. Keep every role, project, certification and education entry from the source, and keep every source bullet for each of them. Tighten the wording instead of cutting content.`;
  }

  prompt += `

OUTPUT SHAPE (return exactly these keys):
{
  "notes": string[],
  "name": string,
  "contact": string,
  "title": string,
  "summary": string,
  "skills": [{ "label": string, "value": string }],
  "experience": [{ "title": string, "company": string, "location": string, "dates": string, "bullets": string[] }],
  "projects": [{ "name": string, "tools": string, "bullets": string[] }],
  "education": [{ "school": string, "degree": string, "dates": string }],
  "certifications": string[]
}

Do not include a score, a keyword match list or any field outside this shape. Return only the JSON object.`;
  return prompt;
}
