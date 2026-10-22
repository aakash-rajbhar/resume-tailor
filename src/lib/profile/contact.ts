/**
 * Contact extraction and redaction.
 *
 * Runs entirely in code, before any resume text is sent to a model. Email
 * addresses, phone numbers and links are pulled out of the text and replaced
 * with placeholders, so a model only ever sees professional content: role
 * titles, employers, dates, bullets and skills.
 *
 * Nothing here invents a value. A field is filled only when the text states
 * it; everything else stays empty for the user to confirm or correct.
 */

/** An email address, including the common `first.last@host.tld` shapes. */
const EMAIL_PATTERN =
  /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}/g;

/** A URL with an explicit scheme, or a `www.` host. */
const SCHEME_URL_PATTERN = /\b(?:https?:\/\/|www\.)[^\s<>"'`]+/gi;

/**
 * A bare domain such as `github.com/aakash`. Only well-known public
 * suffixes are listed so `Node.js`, `README.md` and `e.g` are not treated as
 * links.
 */
const BARE_DOMAIN_PATTERN =
  /\b[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)*\.(?:com|org|net|edu|gov|io|dev|co|ai|me|xyz|app|tech|info|biz|us|uk|in|sh|so|gg)\b(?:\/[^\s<>"'`]*)?/gi;

/**
 * A phone-shaped run of digits. The shape is deliberately narrow: groups of
 * two to five digits, optional country code and optional parenthesised area
 * code. `/` is not a separator so `03/2021` never reads as a phone number.
 */
const PHONE_CANDIDATE_PATTERN =
  /(?<![\w.-])(?:\+?\d{1,4}[-.\s]?)?(?:\(\d{1,4}\)[-.\s]?)?\d{2,5}(?:[-.\s]\(?\d{2,5}\)?){1,4}(?![\w-])/g;

/** A four-digit group that looks like a year is a date, not a phone number. */
const YEAR_GROUP_PATTERN = /^(?:19|20)\d{2}$/;

const MIN_PHONE_DIGITS = 7;
const MAX_PHONE_DIGITS = 15;

/** Section headings that are never a person's name. */
const HEADING_WORDS = new Set([
  "summary",
  "profile",
  "about",
  "contact",
  "details",
  "experience",
  "work experience",
  "professional experience",
  "employment",
  "education",
  "skills",
  "projects",
  "certifications",
  "certificates",
  "awards",
  "languages",
  "interests",
  "references",
  "resume",
  "curriculum vitae",
  "cv",
  "objective",
  "publications",
  "volunteering",
  "achievements",
]);

export interface ExtractedContact {
  /** Best-effort name from the resume header. */
  fullName: string | null;
  email: string | null;
  phone: string | null;
  /** Every link found, de-duplicated, in the order they appear. */
  urls: string[];
  githubUrl: string | null;
  linkedinUrl: string | null;
  portfolioUrl: string | null;
}

export interface RedactedResume {
  /** The text with emails, phone numbers and links replaced by placeholders. */
  text: string;
  /** The contact fields that were removed from the text. */
  contact: ExtractedContact;
}

function cleanUrl(raw: string): string {
  let url = raw.trim();
  // Drop sentence punctuation that was captured with the URL.
  url = url.replace(/[.,;:!?)\]}'"]+$/g, "");
  if (!url) return "";
  if (/^www\./i.test(url)) return `https://${url}`;
  if (!/^https?:\/\//i.test(url)) return `https://${url}`;
  return url;
}

function isEmailLike(value: string): boolean {
  return value.includes("@");
}

/** True when the value looks like a link rather than a plain word. */
function isUrlLike(value: string): boolean {
  return /^(?:https?:\/\/|www\.)/i.test(value) || /\.[a-z]{2,}(?:\/|$)/i.test(value);
}

function collectUrls(text: string): string[] {
  const found: string[] = [];
  const seen = new Set<string>();

  const push = (raw: string) => {
    const url = cleanUrl(raw);
    if (!url) return;
    const key = url.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    found.push(url);
  };

  for (const match of text.matchAll(SCHEME_URL_PATTERN)) push(match[0]);
  for (const match of text.matchAll(BARE_DOMAIN_PATTERN)) push(match[0]);

  return found;
}

/** Removes every match of a pattern from the text. */
function removeMatches(text: string, pattern: RegExp): string {
  return text.replace(pattern, " ");
}

/**
 * The phone number candidates that survive the digit-count and year checks.
 */
function collectPhones(text: string): string[] {
  const found: string[] = [];
  const seen = new Set<string>();

  for (const match of text.matchAll(PHONE_CANDIDATE_PATTERN)) {
    const raw = match[0].trim();
    if (!raw) continue;

    const groups = raw.split(/[-.\s]+/).filter(Boolean);
    if (groups.some((group) => YEAR_GROUP_PATTERN.test(group.replace(/\D/g, "")))) {
      continue;
    }

    const digits = raw.replace(/\D/g, "");
    if (digits.length < MIN_PHONE_DIGITS || digits.length > MAX_PHONE_DIGITS) {
      continue;
    }

    const key = digits;
    if (seen.has(key)) continue;
    seen.add(key);
    found.push(raw);
  }

  return found;
}

/**
 * The name in the resume header: the first line that reads like a person's
 * name. Returns null when nothing plausible is found.
 */
function detectName(text: string): string | null {
  const lines = text.split(/\r?\n/).slice(0, 8);

  for (const line of lines) {
    const candidate = line.trim();
    if (!candidate || candidate.length > 60) continue;
    if (isEmailLike(candidate) || isUrlLike(candidate)) continue;
    if (/\d/.test(candidate)) continue;
    if (!/^[A-Za-z][A-Za-z.'\- ]*$/.test(candidate)) continue;

    const words = candidate.split(/\s+/).filter(Boolean);
    if (words.length < 2 || words.length > 4) continue;
    if (HEADING_WORDS.has(candidate.toLowerCase())) continue;
    if (words.every((word) => HEADING_WORDS.has(word.toLowerCase().replace(/\.$/, "")))) {
      continue;
    }

    return candidate;
  }

  return null;
}

/**
 * Reads the contact fields out of a resume without asking a model.
 */
export function extractContact(text: string): ExtractedContact {
  const emails = text.match(EMAIL_PATTERN) ?? [];
  const email = emails[0] ?? null;

  // Links are removed first so digits inside a URL are never read as a phone.
  const withoutUrls = removeMatches(
    removeMatches(text, SCHEME_URL_PATTERN),
    BARE_DOMAIN_PATTERN,
  );
  const phones = collectPhones(withoutUrls);
  const phone = phones[0] ?? null;

  // The emails go first as well, so the domain of an address is never read
  // as a link.
  const urls = collectUrls(removeMatches(text, EMAIL_PATTERN));
  const githubUrl = urls.find((url) => /(^|\/\/|\.)github\.com\//i.test(url)) ?? null;
  const linkedinUrl =
    urls.find((url) => /(^|\/\/|\.)linkedin\.com\//i.test(url)) ?? null;
  const portfolioUrl =
    urls.find((url) => url !== githubUrl && url !== linkedinUrl) ?? null;

  return {
    fullName: detectName(text),
    email,
    phone,
    urls,
    githubUrl,
    linkedinUrl,
    portfolioUrl,
  };
}

/**
 * Removes the contact details from a resume and returns them separately.
 * The text that comes back is what may be sent to a model.
 */
export function redactContact(text: string): RedactedResume {
  const contact = extractContact(text);

  let redacted = text;
  redacted = removeMatches(redacted, EMAIL_PATTERN);
  redacted = removeMatches(redacted, SCHEME_URL_PATTERN);
  redacted = removeMatches(redacted, BARE_DOMAIN_PATTERN);

  // Every phone-shaped run is removed, not only the first one, so a second
  // number in the body never reaches a model.
  for (const phone of collectPhones(redacted)) {
    redacted = redacted.split(phone).join(" ");
  }

  redacted = redacted
    .replace(/[ \t]{2,}/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return { text: redacted, contact };
}
