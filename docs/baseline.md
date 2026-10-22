# Baseline measurements

How stable the app's output is for the same resume + job description, before
and after the Phase 0.9 deterministic core.

- Date of the runs below: 2026-10-22.
- Fixtures: `scripts/fixtures/resume.txt` and `scripts/fixtures/jd.txt` (same
  pair for every run, every provider).
- Provider keys come from `.env.local` and are never printed. No resume text
  or prompt is logged.
- Scoring is computed in code (`src/lib/score.ts`): 70% required, 30%
  preferred, word-boundary matching, sorted output.

## Method

| Harness | What it does |
| --- | --- |
| `npm run baseline -- --runs=5 --provider=gemini --model=…` | Full pipeline through `/api/analyze`. Clears `.cache/llm` before every run. |
| `npm run baseline -- … --reuse-extraction` | Same, but keeps the cached extraction result and drops only the cached tailoring result, so the keyword set is held fixed and only the tailoring varies. |
| `npm run baseline:extract -- --runs=5` | Extraction only (`src/lib/extractJD.ts`), per provider, cache cleared before every run. |
| `npm run baseline:warm` | Writes one extraction result into the cache, so a following full-pipeline run can be measured against a fixed keyword set. |

Cache: `.cache/llm` (gitignored), one file per LLM result, keyed by
`hashKey(purpose, prompt version, model, input)`. The model id is part of the
key, so switching models never reuses another model's extraction.

## Live model inventory (fetched 2026-10-22)

`GET https://generativelanguage.googleapis.com/v1beta/models` → 200, 50 ids.
`GET https://api.groq.com/openai/v1/models` → 200, 11 ids.

### Gemini

| Kept | Role |
| --- | --- |
| `gemini-3.8-flash` | Default Gemini tailoring model |
| `gemini-3.6-flash` | Pinned extraction model (`EXTRACTION_MODEL`) |
| `gemini-3.5-flash-lite` | Lightest Gemini option; on 2026-10-22 it was the only Gemini model with free-tier quota left, so it carried the Gemini half of the full-pipeline measurement |

| Dropped | Why |
| --- | --- |
| `gemini-flash-latest`, `gemini-flash-lite-latest`, `gemini-pro-latest` | Moving aliases, not pinned ids |
| `gemini-3-flash-preview`, `gemini-3.1-*-preview`, `gemini-3.1-pro-preview` | Preview ids, subject to removal |
| `gemini-4-argon` | Listed by the API but returned no free-tier quota in probing |
| `gemini-2.5-flash`, `gemini-2.5-flash-lite`, `gemini-2.5-pro` | Probe failed with "Thinking level is not supported for this model"; 2.5 family also had no quota |
| `gemini-3.1-flash-lite` | Probe timed out at 20s |
| `gemma-4-26b-a4b-it`, `gemma-4-31b-it` | Instruction-tuned Gemma, no structured-output guarantee |
| `*-image*`, `nano-banana*`, `lyria-*`, `*-tts-*`, `gemini-3.5-transcribe`, `gemini-omni*`, `gemini-robotics-*`, `deep-research-*`, `gemini-embedding-*`, `aqa` | Wrong modality for resume text |
| `antigravity-preview-*` | Agent preview ids, not chat models |

### Groq

| Kept | Role |
| --- | --- |
| `openai/gpt-oss-120b` | Default Groq tailoring model |
| `openai/gpt-oss-20b` | Fast Groq option and cross-provider extraction fallback (`EXTRACTION_FALLBACK_MODEL`) |
| `qwen/qwen3.8-27b` | Multilingual option, 131072 context |

| Dropped | Why |
| --- | --- |
| `openai/gpt-oss-safeguard-20b` | Safeguard model, not a generator |
| `meta-llama/llama-prompt-guard-2-22m`, `meta-llama/llama-prompt-guard-2-86m` | Guard models, 512 context |
| `whisper-large-v3`, `whisper-large-v3-turbo` | Audio transcription |
| `canopylabs/orpheus-arabic-saudi`, `canopylabs/orpheus-v1-english` | TTS/music, 4000 context |
| `allam-2-7b` | Arabic-only, 4096 context |
| `llama-3.3-70b-versatile`, `llama-3.1-8b-instant` | No longer listed by the API |

## Phase 0.9 — extraction only (cache cleared before every run)

Extraction prompt version `2026.10.22.3`. Keywords are canonicalized in code
before they are scored.

| Provider / model | Runs | Within-provider Jaccard | Keyword set |
| --- | --- | --- | --- |
| `gemini-3.6-flash` (pinned) | 3 of 5 — 2 runs failed with a daily-quota 429 | 1.0000 over the 3 successful runs | 24 keywords, complete |
| `gemini-3.5-flash-lite` | 5 of 5 | 1.0000 | 20 keywords — drops `rest` and the three testing skills |
| `openai/gpt-oss-20b` | 5 of 5 | 1.0000 (one earlier batch had 0.9833 when a run omitted `playwright`) | 24 keywords, complete |

Complete 24-keyword set (identical for `gemini-3.6-flash` and
`openai/gpt-oss-20b`):

- Required: `aws`, `ci/cd`, `docker`, `express`, `git`, `github`,
  `javascript`, `jest`, `mongodb`, `next.js`, `node.js`, `playwright`,
  `postgresql`, `react`, `rest`, `typescript`
