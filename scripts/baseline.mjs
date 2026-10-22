#!/usr/bin/env node
/**
 * Baseline harness.
 *
 * Posts the SAME resume + job description to the running app N times and
 * records how much the outputs move between runs (score, matched keywords,
 * missing keywords). Used to measure LLM variance before and after the
 * deterministic-core work.
 *
 * Usage:
 *   node scripts/baseline.mjs --runs=5 --provider=gemini [--model=...] [--port=3000]
 *                           [--label=before] [--base-url=http://localhost:3000]
 *                           [--out=docs/baseline.md]
 *
 * Reads API keys from .env.local (never logged). Runs against a dev server it
 * starts itself unless --base-url points at an already running one.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync, appendFileSync, rmSync, readdirSync } from "node:fs";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function parseArgs(argv) {
  const args = {
    runs: 5,
    provider: "gemini",
    model: "",
    port: 3000,
    label: "run",
    baseUrl: "",
    out: "docs/baseline.md",
    keepServer: false,
    extractOnly: false,
    extractionProvider: "",
    gapMs: 0,
    reuseExtraction: false,
  };
  for (const raw of argv) {
    const m = /^--([^=]+)(?:=(.*))?$/.exec(raw);
    if (!m) continue;
    const key = m[1].replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    const value = m[2] ?? "true";
    if (key in args) args[key] = value === "true" ? true : value === "false" ? false : value;
  }
  args.runs = Number(args.runs);
  args.port = Number(args.port);
  args.gapMs = Number(args.gapMs);
  return args;
}

/**
 * A cached extraction entry stores `{ jd, modelUsed, fallbackUsed }`; a cached
 * tailoring entry stores `{ data }`. Keeping extraction entries pinned across
 * runs isolates tailoring variance from extraction variance.
 */
function isExtractionEntry(file) {
  try {
    const envelope = JSON.parse(readFileSync(file, "utf8"));
    return Boolean(
      envelope?.value && typeof envelope.value === "object" && "jd" in envelope.value,
    );
  } catch {
    return false;
  }
}

function clearCache({ keepExtraction = false } = {}) {
  const cacheDir = path.join(ROOT, ".cache");
  if (!existsSync(cacheDir)) return;
  try {
    const stores = readdirSync(cacheDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => path.join(cacheDir, entry.name));
    for (const store of stores) {
      for (const file of readdirSync(store)) {
        const full = path.join(store, file);
        if (keepExtraction && isExtractionEntry(full)) continue;
        rmSync(full, { recursive: true, force: true });
      }
    }
  } catch {
    /* ignore */
  }
}

/** Minimal .env.local reader. Values are never printed. */
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

