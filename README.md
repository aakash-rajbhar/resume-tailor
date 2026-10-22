# Resume Tailor

Upload a resume (.docx / .pdf / pasted text) and a job description. The app:

1. Extracts the resume text (mammoth for .docx, pdf-parse for .pdf).
2. Sends the resume + job description to a free AI model (Google Gemini by default).
3. Gets back an honest ATS match score (before/after), a matched/missing keyword
   report, actionable notes, and a rewritten, single-page-sized resume — the model
   is instructed to never invent employers, titles, dates, or skills that aren't
   already backed by the original resume.
4. Lets you download the tailored resume as a formatted `.docx`.

## 1. Install dependencies

```bash
npm install
```

## 2. Get a free Gemini API key

1. Go to https://aistudio.google.com/apikey
2. Sign in and click "Create API key" (no credit card required for the free tier).
3. Copy the key.

## 3. Configure your environment

```bash
cp .env.example .env.local
```

Open `.env.local` and paste your key:

```
AI_PROVIDER=gemini
GEMINI_API_KEY=your-key-here
```

(If you'd rather use Groq instead, get a free key at https://console.groq.com/keys,
set `AI_PROVIDER=groq` and `GROQ_API_KEY=...` — the app supports both, see `src/lib/ai.ts`.)

Optional server-side settings:

| Variable | Default | Why you would change it |
| --- | --- | --- |
| `EXTRACTION_MODEL` | `gemini-3.6-flash` | The job description is extracted once with this model, so the keyword set does not depend on the model chosen for tailoring. Change it when the free tier of the pinned model is exhausted. |
| `EXTRACTION_FALLBACK_MODEL` | `openai/gpt-oss-20b` | Used automatically when the pinned extraction model errors out (for example a quota 429). |

The model id is part of the cache key, so switching models re-extracts the job
description instead of reusing another model's keywords.

## 4. Run it

```bash
npm run dev
```

Open http://localhost:3000, upload your resume, paste a job description, and click
"Run match & tailor resume."

## Project structure

```
src/
  app/
    page.tsx                 Workspace controller — steps, analysis, persistence
    layout.tsx               Fonts, theme bootstrap, metadata
    error.tsx / global-error.tsx / not-found.tsx / loading.tsx
    globals.css              Design tokens (Tailwind v4 @theme), utilities
    api/analyze/route.ts     Parses resume, calls the AI, returns tailored JSON
    api/download/route.ts    Turns tailored JSON into a downloadable .docx
    api/test-ai/route.ts     Validates a provider API key
    api/groq-models/route.ts Lists available Groq models
  components/
    HeaderBar.tsx, ProviderChip.tsx, ThemeToggle.tsx, SettingsPanel.tsx
    ErrorBoundary.tsx
    landing/LandingHero.tsx
    workspace/Step1Resume.tsx, Step2Job.tsx, Step3Loading.tsx
    results/ResultsWorkspaceNew.tsx, GapAnalysisPanel.tsx, DocumentCanvas.tsx
    ui/Button.tsx, Badge.tsx, Stepper.tsx, orbital-sphere.tsx
  lib/
    parseFile.ts              .docx/.pdf/.txt -> plain text
    ai.ts                     Gemini/Groq API wrapper (JSON-mode)
    prompt.ts                 The system prompt with the truthfulness rules
    docxBuilder.ts            Builds the downloadable .docx from the tailored JSON
    pdfBuilder.ts             Builds the client-side PDF export (jsPDF)
    settings.ts               Provider/API-key/theme persistence
    workspaceStore.ts         Resume/JD/result persistence + URL step sync
    normalizeResume.ts        Defends against malformed AI output
    cn.ts                     Dependency-free class-name merger
    types.ts                  Shared TailoredResume type
```

## Notes

- Your resume + JD are sent only to whichever AI provider you configure (Google or
  Groq) - there's no other third-party server in the middle.
- Free-tier rate limits apply on both Gemini and Groq; if you hit a `429` error,
  wait a minute and try again, or switch providers.
- The AI is explicitly instructed not to fabricate experience - skills the JD wants
  but your resume doesn't support show up in "Gaps," not woven into a bullet point.
