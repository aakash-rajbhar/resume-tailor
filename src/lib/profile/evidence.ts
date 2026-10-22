import { normalizeForMatch, skillVariants } from "@/lib/skills/synonyms";
import type { SkillEvidenceRef } from "@/lib/schemas";

/**
 * Skill evidence.
 *
 * Evidence is computed in code, never by a model: a skill is evidenced when
 * the text of a role, a project or the resume itself mentions it. The alias
 * map supplies the surface forms, so "React" matches "React.js" and
 * "REST" matches "REST APIs".
 */

export type EvidenceKind = SkillEvidenceRef["kind"];

export interface EvidenceCandidate {
  kind: EvidenceKind;
  /** The row id of the role or project, when the evidence comes from a row. */
  refId?: string | null;
  /** A short human label, e.g. "Backend Engineer at Acme". */
  label: string;
  /** The text that may mention the skill. */
  text: string;
}

const MAX_EVIDENCE_REFS = 20;

/** Two tokens match when they are equal, or one is the plural of the other. */
function tokenMatches(token: string, variantToken: string): boolean {
  if (token === variantToken) return true;
  if (token.length > 3 && token.endsWith("s") && token.slice(0, -1) === variantToken) {
    return true;
  }
  if (
    variantToken.length > 3 &&
    variantToken.endsWith("s") &&
    variantToken.slice(0, -1) === token
  ) {
    return true;
  }
  return false;
}

/** True when the token sequence of a variant appears in the text tokens. */
function containsTokens(tokens: string[], variantTokens: string[]): boolean {
  if (!variantTokens.length || tokens.length < variantTokens.length) return false;

  for (let start = 0; start + variantTokens.length <= tokens.length; start++) {
    let matched = true;
    for (let offset = 0; offset < variantTokens.length; offset++) {
      if (!tokenMatches(tokens[start + offset], variantTokens[offset])) {
        matched = false;
        break;
      }
    }
    if (matched) return true;
  }

  return false;
}

/**
 * The surface forms of a skill that count as evidence, normalized the same
 * way as the text they are matched against.
 */
export function evidenceVariants(skillName: string): string[] {
  const variants = skillVariants(skillName);
  const extra = normalizeForMatch(skillName);
  const all = new Set<string>([...variants]);
  if (extra) all.add(extra);
  return [...all].filter(Boolean);
}

/**
 * The evidence for one skill, in the order the candidates were given.
 */
export function matchSkillEvidence(
  skillName: string,
  candidates: EvidenceCandidate[],
): SkillEvidenceRef[] {
  const variants = evidenceVariants(skillName)
    .map((variant) => variant.split(" ").filter(Boolean))
    .filter((tokens) => tokens.length > 0);

  if (!variants.length) return [];

  const refs: SkillEvidenceRef[] = [];

  for (const candidate of candidates) {
    const tokens = normalizeForMatch(candidate.text).split(" ").filter(Boolean);
    if (!tokens.length) continue;

    if (!variants.some((variant) => containsTokens(tokens, variant))) continue;

    refs.push({
      kind: candidate.kind,
      refId: candidate.refId ?? null,
      note: candidate.label.slice(0, 300),
    });

    if (refs.length >= MAX_EVIDENCE_REFS) break;
  }

  return refs;
}

/**
 * The text of a role or project that evidence is matched against.
 */
export function evidenceTextOf(entry: {
  title?: string | null;
  company?: string | null;
  name?: string | null;
  summary?: string | null;
  description?: string | null;
  bullets?: unknown;
  tools?: unknown;
}): string {
  const list = (value: unknown): string[] =>
    Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];

  return [
    entry.title,
    entry.company,
    entry.name,
    entry.summary,
    entry.description,
    ...list(entry.bullets),
    ...list(entry.tools),
  ]
    .filter(Boolean)
    .join(" \n ");
}
