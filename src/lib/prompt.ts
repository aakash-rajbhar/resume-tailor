import type { KeywordSet } from "./score";

/**
 * Bumped whenever the tailoring prompt changes so cached LLM responses are
 * invalidated.
 */
export const PROMPT_VERSION = "2026.10.22.1";

/**
 * Bumped whenever the JD extraction prompt changes so cached extractions are
 * invalidated.
 */
export const EXTRACT_PROMPT_VERSION = "2026.10.22.3";

export const JD_SYSTEM_PROMPT = `You extract structured requirements from a job description.

Rules:
1. Extract ONLY what the job description explicitly states. Never infer a skill, tool or qualification that is not written in the text.
2. required_skills and preferred_skills must hold SINGLE skills, tools, or technologies. Each entry must be at most three words. No sentences, no degrees, no long phrases.
3. A skill is REQUIRED when the job description marks it as required (words such as "required", "must", "need", "minimum", "essential"), lists it under a requirements section, or names it as a tool the role will use. Skills listed as nice-to-have (words such as "preferred", "plus", "bonus", "a plus") are PREFERRED.
4. Split compounds into single skills. A slash-separated pair of tools becomes two entries. A comma-separated list becomes one entry per item. A list joined by "and" becomes one entry per item. "unit, integration and end-to-end testing" becomes three entries: "unit testing", "integration testing", "end-to-end testing". "Jest and Playwright" becomes two entries. Keep CI/CD as one entry.
5. Generic traits (communication, teamwork, attention to detail) are not skills.
6. education_requirement: put any degree or education requirement as a short string if the job description states it, otherwise null.
7. other_requirements: list explicit requirements that are not single skills or tools (for example open source contributions, mentoring, on-call ownership) as short phrases. These do NOT count toward scoring.
8. Never add a skill that is only named inside other_requirements or education_requirement; every skill the description names belongs in required_skills or preferred_skills.
9. Sort required_skills and preferred_skills alphabetically, case-insensitively.
10. Use empty arrays when nothing applies. Use null for education_requirement when it is not stated.
11. Respond with a single JSON object and nothing else. Every example below contains no numbers.`;

export const JD_EXAMPLE = `EXAMPLE JOB DESCRIPTION:
Requirements: React and TypeScript. Must have hands-on experience with REST APIs and PostgreSQL.
Preferred: Docker experience is a plus. Exposure to unit, integration and end-to-end testing.
Write automated tests with Jest and Playwright. Contributes to open source.
Requires a bachelor's degree in computer science or equivalent.

EXAMPLE OUTPUT:
{
  "title": "",
  "company": "",
  "seniority": "",
  "required_skills": ["Jest", "Playwright", "PostgreSQL", "React", "REST APIs", "TypeScript"],
  "preferred_skills": ["Docker", "End-to-End Testing", "Integration Testing", "Unit Testing"],
  "responsibilities": [],
  "education_requirement": "Bachelor's degree in computer science or equivalent",
  "other_requirements": ["Contributes to open source"]
}`;

export function buildJDUserPrompt(jdText: string): string {
  return `JOB DESCRIPTION:
"""
${jdText}
"""

${JD_EXAMPLE}

Now extract the role title, company, seniority, required_skills (single skills and tools only), preferred_skills (single skills and tools only), responsibilities, education_requirement (short string or null) and other_requirements (non-skill requirements). Split compounds into single skills. Return only the JSON object.`;
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
