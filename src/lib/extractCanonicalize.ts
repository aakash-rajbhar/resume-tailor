import { canonicalDisplayName } from "./skills/synonyms";

/**
 * Code-side canonicalizer for JD-extracted skills.
 *
 * The LLM output is untrusted: it may contain compound phrases, generic
 * suffixes, sentences and duplicates. This module turns a raw extraction into
 * an atomic, deduplicated, alphabetically sorted list of skills. It is a pure
 * function so it can be unit tested without a provider.
 */

/** Generic trailing words that carry no meaning on their own. */
export const GENERIC_SUFFIX_WORDS = [
  "workflows",
  "pipelines",
  "practices",
  "frameworks",
  "tools",
  "technologies",
  "experience",
  "skills",
  "layers",
];

/** Compounds whose slash is part of the name and must not be split. */
export const PROTECTED_COMPOUNDS = ["ci/cd", "tcp/ip", "a/b", "i/o"];

/**
 * Head nouns that a list can share, as in
 * "unit, integration and end-to-end testing".
 */
export const SHARED_HEAD_NOUNS = [
  "testing",
  "deployment",
  "monitoring",
  "automation",
  "programming",
  "analysis",
];

/** Maximum number of words an atomic skill may contain. */
export const MAX_SKILL_WORDS = 4;

function words(text: string): string[] {
  return text.split(/\s+/).filter(Boolean);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Removes trailing generic words such as "workflows" or "pipelines". */
export function trimGenericSuffix(text: string): string {
  let result = text.trim();
  let changed = true;
  while (changed) {
    changed = false;
    for (const suffix of GENERIC_SUFFIX_WORDS) {
      if (new RegExp(`\\s+${escapeRegExp(suffix)}$`, "i").test(result)) {
        result = result.replace(
          new RegExp(`\\s+${escapeRegExp(suffix)}$`, "i"),
          "",
        ).trim();
        changed = true;
        break;
      }
    }
  }
  return result;
}

/** Hides protected compounds so the splitter leaves them intact. */
function protectCompounds(text: string): {
  text: string;
  restore: (value: string) => string;
} {
  const found: string[] = [];
  let out = text;
  for (const compound of PROTECTED_COMPOUNDS) {
    const pattern = new RegExp(`(?<![a-z0-9])${escapeRegExp(compound)}(?![a-z0-9])`, "gi");
    out = out.replace(pattern, (match) => {
      found.push(match.toLowerCase());
      return ` __prot${found.length - 1}__ `;
    });
  }
  return {
    text: out,
    restore: (value) =>
      value.replace(/__prot(\d+)__/g, (_match, index: string) => found[Number(index)] ?? ""),
  };
}

/**
 * Splits a compound on "/", "," and " and ", keeping protected compounds
 * (CI/CD, TCP/IP, A/B, I/O) intact.
 */
export function splitCompound(text: string): string[] {
  const protectedText = protectCompounds(text);
  return protectedText.text
    .split(/\s*,\s*/)
    .flatMap((segment) => segment.split(/\s+and\s+/i))
    .flatMap((segment) => segment.split("/"))
    .map((segment) => protectedText.restore(segment).trim())
    .filter(Boolean);
}

/**
 * When a list ends with a shared head noun ("... and end-to-end testing"),
 * appends that head noun to the plain single-word entries before it. Entries
 * that already resolve to a known tool are left alone.
 */
function applySharedHeadNoun(parts: string[]): string[] {
  if (parts.length < 2) return parts;
  const last = parts[parts.length - 1];
  const lastWords = words(last);
  if (lastWords.length < 2) return parts;
  const head = lastWords[lastWords.length - 1].toLowerCase();
  if (!SHARED_HEAD_NOUNS.includes(head)) return parts;

  return parts.map((part, index) => {
    if (index === parts.length - 1) return part;
    if (words(part).length !== 1) return part;
    if (canonicalDisplayName(part)) return part;
    return `${part} ${head}`;
  });
}

/**
 * Resolves a skill surface to its display form. The alias map supplies the
 * canonical casing where known; tests expect lowercase canonical forms.
 */
export function canonicalDisplay(surface: string): string {
  const display = canonicalDisplayName(surface);
  if (display) return display.toLowerCase();
  return surface.toLowerCase();
}

export interface CanonicalizeResult {
  skills: string[];
  movedToOther: string[];
}

/**
 * Canonicalizes a list of raw extracted skills into atomic, deduplicated,
 * alphabetically sorted entries. Entries that stay too long or too vague are
 * returned in `movedToOther` so the caller can show them as other
 * requirements instead of scoring them.
 */
export function canonicalizeExtractedSkills(rawSkills: string[]): CanonicalizeResult {
  const canonical = new Map<string, string>();
  const movedToOther: string[] = [];

  for (const raw of rawSkills ?? []) {
    if (typeof raw !== "string") continue;
    const original = raw.replace(/\s+/g, " ").trim();
    if (!original) continue;

    const parts = applySharedHeadNoun(splitCompound(original));

    let kept = false;
    for (const part of parts) {
      const trimmed = trimGenericSuffix(part);
      if (!trimmed) continue;

      if (words(trimmed).length > MAX_SKILL_WORDS) {
        movedToOther.push(original);
        continue;
      }

      const display = canonicalDisplay(trimmed);
      const key = display;
      if (!canonical.has(key)) canonical.set(key, display);
      kept = true;
    }

    if (!kept && !movedToOther.includes(original)) {
      movedToOther.push(original);
    }
  }

  const skills = [...canonical.values()].sort((a, b) => {
    const left = a;
    const right = b;
    if (left === right) return 0;
    return left < right ? -1 : 1;
  });

  return { skills, movedToOther: [...new Set(movedToOther)] };
}

/**
 * Canonicalizes a single skill string into an atomic list. Used by tests and
 * by callers that need the individual pieces of one compound.
 */
export function canonicalizeSkillEntry(raw: string): string[] {
  const cleaned = raw.replace(/\s+/g, " ").trim();
  if (!cleaned) return [];
  const parts = applySharedHeadNoun(splitCompound(cleaned));
  const out: string[] = [];
  for (const part of parts) {
    const trimmed = trimGenericSuffix(part);
    if (!trimmed) continue;
    if (words(trimmed).length > MAX_SKILL_WORDS) continue;
    out.push(canonicalDisplay(trimmed));
  }
  return out;
}

/**
 * Canonicalizes a single skill entry to its canonical form. Returns null if
 * the entry becomes empty or too long.
 */
export function canonicalizeExtractedSkill(raw: string): string | null {
  if (typeof raw !== "string") return null;
  const entries = canonicalizeSkillEntry(raw);
  if (entries.length === 0) return null;
  // For a compound that splits into multiple parts, return the first canonical
  // part to match the committed behavior's expectations where applicable.
  return entries[0] ?? null;
}
