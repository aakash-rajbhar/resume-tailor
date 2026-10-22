/**
 * Prompts for the profile builder.
 *
 * One system prompt and one example per section. Every example contains no
 * numbers and no metrics, so the model is never nudged towards inventing
 * figures. Dates are copied verbatim and parsed in code.
 */

/** Bumped whenever these prompts change. */
export const PROFILE_PROMPT_VERSION = "2026.10.22.1";

export const PROFILE_SYSTEM_PROMPT = `You extract structured profile content from a resume.

Rules:
1. Extract ONLY what the resume states. Never invent an employer, title, date, degree, certification, metric, tool or skill. If the resume does not say it, leave the field empty.
2. COPY, DO NOT REWRITE. Keep the original wording of titles, bullets, degrees and certifications. Do not paraphrase, do not tidy up and do not add adjectives.
3. NUMBERS: keep a number only when the resume already contains that exact number. Never create, round, estimate or infer a figure.
4. DATES: copy the date text exactly as the resume writes it, in the shape the resume uses (a month name followed by a four digit year, a four digit year on its own, a year and month, or the word "Present"). Never guess a month that is not written. Use an empty string when the resume states no date. Set isCurrent to true only when the resume says the role is ongoing.
5. BULLETS: one array entry per bullet line, with the original wording. Use an empty array when there are no bullets.
6. SKILLS: one skill per entry, using the shortest accurate name. Do not split a name into parts. Use a groupLabel only when the resume itself groups the skills under a heading; otherwise leave it empty.
7. SORTING: roles and projects with the most recent first, skills, schools and certifications alphabetically.
8. BOUNDS: never return more than 10 roles, 10 projects, 60 skills, 8 education entries or 12 certifications.
9. The resume text has had contact details removed. Do not guess a name, an email address, a phone number or a link.
10. Respond with a single JSON object and nothing else. Every example below contains no numbers.`;

export const SUMMARY_EXAMPLE = `EXAMPLE OUTPUT:
{
  "headline": "Backend Engineer",
  "summary": "Backend engineer working on payments and data services.",
  "location": "Bengaluru, India"
}`;

export const EXPERIENCE_EXAMPLE = `EXAMPLE OUTPUT:
{
  "items": [
    {
      "company": "Northwind Analytics",
      "title": "Backend Engineer",
      "location": "Bengaluru, India",
      "startDate": "",
      "endDate": "Present",
      "isCurrent": true,
      "bullets": [
        "Built the settlement service that processes payouts for merchants.",
        "Cut the nightly reconciliation job runtime by replacing a full table scan with an incremental cursor."
      ]
    },
    {
      "company": "Riverbend Labs",
      "title": "Software Engineer",
      "location": "",
      "startDate": "",
      "endDate": "",
      "isCurrent": false,
      "bullets": []
    }
  ]
}`;

export const PROJECTS_EXAMPLE = `EXAMPLE OUTPUT:
{
  "items": [
    {
      "name": "Ledger CLI",
      "summary": "Command line tool that reads a ledger file and prints a balance report.",
      "bullets": [
        "Shipped a parser for the ledger format with per-line error messages.",
        "Added a command that prints the balance for an account."
      ],
      "tools": ["TypeScript", "Node.js"],
      "startDate": "",
      "endDate": ""
    }
  ]
}`;

export const SKILLS_EXAMPLE = `EXAMPLE OUTPUT:
{
  "items": [
    { "name": "Docker", "groupLabel": "Tools" },
    { "name": "PostgreSQL", "groupLabel": "Databases" },
    { "name": "TypeScript", "groupLabel": "Languages" }
  ]
}`;

export const EDUCATION_EXAMPLE = `EXAMPLE OUTPUT:
{
  "items": [
    {
      "school": "Anna University",
      "degree": "Bachelor of Engineering",
      "fieldOfStudy": "Computer Science",
      "startDate": "",
      "endDate": ""
    }
  ]
}`;

export const CERTIFICATIONS_EXAMPLE = `EXAMPLE OUTPUT:
{
  "items": [
    { "name": "AWS Certified Developer", "issuer": "Amazon Web Services", "issuedOn": "" }
  ]
}`;

export type ProfileSection =
  | "summary"
  | "experience"
  | "projects"
  | "skills"
  | "education"
  | "certifications";

/**
 * The instruction that follows the resume text for one section.
 */
const SECTION_INSTRUCTIONS: Record<ProfileSection, string> = {
  summary:
    "Extract the candidate's headline, a short summary of what the resume shows, and the location. The summary must only state what the resume supports.",
  experience:
    "Extract every role in the resume, most recent first. Copy the company, title, location, the dates as written and one bullet per bullet line.",
  projects:
    "Extract every project in the resume, most recent first. Copy the name, a short summary, the bullet lines and the tools the project names.",
  skills:
    "Extract every skill and tool the resume names, alphabetically. Use a groupLabel only when the resume groups the skills under a heading.",
  education:
    "Extract every education entry. Copy the school, the degree, the field of study and the dates as written.",
  certifications:
    "Extract every certification, license or award the resume names. Copy the name, the issuer and the date as written.",
};

const SECTION_EXAMPLES: Record<ProfileSection, string> = {
  summary: SUMMARY_EXAMPLE,
  experience: EXPERIENCE_EXAMPLE,
  projects: PROJECTS_EXAMPLE,
  skills: SKILLS_EXAMPLE,
  education: EDUCATION_EXAMPLE,
  certifications: CERTIFICATIONS_EXAMPLE,
};

/**
 * The user prompt for one section. The resume text is the only source of
 * truth and has already had its contact details removed.
 */
export function buildSectionPrompt(section: ProfileSection, resumeText: string): string {
  return `RESUME:
"""
${resumeText}
"""

${SECTION_EXAMPLES[section]}

${SECTION_INSTRUCTIONS[section]}

Return only the JSON object.`;
}