async function waitForServer(url, timeoutMs = 180000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const res = await fetch(url, { method: "GET" });
      if (res.status < 500) return true;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  return false;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const env = { ...loadEnvFile(path.join(ROOT, ".env.local")), ...process.env };

  const key =
    args.provider === "groq" ? env.GROQ_API_KEY : env.GEMINI_API_KEY;
  if (!key) {
    console.error(
      `[baseline] Missing ${args.provider === "groq" ? "GROQ" : "GEMINI"}_API_KEY. Add it to .env.local.`,
    );
    process.exit(2);
  }

  const resumeText = readFileSync(
    path.join(ROOT, "scripts/fixtures/resume.txt"),
    "utf8",
  );
  const jdText = readFileSync(path.join(ROOT, "scripts/fixtures/jd.txt"), "utf8");

  const baseUrl = args.baseUrl || `http://localhost:${args.port}`;
  let child = null;

  if (!args.baseUrl) {
    console.log(`[baseline] starting dev server on port ${args.port}…`);
    child = spawn("npm", ["run", "dev", "--", "--port", String(args.port)], {
      cwd: ROOT,
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env },
    });
    child.stdout.on("data", () => {});
    child.stderr.on("data", (d) => process.stderr.write(`[dev] ${d}`));
  }

  const cleanup = () => {
    if (child && !args.keepServer) child.kill("SIGTERM");
  };
  process.on("exit", cleanup);
  process.on("SIGINT", () => {
    cleanup();
    process.exit(130);
  });

  const ready = await waitForServer(baseUrl);
  if (!ready) {
    console.error(`[baseline] server did not become ready at ${baseUrl}`);
    cleanup();
    process.exit(3);
  }

  const runs = [];
  for (let i = 1; i <= args.runs; i++) {
    if (args.gapMs && i > 1) {
      await new Promise((r) => setTimeout(r, args.gapMs));
    }
    clearCache({ keepExtraction: args.reuseExtraction });
    const startedAt = Date.now();
    const fd = new FormData();
    fd.set("jdText", jdText);
    fd.set("resumeText", resumeText);
    fd.set("provider", args.provider);
    fd.set(args.provider === "groq" ? "groqKey" : "geminiKey", key);
    if (args.model) {
      fd.set(args.provider === "groq" ? "groqModel" : "geminiModel", args.model);
    }
    fd.set("singlePage", "true");

    const res = await fetch(`${baseUrl}/api/analyze`, { method: "POST", body: fd });
    const text = await res.text();
    if (!res.ok) {
      console.error(`[baseline] run ${i} failed (${res.status}): ${text.slice(0, 300)}`);
      runs.push({ run: i, error: text.slice(0, 300) });
      continue;
    }
    let payload;
    try {
      payload = JSON.parse(text);
    } catch {
      runs.push({ run: i, error: "non-JSON response" });
      continue;
    }
    runs.push({
      run: i,
      ms: Date.now() - startedAt,
      scoreBefore: payload.atsScoreBefore ?? null,
      scoreAfter: payload.atsScoreAfter ?? null,
      matched: payload.matchedKeywords ?? [],
      missing: payload.missingKeywords ?? [],
      added: payload.addedKeywords ?? null,
      modelUsed: payload.modelUsed ?? null,
      fallbackUsed: payload.fallbackUsed ?? null,
      extractionModelUsed: payload.extractionModelUsed ?? payload.jdModelUsed ?? null,
      extractionFallback: payload.extractionFallback ?? null,
      educationRequirement: payload.educationRequirement ?? null,
      otherRequirements: payload.otherRequirements ?? [],
      notes: (payload.notes ?? []).length,
    });
    const r = runs[runs.length - 1];
    console.log(
      `[baseline] run ${i}/${args.runs}: ${r.scoreBefore}% -> ${r.scoreAfter}% | matched=${r.matched.length} missing=${r.missing.length} (extract=${r.extractionModelUsed}, fb=${r.extractionFallback}) (${r.ms}ms)`,
    );
  }

  cleanup();

  const ok = runs.filter((r) => !r.error);
  const scores = ok.map((r) => r.scoreAfter).filter((v) => typeof v === "number");
  const beforeScores = ok.map((r) => r.scoreBefore).filter((v) => typeof v === "number");
  const uniqueMatched = new Set(ok.map((r) => JSON.stringify([...r.matched].sort())));
  const uniqueMissing = new Set(ok.map((r) => JSON.stringify([...r.missing].sort())));

  function jaccard(a, b) {
    const sa = new Set(a);
    const sb = new Set(b);
    const union = new Set([...sa, ...sb]);
    if (union.size === 0) return 1;
    let inter = 0;
    for (const x of sa) if (sb.has(x)) inter++;
    return inter / union.size;
  }

  let jaccardPairs = [];
  if (ok.length >= 2) {
    for (let i = 0; i < ok.length; i++) {
      for (let j = i + 1; j < ok.length; j++) {
        const a = ok[i];
        const b = ok[j];
        jaccardPairs.push({
          pair: `${a.run}-${b.run}`,
          matched: jaccard(a.matched, b.matched),
          missing: jaccard(a.missing, b.missing),
        });
      }
    }
  }

  const summary = {
    label: args.label,
    provider: args.provider,
    model: args.model || "(app default)",
    runs: ok.length,
    failed: runs.length - ok.length,
    scoreBefore: range(beforeScores),
    scoreAfter: range(scores),
    matchedVariants: uniqueMatched.size,
    missingVariants: uniqueMissing.size,
    identical: uniqueMatched.size <= 1 && uniqueMissing.size <= 1,
    jaccardPairs,
    runsDetail: runs,
  };

  console.log("\n[baseline] summary");
  console.log(JSON.stringify({ ...summary, runsDetail: undefined }, null, 2));

  const outPath = path.join(ROOT, args.out);
  mkdirSync(path.dirname(outPath), { recursive: true });
  const section = renderSection(summary);
  if (!existsSync(outPath)) {
    writeFileSync(outPath, `# Baseline measurements\n\n${section}`);
  } else {
    appendFileSync(outPath, `\n${section}`);
  }
  console.log(`[baseline] wrote ${args.out}`);
}

