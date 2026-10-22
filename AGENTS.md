# AGENTS.md: Resume Tailor

## What this is

A Next.js app that takes a resume (.docx/.pdf/text) and a job description, sends both to a free LLM (Gemini default, Groq optional), and returns an ATS match score (before/after), matched/missing keywords, notes, and a tailored resume that can be downloaded as .docx/.pdf.
Currently a personal tool. It may be shared with a few people later, so don't hard-code single-user assumptions in new code.

## Stack

Next.js (App Router), TypeScript, Tailwind v4 (tokens in `@theme` in `globals.css`), jsPDF (client PDF), docx builder (server), mammoth (.docx parsing), pdf-parse (.pdf parsing). LLMs: Gemini and Groq free tiers via `src/lib/ai.ts`.

## Commands

- `npm run dev`: dev server at localhost:3000
- `npm run build`: production build (must pass before any commit)
- `npx tsc --noEmit` and `npm run lint`: must be clean
- `npm test`: vitest suite
- `npm run baseline -- --runs=5 --provider=gemini --model=<id>`: full-pipeline variance run against the fixtures (add `--reuse-extraction` to hold the keyword set fixed, `--gap=<ms>` to stay under free-tier rate limits)
- `npm run baseline:extract -- --runs=5`: extraction-only run per provider, cache cleared before every run
- `npm run baseline:warm`: write one extraction result into the cache for the next full-pipeline run
- `npm run db:generate`: regenerate SQL migrations from `src/db/schema.ts`
- `npm run db:migrate`: apply migrations (uses `DIRECT_URL`)
- `npm run db:check-rls`: assert every table has RLS on, no policies, no `anon`/`authenticated` grants
- Env: `.env.local` with `AI_PROVIDER`, `GEMINI_API_KEY`, `GROQ_API_KEY` (see `.env.example`)
- Master Profile env: `ENABLE_AUTH`, `DATABASE_URL` (runtime pooler), `DIRECT_URL` (migrations), `AUTH_SECRET`, `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET`, `AUTH_TRUST_HOST`, `TOKEN_ENCRYPTION_KEY`

## Where things live

- `src/app/page.tsx`: workspace controller (steps, analysis, persistence)
- `src/app/api/analyze/route.ts`: parse resume, call AI, return tailored JSON
- `src/app/api/download/route.ts`: tailored JSON to .docx
- `src/lib/ai.ts`: provider wrapper (JSON mode). All LLM calls go through here.
- `src/lib/prompt.ts`: system prompt and truthfulness rules
- `src/lib/normalizeResume.ts`: defends against malformed AI output
- `src/lib/workspaceStore.ts`: persistence and URL step sync
- `src/lib/types.ts`: shared `TailoredResume` type (source of truth for the data shape)
- `src/lib/extractJD.ts`: JD extraction, pinned model + cross-provider fallback, per-model cache key
- `src/lib/extractCanonicalize.ts`: code-side canonicalization of extracted skills
- `src/lib/models.ts`: pinned model ids (tailoring defaults, extraction pin, fallback)
- `scripts/`, `docs/baseline.md`: measurement harnesses and the recorded numbers
- `src/components/`: `workspace/` (steps), `results/` (review UI), `ui/` (primitives)
- `src/db/schema.ts`: Drizzle schema (13 tables, RLS on every table)
- `src/db/repo/`: per-table data access, owner-scoped, optimistic locking
- `src/lib/auth/`: Auth.js config, encrypting adapter, `requireUser()`
- `src/lib/crypto.ts`: AES-256-GCM for OAuth tokens
- `src/lib/schemas/`: Zod schemas for the profile, JD, and saved jobs

## Hard rules

