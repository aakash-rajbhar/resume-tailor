# Baseline measurements

## Before Phase 0 (current implementation) — provider: gemini, model: (app default)

- Runs completed: 3 (2 failed)
- Score before: 74–78 (spread 4)
- Score after: 94–96 (spread 2)
- Distinct matched-keyword sets across runs: 3
- Distinct missing-keyword sets across runs: 1
- Identical matched AND missing across all runs: NO

| Run | Score before | Score after | Matched | Missing | Added | Model | Fallback | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | error | error | — | — | — | — | — | — |
| 2 | 76 | 94 | 17 | 4 | — | — | — | 3 |
| 3 | 74 | 94 | 20 | 4 | — | — | — | 3 |
| 4 | error | error | — | — | — | — | — | — |
| 5 | 78 | 96 | 20 | 4 | — | — | — | 4 |

- Run 2 matched: ["JavaScript","TypeScript","React","Next.js","Node.js","Express","REST APIs","PostgreSQL","MongoDB","AWS","CI/CD","Docker","Git/GitHub","Jest","Playwright","Core Web Vitals","Prisma"]
- Run 2 missing: ["Kubernetes","Terraform","GraphQL","Redis"]
- Run 3 matched: ["JavaScript","TypeScript","React","Next.js","Node.js","Express.js","REST APIs","PostgreSQL","MongoDB","AWS","CI/CD","Docker","Git/GitHub","Jest","Playwright","Prisma","Core Web Vitals","Responsive Design","Unit Testing","End-to-End Testing"]
- Run 3 missing: ["Kubernetes","Terraform","GraphQL","Redis"]
- Run 5 matched: ["Full Stack Engineer","React.js","Next.js","Node.js","Express.js","TypeScript","JavaScript","PostgreSQL","MongoDB","REST APIs","AWS (EC2, RDS, S3, Amplify)","CI/CD","Docker","Jest","Playwright","Git/GitHub","Core Web Vitals","Prisma","SSR/SSG/ISR","Responsive Design"]
- Run 5 missing: ["Kubernetes","Terraform","GraphQL","Redis"]

## Before Phase 0 (current implementation, Groq) — provider: groq, model: (app default)

- Runs completed: 1 (4 failed)
- Score before: 68–68 (spread 0)
- Score after: 92–92 (spread 0)
- Distinct matched-keyword sets across runs: 1
- Distinct missing-keyword sets across runs: 1
- Identical matched AND missing across all runs: YES

| Run | Score before | Score after | Matched | Missing | Added | Model | Fallback | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 68 | 92 | 23 | 9 | — | — | — | 4 |
| 2 | error | error | — | — | — | — | — | — |
| 3 | error | error | — | — | — | — | — | — |
| 4 | error | error | — | — | — | — | — | — |
| 5 | error | error | — | — | — | — | — | — |

- Run 1 matched: ["Full Stack Engineer","JavaScript","TypeScript","React","Next.js","Node.js","Express","REST APIs","PostgreSQL","MongoDB","AWS","CI/CD","Docker","Git","GitHub","Jest","Playwright","Core Web Vitals","Responsive","Accessible","Performance Optimization","Secure","Prisma"]
- Run 1 missing: ["Infrastructure as code","Observable","Kubernetes","Terraform","GraphQL","Redis","Open source contributions","Mentor junior engineers","Raise quality bar"]