function range(values) {
  if (!values.length) return { min: null, max: null, spread: null, values: [] };
  const min = Math.min(...values);
  const max = Math.max(...values);
  return { min, max, spread: max - min, values };
}

function renderSection(s) {
  const lines = [];
  lines.push(`## ${s.label} — provider: ${s.provider}, model: ${s.model}`);
  lines.push("");
  lines.push(`- Runs completed: ${s.runs}${s.failed ? ` (${s.failed} failed)` : ""}`);
  lines.push(
    `- Score before: ${fmtRange(s.scoreBefore)}`,
  );
  lines.push(`- Score after: ${fmtRange(s.scoreAfter)}`);
  lines.push(`- Distinct matched-keyword sets across runs: ${s.matchedVariants}`);
  lines.push(`- Distinct missing-keyword sets across runs: ${s.missingVariants}`);
  lines.push(`- Identical matched AND missing across all runs: ${s.identical ? "YES" : "NO"}`);
  const extractionModels = [...new Set(s.runsDetail.filter((r) => !r.error).map((r) => `${r.extractionModelUsed}${r.extractionFallback ? " (fallback)" : ""}`))];
  lines.push(`- Extraction model(s) used: ${extractionModels.join(", ") || "n/a"}`);
  if (s.runsDetail.some((r) => !r.error && r.otherRequirements?.length)) {
    const other = s.runsDetail.find((r) => !r.error && r.otherRequirements?.length);
    lines.push(`- Other requirements (run ${other.run}): ${JSON.stringify(other.otherRequirements)}`);
  }
  if (s.runsDetail.some((r) => !r.error && r.educationRequirement)) {
    lines.push(`- Education requirement: ${JSON.stringify(s.runsDetail.find((r) => !r.error && r.educationRequirement).educationRequirement)}`);
  }
  if (s.jaccardPairs?.length) {
    for (const p of s.jaccardPairs) {
      lines.push(`- Jaccard ${p.pair} matched/missing: ${p.matched.toFixed(4)}/${p.missing.toFixed(4)}`);
    }
  }
  lines.push("");
  lines.push("| Run | Score before | Score after | Matched | Missing | Added | Model | Fallback | Notes |");
  lines.push("| --- | --- | --- | --- | --- | --- | --- | --- | --- |");
  for (const r of s.runsDetail) {
    if (r.error) {
      lines.push(`| ${r.run} | error | error | — | — | — | — | — | — |`);
      continue;
    }
    lines.push(
      `| ${r.run} | ${r.scoreBefore ?? "—"} | ${r.scoreAfter ?? "—"} | ${r.matched.length} | ${r.missing.length} | ${
        r.added ? r.added.length : "—"
      } | ${r.modelUsed ?? "—"} | ${r.fallbackUsed ?? "—"} | ${r.notes} |`,
    );
  }
  lines.push("");
  for (const r of s.runsDetail) {
    if (r.error) continue;
    lines.push(`- Run ${r.run} matched: ${JSON.stringify(r.matched)}`);
    lines.push(`- Run ${r.run} missing: ${JSON.stringify(r.missing)}`);
  }
  lines.push("");
  return lines.join("\n");
}

function fmtRange(r) {
  if (r.min === null) return "n/a";
  return `${r.min}–${r.max} (spread ${r.spread})`;
}

main().catch((err) => {
  console.error("[baseline] failed:", err);
  process.exit(1);
});