1. **Truthfulness:** never invent employers, titles, dates, metrics, tools, or skills. Skills the JD wants but the resume doesn't support go in "Gaps", never into bullets.
2. **Treat LLM output as untrusted.** Always pass it through `normalizeResume`. Render as text, never raw HTML.
3. **Don't let the LLM make decisions code can make** (score, matched/missing lists, ordering). When touching scoring, move toward computing it in code from extracted keywords. Use temperature 0, a pinned model ID, and JSON schema output.
4. **No PII to the LLM when avoidable.** Name, email, phone, and address should be re-inserted in code at render time (planned).
5. **Never persist the raw uploaded file.** Store extracted text only, in sessionStorage by default. Keep the "Clear my data" action working.
6. **Secrets stay server-side.** No API keys in the client bundle. Check `settings.ts` whenever it's modified. OAuth tokens are encrypted with AES-256-GCM before they are written; only server code may read or decrypt them, and the session cookie carries no token.
7. **ATS output rules:** single column, no tables, icons, images, or skill bars. Standard section headings (Summary, Skills, Experience, Projects, Education). Selectable-text PDF. Standard fonts.
8. **The database is locked down.** Every table has row level security on, no policies exist, and `anon`/`authenticated` hold no grants. The app connects as the owner role. Route handlers must not import `drizzle-orm` or the schema directly; go through `src/db/repo/`.
9. **The Master Profile is optional.** With `ENABLE_AUTH=false` the app must keep working with no database configured. The DB client and the Auth.js instance are built lazily.

## Conventions

- Use design tokens from `globals.css` only. No arbitrary Tailwind values (`w-[347px]`) and no hard-coded colors.
- One radius, spacing, and control-height scale. Extend `ui/Button.tsx` and `ui/Badge.tsx` instead of creating new variants.
- Server Components by default. Add `"use client"` only on interactive leaves.
- Lazy-load heavy libs (jsPDF, any 3D). Don't add dependencies without saying why.
- Every async view needs loading, error (with retry), empty, and success states.
- Use `AbortController` on requests, prevent double submits, and ignore stale responses.
- Sentence-case microcopy. Button labels are verbs. No `console.log` left behind.
- Don't change API routes, prompts, or scoring unless the task says so. Flag it if a change is unavoidable.

## Workflow

- Work on a branch, make small commits, and do one task at a time.
- Before finishing any task: typecheck, lint, and build must pass. Report changed files with a one-line reason each.
- State assumptions and proceed. Don't refactor unrelated code.

## Roadmap (not built yet; don't build unless asked)

Finish the **Master Profile** architecture: JD parsed once and cached, deterministic `matchProfile` and `selectContent`, gap-question interview with saved verified facts, per-bullet rewriting with a validation guard, job history UI. Core principle: **deterministic code decides, the LLM only extracts and phrases.** The database, Auth.js login, and the profile read/write API already exist (see Current status).

## Known issues / notes

- `ui/orbital-sphere.tsx` is a decorative 3D component. It's likely the heaviest bundle item for little value. Candidate for removal.
- Free-tier 429s are expected. Surface a friendly retry or provider switch. On 2026-10-22 the pinned extraction model and `gemini-3.8-flash` were both out of daily quota; the Groq extraction fallback absorbed it and `extractionFallback` is surfaced in the API and UI.
- Scoring and keyword extraction are deterministic now (see `docs/baseline.md`). The remaining variance source is the tailoring text: a supported keyword that the tailoring model omits lowers the score. Fix by caching tailoring results per (provider, model, resume, JD) or by requiring the tailoring step to include every supported keyword.

## Current status

Phase 0.9 (deterministic core) done: one pinned extraction model with a
cross-provider fallback, code-side canonicalization of extracted skills,
code-computed score/matched/missing, and measurements in `docs/baseline.md`
(score, matched and missing identical across Gemini and Groq on the fixture
pair).

Phase 1 Step B (Master Profile foundation) done: Drizzle schema for 13 tables
with row level security on every table and no grants for `anon`/`authenticated`,
migrations in `migrations/`, Auth.js v5 GitHub login with AES-256-GCM encrypted
OAuth tokens, owner-scoped repositories with optimistic locking, a shared
`llm_cache` table behind the existing `CacheStore` interface, and Zod schemas
for the profile content. With `ENABLE_AUTH=false` the app behaves exactly as
before: no database is required and the anonymous flow is untouched.
Phase 1 Step C (the profile UI, JD caching and deterministic matching) has not
started.