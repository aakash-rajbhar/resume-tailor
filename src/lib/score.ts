import { canonicalizeSkill, normalizeForMatch, skillVariants } from "./skills/synonyms";

export interface KeywordSet {
  required: string[];
  preferred: string[];
}

export interface ScoreResult {
  score: number;
  matched: string[];
  missing: string[];
}

export interface KeywordMatch {
  keyword: string;
  canonical: string;
  required: boolean;
  found: boolean;
}

const REQUIRED_WEIGHT = 0.7;
const PREFERRED_WEIGHT = 0.3;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** True when the normalized text contains the skill as a standalone token. */
export function textContainsSkill(normalizedText: string, keyword: string): boolean {
  for (const variant of skillVariants(keyword)) {
    if (!variant) continue;
    const pattern = new RegExp(
      `(?<![a-z0-9])${escapeRegExp(variant)}(?![a-z0-9])`,
    );
    if (pattern.test(normalizedText)) return true;
  }
  return false;
}

/**
 * Deduplicated keyword list. Required wins over preferred when the same
 * canonical skill appears in both buckets.
 */
export function buildKeywordList(keywords: KeywordSet): KeywordMatch[] {
  const seen = new Map<string, KeywordMatch>();
  const add = (raw: string, required: boolean) => {
    const keyword = raw.trim();
    if (!keyword) return;
    const canonical = canonicalizeSkill(keyword);
    if (!canonical) return;
    const existing = seen.get(canonical);
    if (existing) {
      if (required && !existing.required) existing.required = true;
      return;
    }
    seen.set(canonical, { keyword, canonical, required, found: false });
  };
  for (const item of keywords.required ?? []) add(item, true);
  for (const item of keywords.preferred ?? []) add(item, false);
  return [...seen.values()];
}

/** Matches a keyword set against a block of text. Pure and order-stable. */
export function matchKeywords(keywords: KeywordSet, text: string): KeywordMatch[] {
  const normalizedText = normalizeForMatch(text ?? "");
  return buildKeywordList(keywords).map((entry) => ({
    ...entry,
    found: textContainsSkill(normalizedText, entry.keyword),
  }));
}

function sortKeywords(values: string[]): string[] {
  return [...values].sort((a, b) => {
    const left = a.toLowerCase();
    const right = b.toLowerCase();
    if (left === right) return a < b ? -1 : a > b ? 1 : 0;
    return left < right ? -1 : 1;
  });
}

/**
 * Deterministic ATS-style score. Required skills are worth 70% of the score,
 * preferred skills 30%. Outputs are sorted and deduplicated so repeated runs
 * on the same input return byte-identical results.
 */
export function computeScore(keywords: KeywordSet, text: string): ScoreResult {
  const matches = matchKeywords(keywords, text);

  const matched: string[] = [];
  const missing: string[] = [];
  let requiredTotal = 0;
  let requiredFound = 0;
  let preferredTotal = 0;
  let preferredFound = 0;

  for (const entry of matches) {
    if (entry.required) {
      requiredTotal += 1;
      if (entry.found) requiredFound += 1;
    } else {
      preferredTotal += 1;
      if (entry.found) preferredFound += 1;
    }
    (entry.found ? matched : missing).push(entry.keyword);
  }

  const requiredRatio = requiredTotal === 0 ? 0 : requiredFound / requiredTotal;
  const preferredRatio = preferredTotal === 0 ? 0 : preferredFound / preferredTotal;

  let score: number;
  if (requiredTotal > 0 && preferredTotal > 0) {
    score =
      100 *
      (REQUIRED_WEIGHT * requiredRatio + PREFERRED_WEIGHT * preferredRatio);
  } else if (requiredTotal > 0) {
    score = 100 * requiredRatio;
  } else if (preferredTotal > 0) {
    score = 100 * preferredRatio;
  } else {
    score = 0;
  }

  return {
    score: Math.max(0, Math.min(100, Math.round(score))),
    matched: sortKeywords(matched),
    missing: sortKeywords(missing),
  };
}
