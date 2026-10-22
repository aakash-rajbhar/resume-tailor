#!/usr/bin/env node
/**
 * Extraction-only baseline.
 *
 * Calls extractJD directly (no tailoring) for each provider, N times per
 * provider, clearing .cache before every run. Reports the canonicalized
 * keyword set for each run and the Jaccard overlap within and across
 * providers, which is the number that matters for cross-provider consistency.
 *
 * Usage:
 *   npx tsx scripts/extraction-baseline.mjs [--runs=5] [--out=docs/baseline.md]
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const args = {
  runs: 5,
  out: "docs/baseline.md",
  gapMs: 0,
  geminiModel: "gemini-3.6-flash",
  groqModel: "openai/gpt-oss-20b",
};
for (const raw of process.argv.slice(2)) {
  const m = /^--([^=]+)(?:=(.*))?$/.exec(raw);
  if (!m) continue;
  if (m[1] === "runs") args.runs = Number(m[2] ?? 5);
  if (m[1] === "out") args.out = m[2];
  if (m[1] === "gap") args.gapMs = Number(m[2] ?? 0);
  if (m[1] === "gemini-model") args.geminiModel = m[2];
  if (m[1] === "groq-model") args.groqModel = m[2];
}

function loadEnvFile(file) {
  const out = {};
  if (!existsSync(file)) return out;
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

for (const [key, value] of Object.entries(loadEnvFile(path.join(ROOT, ".env.local")))) {
  if (!process.env[key]) process.env[key] = value;
}

function clearCache() {
  const dir = path.join(ROOT, ".cache");
  if (!existsSync(dir)) return;
  rmSync(dir, { recursive: true, force: true });
}

function jaccard(a, b) {
  const sa = new Set(a);
  const sb = new Set(b);
  const union = new Set([...sa, ...sb]);
  if (union.size === 0) return 1;
  let inter = 0;
  for (const item of sa) if (sb.has(item)) inter += 1;
  return inter / union.size;
}

const { extractJD } = await import(path.join(ROOT, "src/lib/extractJD.ts"));

const jdText = readFileSync(path.join(ROOT, "scripts/fixtures/jd.txt"), "utf8");
const providers = [
  { provider: "gemini", model: args.geminiModel },
  { provider: "groq", model: args.groqModel },
];

const results = {};

for (const { provider, model } of providers) {
  const runs = [];
  for (let i = 1; i <= args.runs; i++) {
    if (args.gapMs && i > 1) {
      await new Promise((r) => setTimeout(r, args.gapMs));
    }
    clearCache();
    const startedAt = Date.now();
    try {
      const result = await extractJD(jdText, {
        extractionProvider: provider,
        extractionModel: model,
      });
      const required = result.jd.required_skills ?? [];
      const preferred = result.jd.preferred_skills ?? [];
      runs.push({
        run: i,
        ms: Date.now() - startedAt,
        modelUsed: result.modelUsed,
        cached: result.cached,
        required,
        preferred,
        otherRequirements: result.jd.other_requirements ?? [],
        education: result.jd.education_requirement ?? null,
      });
      console.log(
        `[extraction] ${provider} run ${i}/${args.runs}: req=${required.length} pref=${preferred.length} (${Date.now() - startedAt}ms)`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown error";
      runs.push({ run: i, error: message.slice(0, 300) });
      console.log(`[extraction] ${provider} run ${i}/${args.runs} failed: ${message.slice(0, 160)}`);
    }
  }
  results[provider] = { provider, model, runs };
}

function setOf(entry) {
  return [...(entry.required ?? []), ...(entry.preferred ?? [])];
}

const lines = [];
lines.push("## Phase 0.9 extraction-only — Gemini vs Groq");
lines.push("");
lines.push(`Runs per provider: ${args.runs}. \`.cache/\` cleared before every individual run.`);
lines.push("");

for (const { provider, model } of providers) {
  const entry = results[provider];
  const ok = entry.runs.filter((r) => !r.error);
  lines.push(`### ${provider} (\`${model}\`)`);
  lines.push("");
  lines.push(`- Completed: ${ok.length}/${entry.runs.length}`);
  const pairs = [];
  for (let i = 0; i < ok.length; i++) {
    for (let j = i + 1; j < ok.length; j++) {
      pairs.push(jaccard(setOf(ok[i]), setOf(ok[j])));
    }
  }
  const avg = pairs.length ? pairs.reduce((a, b) => a + b, 0) / pairs.length : 1;
  lines.push(`- Within-provider Jaccard (mean over pairs): ${avg.toFixed(4)}`);
  lines.push(`- Distinct keyword sets: ${new Set(ok.map((r) => JSON.stringify(setOf(r).slice().sort()))).size}`);
  lines.push("");
  lines.push("| Run | Required | Preferred | Other requirements | Education | ms |");
  lines.push("| --- | --- | --- | --- | --- | --- |");
  for (const r of entry.runs) {
    if (r.error) {
      lines.push(`| ${r.run} | error | — | — | — | — |`);
      continue;
    }
    lines.push(
      `| ${r.run} | ${JSON.stringify(r.required)} | ${JSON.stringify(r.preferred)} | ${JSON.stringify(
        r.otherRequirements,
      )} | ${JSON.stringify(r.education)} | ${r.ms} |`,
    );
  }
  lines.push("");
}

const geminiOk = results.gemini.runs.filter((r) => !r.error);
const groqOk = results.groq.runs.filter((r) => !r.error);
if (geminiOk.length && groqOk.length) {
  const gemSet = new Set();
  for (const r of geminiOk) for (const s of setOf(r)) gemSet.add(s.toLowerCase());
  const groqSet = new Set();
  for (const r of groqOk) for (const s of setOf(r)) groqSet.add(s.toLowerCase());
  const inter = [...gemSet].filter((s) => groqSet.has(s));
  const union = new Set([...gemSet, ...groqSet]);
  lines.push("### Across providers (union of all runs)");
  lines.push("");
  lines.push(`- Gemini keywords: ${[...gemSet].sort().join(", ") || "(none)"}`);
  lines.push(`- Groq keywords: ${[...groqSet].sort().join(", ") || "(none)"}`);
  lines.push(`- Intersection: ${inter.sort().join(", ") || "(none)"}`);
  lines.push(`- Jaccard Gemini/Groq: ${(inter.length / union.size).toFixed(4)}`);
  lines.push("");
}

const outPath = path.join(ROOT, args.out);
mkdirSync(path.dirname(outPath), { recursive: true });
const section = lines.join("\n");
if (existsSync(outPath)) {
  const existing = readFileSync(outPath, "utf8");
  const marker = "## Phase 0.9 extraction-only";
  const index = existing.indexOf(marker);
  writeFileSync(outPath, index === -1 ? `${existing}\n${section}` : `${existing.slice(0, index)}${section}`);
} else {
  writeFileSync(outPath, `# Baseline measurements\n\n${section}`);
}
console.log(`[extraction] wrote ${args.out}`);
