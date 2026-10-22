const GENERIC_SUFFIXES = [
  "workflows",
  "workflow",
  "pipelines",
  "pipeline",
  "practices",
  "practice",
  "frameworks",
  "framework",
  "tools",
  "tool",
  "technologies",
  "technology",
  "experience",
  "skills",
  "skill",
  "layers",
  "layer",
];

const PROTECTED_COMPOUNDS = new Set([
  "ci/cd",
  "tcp/ip",
  "a/b",
  "i/o",
]);

const SINGULAR_PLURAL: [RegExp, string][] = [
  [/\bapis\b/g, "api"],
  [/\brest apis\b/g, "rest api"],
];

function trimSuffixes(word: string): string {
  let current = word.trim().toLowerCase();
  let changed = true;
  while (changed) {
    changed = false;
    for (const suffix of GENERIC_SUFFIXES) {
      if (current === suffix) continue;
      if (current.endsWith(" " + suffix)) {
        current = current.slice(0, current.length - (suffix.length + 1)).trim();
        changed = true;
        break;
      }
    }
  }
  return current;
}

function splitCompound(token: string): string[] {
  const lower = token.toLowerCase().trim();
  if (!lower) return [];
  if (PROTECTED_COMPOUNDS.has(lower)) return [lower];

  // split on /
  if (lower.includes("/")) {
    const parts = lower.split("/").map((p) => p.trim()).filter(Boolean);
    // if both parts form known compound, keep as is? we protect above
    if (parts.length === 2 && PROTECTED_COMPOUNDS.has(parts.join("/"))) {
      return [parts.join("/")];
    }
    return parts;
  }
  // split on comma
  if (lower.includes(",")) {
    return lower.split(",").map((p) => p.trim()).filter(Boolean);
  }
  // split on " and "
  if (lower.includes(" and ")) {
    return lower.split(" and ").map((p) => p.trim()).filter(Boolean);
  }
  return [lower];
}

function normalizeSingularPlural(s: string): string {
  let current = s;
  for (const [re, replacement] of SINGULAR_PLURAL) {
    current = current.replace(re, replacement);
  }
  return current;
}

export function canonicalizeExtractedSkill(raw: string): string | null {
  if (!raw) return null;
  let current = raw.trim().toLowerCase();
  current = normalizeSingularPlural(current);
  // split
  const parts = splitCompound(current);
  if (parts.length === 0) return null;
  if (parts.length > 1) {
    // caller should handle splitting; return first for single
    // but we handle at higher level
  }
  current = parts[0];
  current = trimSuffixes(current);
  current = normalizeSingularPlural(current);
  // drop if too long (>4 words)
  const words = current.split(/\s+/).filter(Boolean);
  if (words.length > 4) return null;
  if (words.length === 0) return null;
  // normalize some common forms
  if (current === "git/github") return null; // should be split
  if (current === "github" || current === "git") return current;
  return current;
}

export function canonicalizeExtractedSkills(skills: string[]): {
  skills: string[];
  movedToOther: string[];
} {
  const result = new Set<string>();
  const movedToOther: string[] = [];

  for (const raw of skills ?? []) {
    if (!raw || typeof raw !== "string") continue;
    const lower = raw.trim().toLowerCase();
    if (!lower) continue;
    const normalizedSP = normalizeSingularPlural(lower);

    // check if needs splitting
    if (normalizedSP.includes("/") && !PROTECTED_COMPOUNDS.has(normalizedSP.replace(/\s+/g, ""))) {
      const parts = splitCompound(normalizedSP);
      for (const p of parts) {
        const c = canonicalizeExtractedSkill(p);
        if (c && c.split(/\s+/).length <= 4) result.add(c);
        else if (p.split(/\s+/).length > 4) movedToOther.push(raw);
      }
      continue;
    }
    if (normalizedSP.includes(",")) {
      const parts = splitCompound(normalizedSP);
      for (const p of parts) {
        const c = canonicalizeExtractedSkill(p);
        if (c) result.add(c);
      }
      continue;
    }
    if (normalizedSP.includes(" and ")) {
      const parts = splitCompound(normalizedSP);
      for (const p of parts) {
        const c = canonicalizeExtractedSkill(p);
        if (c) result.add(c);
      }
      continue;
    }

    const c = canonicalizeExtractedSkill(normalizedSP);
    if (!c) {
      const words = normalizedSP.split(/\s+/).filter(Boolean);
      if (words.length > 4) movedToOther.push(raw);
      continue;
    }
    const words = c.split(/\s+/).filter(Boolean);
    if (words.length > 4) {
      movedToOther.push(raw);
      continue;
    }
    result.add(c);
  }

  const sorted = Array.from(result).sort((a, b) => a.localeCompare(b));
  return { skills: sorted, movedToOther };
}