- Preferred: `end-to-end testing`, `graphql`, `integration testing`,
  `kubernetes`, `prisma`, `redis`, `terraform`, `unit testing`
- Other requirements: `Contributions to open source`, `Mentor junior engineers`
- Education requirement: "Bachelor's degree in Computer Science, Information
  Technology or a related field"

Across providers (union of all runs):

| Pair | Jaccard |
| --- | --- |
| `gemini-3.6-flash` vs `openai/gpt-oss-20b` | 1.0000 |
| `gemini-3.5-flash-lite` vs `openai/gpt-oss-20b` | 0.8333 |

What the earlier prompt produced, for contrast: `unit, integration and
end-to-end testing`, `Git/GitHub workflows`, `CI/CD pipelines` and
`testing practices including unit, integration and end-to-end testing` were
emitted as single entries, and `gemini-3.6-flash` also dropped `Jest` and
`Playwright` entirely. Rule 4 of the prompt now names those splits and the
example job description shows the expected output.

## Phase 0.9 — full pipeline (extraction frozen)

`npm run baseline -- --runs=5 … --reuse-extraction` against the 24-keyword
extraction above. Same resume, same job description, extraction held fixed.

| Tailoring provider / model | Runs | Score before → after | Matched | Missing | Identical across runs |
| --- | --- | --- | --- | --- | --- |
| `gemini-3.5-flash-lite` | 5 of 5 | 74 → 74 | 17 | 7 | YES |
| `openai/gpt-oss-120b` | 5 of 5 | 74 → 74 | 17 | 7 | YES |

- Matched: `aws`, `ci/cd`, `docker`, `express`, `git`, `github`, `javascript`,
  `jest`, `mongodb`, `next.js`, `node.js`, `playwright`, `postgresql`,
  `prisma`, `react`, `rest`, `typescript`
- Missing: `end-to-end testing`, `graphql`, `integration testing`,
  `kubernetes`, `redis`, `terraform`, `unit testing` — the job skills the
  resume cannot support, so they stay gaps by design.
- Pairwise Jaccard on matched and missing was 1.0000 for every pair inside a
  provider and across the two providers.
- Score before and after are equal in all ten runs: the tailored resume keeps
  every keyword the original resume already had, and adds none that the
  resume cannot support.

## Before Phase 0 (historical, kept for comparison)

Before the deterministic core, the same fixture pair gave different answers
per provider and per run:

| Provider | Score before → after | Matched | Missing |
| --- | --- | --- | --- |
| Gemini (default model) | 76 → 94, 74 → 94, 78 → 96 | 17, 20, 20 — different sets, including `Express.js` vs `Express`, `React.js` vs `React` | `Kubernetes`, `Terraform`, `GraphQL`, `Redis` |
| Groq (default model) | 68 → 92 | 23 — included `Core Web Vitals`, `Responsive`, `Accessible`, `Performance Optimization`, `Secure` | also `Infrastructure as code`, `Observable`, `Open source contributions`, `Mentor junior engineers` |

The keyword sets were not atomic, so the same requirement was counted
differently depending on how the model phrased it: `CI/CD pipelines`,
`Git/GitHub workflows`, `unit, integration and end-to-end testing`,
`caching layers such as Redis`, `Prisma or other modern data access layers`,
and a degree listed as a keyword (`Bachelor's degree in Computer Science…`).
The mid-Phase-0 runs (cache cleared) still produced `CI/CD pipelines`,
`Git/GitHub workflows` and `unit, integration and end-to-end testing` as
missing keywords.

## Findings

1. **Extraction is now the deterministic input.** One pinned model, one
   canonicalizer in code, one cache entry per job description. Repeated
   extractions of the same JD produced the same keyword set every time
   (Jaccard 1.0000 within each provider).
2. **Cross-provider agreement needs the same extraction.** Gemini and Groq
   agree exactly (Jaccard 1.0000) once both run the same extraction prompt
   and the same canonicalizer. `gemini-3.5-flash-lite` is the weaker
   extractor of the three (0.8333 against Groq) — it drops `rest` and the
   three testing skills — which is why it is not the pinned model.
3. **Scoring is deterministic.** With the keyword set fixed, score, matched
   and missing are byte-identical across runs and identical across tailoring
   providers (74 → 74, 17 matched, 7 missing in all ten runs).
4. **Free-tier quota is the practical constraint.** `gemini-3.6-flash` and
   `gemini-3.8-flash` both hit their daily quota during this measurement
   (`429 You exceeded your current quota`). The app's cross-provider fallback
   absorbed it: every affected run extracted through
   `openai/gpt-oss-20b` and reported `extractionFallback: true`. The pin is
   now overridable with `EXTRACTION_MODEL` / `EXTRACTION_FALLBACK_MODEL`
   (server-side, part of the cache key) so a deployment can move the pin
   without a code change.
5. **Tailoring text is still the only remaining source of variance.** A
   keyword only counts as matched if it appears in the tailored resume, so a
   tailoring model that omits a supported keyword lowers the score. With the
   extraction frozen this was stable across all ten runs, but it is still an
   LLM output. Next lever if it shows up: cache tailoring results by
   (provider, model, resume, JD), or require the tailoring step to include
   every supported keyword and drop unsupported ones.
