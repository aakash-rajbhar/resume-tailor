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
    page.tsx                 UI — upload/paste form + results panel
    api/analyze/route.ts     Parses resume, calls the AI, returns tailored JSON
    api/download/route.ts    Turns tailored JSON into a downloadable .docx
  components/
    ScoreGauge.tsx            ATS score dial (before -> after)
  lib/
    parseFile.ts              .docx/.pdf/.txt -> plain text
    ai.ts                     Gemini/Groq API wrapper (JSON-mode)
    prompt.ts                 The system prompt with the truthfulness rules
    docxBuilder.ts             Builds the downloadable .docx from the tailored JSON
    types.ts                  Shared TailoredResume type
```

## Notes

- Your resume + JD are sent only to whichever AI provider you configure (Google or
  Groq) - there's no other third-party server in the middle.
- Free-tier rate limits apply on both Gemini and Groq; if you hit a `429` error,
  wait a minute and try again, or switch providers.
- The AI is explicitly instructed not to fabricate experience - skills the JD wants
  but your resume doesn't support show up in "Gaps," not woven into a bullet point.
