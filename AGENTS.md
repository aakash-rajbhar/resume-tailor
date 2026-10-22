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
- Env: `.env.local` with `AI_PROVIDER`, `GEMINI_API_KEY`, `GROQ_API_KEY` (see `.env.example`)

## Where things live

- `src/app/page.tsx`: workspace controller (steps, analysis, persistence)
- `src/app/api/analyze/route.ts`: parse resume, call AI, return tailored JSON
- `src/app/api/download/route.ts`: tailored JSON to .docx
- `src/lib/ai.ts`: provider wrapper (JSON mode). All LLM calls go through here.
- `src/lib/prompt.ts`: system prompt and truthfulness rules
- `src/lib/normalizeResume.ts`: defends against malformed AI output
- `src/lib/workspaceStore.ts`: persistence and URL step sync
- `src/lib/types.ts`: shared `TailoredResume` type (source of truth for the data shape)
- `src/components/`: `workspace/` (steps), `results/` (review UI), `ui/` (primitives)

## Hard rules

1. **Truthfulness:** never invent employers, titles, dates, metrics, tools, or skills. Skills the JD wants but the resume doesn't support go in "Gaps", never into bullets.
2. **Treat LLM output as untrusted.** Always pass it through `normalizeResume`. Render as text, never raw HTML.
3. **Don't let the LLM make decisions code can make** (score, matched/missing lists, ordering). When touching scoring, move toward computing it in code from extracted keywords. Use temperature 0, a pinned model ID, and JSON schema output.
4. **No PII to the LLM when avoidable.** Name, email, phone, and address should be re-inserted in code at render time (planned).
5. **Never persist the raw uploaded file.** Store extracted text only, in sessionStorage by default. Keep the "Clear my data" action working.
6. **Secrets stay server-side.** No API keys in the client bundle. Check `settings.ts` whenever it's modified.
7. **ATS output rules:** single column, no tables, icons, images, or skill bars. Standard section headings (Summary, Skills, Experience, Projects, Education). Selectable-text PDF. Standard fonts.

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

Move to a **Master Profile** architecture: GitHub login (Auth.js), structured profile in Postgres, JD parsed once and cached, deterministic `matchProfile` and `selectContent`, gap-question interview with saved verified facts, per-bullet rewriting with a validation guard, job history. Core principle: **deterministic code decides, the LLM only extracts and phrases.**

## Known issues / notes

- `ui/orbital-sphere.tsx` is a decorative 3D component. It's likely the heaviest bundle item for little value. Candidate for removal.
- Same inputs give slightly different scores and gaps between runs (LLM variance). Fix: cache by input hash, temperature 0, and code-computed scoring.
- Free-tier 429s are expected. Surface a friendly retry or provider switch.

## Current status

<!-- Update this as you go, e.g. "Production-readiness pass: Batch 3 of 7 done" -->
