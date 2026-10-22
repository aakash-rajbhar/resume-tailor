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

## Phase0 Gemini cleared — provider: gemini, model: (app default)

- Runs completed: 5
- Score before: 55–55 (spread 0)
- Score after: 60–60 (spread 0)
- Distinct matched-keyword sets across runs: 1
- Distinct missing-keyword sets across runs: 1
- Identical matched AND missing across all runs: YES

| Run | Score before | Score after | Matched | Missing | Added | Model | Fallback | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 55 | 60 | 12 | 9 | 1 | gemini-3.8-flash | false | 3 |
| 2 | 55 | 60 | 12 | 9 | 1 | gemini-3.8-flash | false | 3 |
| 3 | 55 | 60 | 12 | 9 | 1 | gemini-3.8-flash | false | 3 |
| 4 | 55 | 60 | 12 | 9 | 1 | gemini-3.8-flash | false | 3 |
| 5 | 55 | 60 | 12 | 9 | 1 | gemini-3.8-flash | false | 3 |

- Run 1 matched: ["AWS","CI/CD pipelines","Docker","Express","JavaScript","MongoDB","Next.js","Node.js","PostgreSQL","React","REST APIs","TypeScript"]
- Run 1 missing: ["Bachelor's degree in Computer Science, Information Technology or a related field","caching layers such as Redis","Contributions to open source","Git/GitHub workflows","GraphQL","Kubernetes","Prisma or other modern data access layers","Terraform","testing practices including unit, integration and end-to-end testing"]
- Run 2 matched: ["AWS","CI/CD pipelines","Docker","Express","JavaScript","MongoDB","Next.js","Node.js","PostgreSQL","React","REST APIs","TypeScript"]
- Run 2 missing: ["Bachelor's degree in Computer Science, Information Technology or a related field","caching layers such as Redis","Contributions to open source","Git/GitHub workflows","GraphQL","Kubernetes","Prisma or other modern data access layers","Terraform","testing practices including unit, integration and end-to-end testing"]
- Run 3 matched: ["AWS","CI/CD pipelines","Docker","Express","JavaScript","MongoDB","Next.js","Node.js","PostgreSQL","React","REST APIs","TypeScript"]
- Run 3 missing: ["Bachelor's degree in Computer Science, Information Technology or a related field","caching layers such as Redis","Contributions to open source","Git/GitHub workflows","GraphQL","Kubernetes","Prisma or other modern data access layers","Terraform","testing practices including unit, integration and end-to-end testing"]
- Run 4 matched: ["AWS","CI/CD pipelines","Docker","Express","JavaScript","MongoDB","Next.js","Node.js","PostgreSQL","React","REST APIs","TypeScript"]
- Run 4 missing: ["Bachelor's degree in Computer Science, Information Technology or a related field","caching layers such as Redis","Contributions to open source","Git/GitHub workflows","GraphQL","Kubernetes","Prisma or other modern data access layers","Terraform","testing practices including unit, integration and end-to-end testing"]
- Run 5 matched: ["AWS","CI/CD pipelines","Docker","Express","JavaScript","MongoDB","Next.js","Node.js","PostgreSQL","React","REST APIs","TypeScript"]
- Run 5 missing: ["Bachelor's degree in Computer Science, Information Technology or a related field","caching layers such as Redis","Contributions to open source","Git/GitHub workflows","GraphQL","Kubernetes","Prisma or other modern data access layers","Terraform","testing practices including unit, integration and end-to-end testing"]

## Phase0 Groq cleared — provider: groq, model: (app default)

- Runs completed: 5
- Score before: 64–64 (spread 0)
- Score after: 64–64 (spread 0)
- Distinct matched-keyword sets across runs: 1
- Distinct missing-keyword sets across runs: 1
- Identical matched AND missing across all runs: YES

| Run | Score before | Score after | Matched | Missing | Added | Model | Fallback | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 64 | 64 | 12 | 8 | 0 | openai/gpt-oss-120b | false | 2 |
| 2 | 64 | 64 | 12 | 8 | 0 | openai/gpt-oss-120b | false | 2 |
| 3 | 64 | 64 | 12 | 8 | 0 | openai/gpt-oss-120b | false | 2 |
| 4 | 64 | 64 | 12 | 8 | 0 | openai/gpt-oss-120b | false | 2 |
| 5 | 64 | 64 | 12 | 8 | 0 | openai/gpt-oss-120b | false | 2 |

- Run 1 matched: ["AWS","Docker","Express","JavaScript","MongoDB","Next.js","Node.js","PostgreSQL","Prisma","React","REST APIs","TypeScript"]
- Run 1 missing: ["CI/CD pipelines","Git/GitHub workflows","GraphQL","Kubernetes","open source","Redis","Terraform","unit, integration and end-to-end testing"]
- Run 2 matched: ["AWS","Docker","Express","JavaScript","MongoDB","Next.js","Node.js","PostgreSQL","Prisma","React","REST APIs","TypeScript"]
- Run 2 missing: ["CI/CD pipelines","Git/GitHub workflows","GraphQL","Kubernetes","open source","Redis","Terraform","unit, integration and end-to-end testing"]
- Run 3 matched: ["AWS","Docker","Express","JavaScript","MongoDB","Next.js","Node.js","PostgreSQL","Prisma","React","REST APIs","TypeScript"]
- Run 3 missing: ["CI/CD pipelines","Git/GitHub workflows","GraphQL","Kubernetes","open source","Redis","Terraform","unit, integration and end-to-end testing"]
- Run 4 matched: ["AWS","Docker","Express","JavaScript","MongoDB","Next.js","Node.js","PostgreSQL","Prisma","React","REST APIs","TypeScript"]
- Run 4 missing: ["CI/CD pipelines","Git/GitHub workflows","GraphQL","Kubernetes","open source","Redis","Terraform","unit, integration and end-to-end testing"]
- Run 5 matched: ["AWS","Docker","Express","JavaScript","MongoDB","Next.js","Node.js","PostgreSQL","Prisma","React","REST APIs","TypeScript"]
- Run 5 missing: ["CI/CD pipelines","Git/GitHub workflows","GraphQL","Kubernetes","open source","Redis","Terraform","unit, integration and end-to-end testing"]

## Phase0 Gemini cached — provider: gemini, model: (app default)

- Runs completed: 5
- Score before: 64–64 (spread 0)
- Score after: 74–74 (spread 0)
- Distinct matched-keyword sets across runs: 1
- Distinct missing-keyword sets across runs: 1
- Identical matched AND missing across all runs: YES

| Run | Score before | Score after | Matched | Missing | Added | Model | Fallback | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 64 | 74 | 14 | 6 | 2 | gemini-3.8-flash | false | 3 |
| 2 | 64 | 74 | 14 | 6 | 2 | gemini-3.8-flash | false | 3 |
| 3 | 64 | 74 | 14 | 6 | 2 | gemini-3.8-flash | false | 3 |
| 4 | 64 | 74 | 14 | 6 | 2 | gemini-3.8-flash | false | 3 |
| 5 | 64 | 74 | 14 | 6 | 2 | gemini-3.8-flash | false | 3 |

- Run 1 matched: ["AWS","CI/CD pipelines","Docker","Express","Git/GitHub workflows","JavaScript","MongoDB","Next.js","Node.js","PostgreSQL","Prisma","React","REST APIs","TypeScript"]
- Run 1 missing: ["GraphQL","Kubernetes","open source","Redis","Terraform","unit, integration and end-to-end testing"]
- Run 2 matched: ["AWS","CI/CD pipelines","Docker","Express","Git/GitHub workflows","JavaScript","MongoDB","Next.js","Node.js","PostgreSQL","Prisma","React","REST APIs","TypeScript"]
- Run 2 missing: ["GraphQL","Kubernetes","open source","Redis","Terraform","unit, integration and end-to-end testing"]
- Run 3 matched: ["AWS","CI/CD pipelines","Docker","Express","Git/GitHub workflows","JavaScript","MongoDB","Next.js","Node.js","PostgreSQL","Prisma","React","REST APIs","TypeScript"]
- Run 3 missing: ["GraphQL","Kubernetes","open source","Redis","Terraform","unit, integration and end-to-end testing"]
- Run 4 matched: ["AWS","CI/CD pipelines","Docker","Express","Git/GitHub workflows","JavaScript","MongoDB","Next.js","Node.js","PostgreSQL","Prisma","React","REST APIs","TypeScript"]
- Run 4 missing: ["GraphQL","Kubernetes","open source","Redis","Terraform","unit, integration and end-to-end testing"]
- Run 5 matched: ["AWS","CI/CD pipelines","Docker","Express","Git/GitHub workflows","JavaScript","MongoDB","Next.js","Node.js","PostgreSQL","Prisma","React","REST APIs","TypeScript"]
- Run 5 missing: ["GraphQL","Kubernetes","open source","Redis","Terraform","unit, integration and end-to-end testing"]

## Phase0 Gemini cleared2 — provider: gemini, model: (app default)

- Runs completed: 5
- Score before: 55–55 (spread 0)
- Score after: 60–60 (spread 0)
- Distinct matched-keyword sets across runs: 1
- Distinct missing-keyword sets across runs: 1
- Identical matched AND missing across all runs: YES

| Run | Score before | Score after | Matched | Missing | Added | Model | Fallback | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 55 | 60 | 12 | 9 | 1 | gemini-3.8-flash | false | 3 |
| 2 | 55 | 60 | 12 | 9 | 1 | gemini-3.8-flash | false | 3 |
| 3 | 55 | 60 | 12 | 9 | 1 | gemini-3.8-flash | false | 3 |
| 4 | 55 | 60 | 12 | 9 | 1 | gemini-3.8-flash | false | 3 |
| 5 | 55 | 60 | 12 | 9 | 1 | gemini-3.8-flash | false | 3 |

- Run 1 matched: ["AWS","CI/CD pipelines","Docker","Express","JavaScript","MongoDB","Next.js","Node.js","PostgreSQL","React","REST APIs","TypeScript"]
- Run 1 missing: ["Bachelor's degree in Computer Science, Information Technology or a related field","caching layers such as Redis","Contributions to open source","Git/GitHub workflows","GraphQL","Kubernetes","Prisma or other modern data access layers","Terraform","testing practices including unit, integration and end-to-end testing"]
- Run 2 matched: ["AWS","CI/CD pipelines","Docker","Express","JavaScript","MongoDB","Next.js","Node.js","PostgreSQL","React","REST APIs","TypeScript"]
- Run 2 missing: ["Bachelor's degree in Computer Science, Information Technology or a related field","caching layers such as Redis","Contributions to open source","Git/GitHub workflows","GraphQL","Kubernetes","Prisma or other modern data access layers","Terraform","testing practices including unit, integration and end-to-end testing"]
- Run 3 matched: ["AWS","CI/CD pipelines","Docker","Express","JavaScript","MongoDB","Next.js","Node.js","PostgreSQL","React","REST APIs","TypeScript"]
- Run 3 missing: ["Bachelor's degree in Computer Science, Information Technology or a related field","caching layers such as Redis","Contributions to open source","Git/GitHub workflows","GraphQL","Kubernetes","Prisma or other modern data access layers","Terraform","testing practices including unit, integration and end-to-end testing"]
- Run 4 matched: ["AWS","CI/CD pipelines","Docker","Express","JavaScript","MongoDB","Next.js","Node.js","PostgreSQL","React","REST APIs","TypeScript"]
- Run 4 missing: ["Bachelor's degree in Computer Science, Information Technology or a related field","caching layers such as Redis","Contributions to open source","Git/GitHub workflows","GraphQL","Kubernetes","Prisma or other modern data access layers","Terraform","testing practices including unit, integration and end-to-end testing"]
- Run 5 matched: ["AWS","CI/CD pipelines","Docker","Express","JavaScript","MongoDB","Next.js","Node.js","PostgreSQL","React","REST APIs","TypeScript"]
- Run 5 missing: ["Bachelor's degree in Computer Science, Information Technology or a related field","caching layers such as Redis","Contributions to open source","Git/GitHub workflows","GraphQL","Kubernetes","Prisma or other modern data access layers","Terraform","testing practices including unit, integration and end-to-end testing"]

## Phase0 Gemini cached2 — provider: gemini, model: (app default)

- Runs completed: 5
- Score before: 55–55 (spread 0)
- Score after: 60–60 (spread 0)
- Distinct matched-keyword sets across runs: 1
- Distinct missing-keyword sets across runs: 1
- Identical matched AND missing across all runs: YES

| Run | Score before | Score after | Matched | Missing | Added | Model | Fallback | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 55 | 60 | 12 | 9 | 1 | gemini-3.8-flash | false | 3 |
| 2 | 55 | 60 | 12 | 9 | 1 | gemini-3.8-flash | false | 3 |
| 3 | 55 | 60 | 12 | 9 | 1 | gemini-3.8-flash | false | 3 |
| 4 | 55 | 60 | 12 | 9 | 1 | gemini-3.8-flash | false | 3 |
| 5 | 55 | 60 | 12 | 9 | 1 | gemini-3.8-flash | false | 3 |

- Run 1 matched: ["AWS","CI/CD pipelines","Docker","Express","JavaScript","MongoDB","Next.js","Node.js","PostgreSQL","React","REST APIs","TypeScript"]
- Run 1 missing: ["Bachelor's degree in Computer Science, Information Technology or a related field","caching layers such as Redis","Contributions to open source","Git/GitHub workflows","GraphQL","Kubernetes","Prisma or other modern data access layers","Terraform","testing practices including unit, integration and end-to-end testing"]
- Run 2 matched: ["AWS","CI/CD pipelines","Docker","Express","JavaScript","MongoDB","Next.js","Node.js","PostgreSQL","React","REST APIs","TypeScript"]
- Run 2 missing: ["Bachelor's degree in Computer Science, Information Technology or a related field","caching layers such as Redis","Contributions to open source","Git/GitHub workflows","GraphQL","Kubernetes","Prisma or other modern data access layers","Terraform","testing practices including unit, integration and end-to-end testing"]
- Run 3 matched: ["AWS","CI/CD pipelines","Docker","Express","JavaScript","MongoDB","Next.js","Node.js","PostgreSQL","React","REST APIs","TypeScript"]
- Run 3 missing: ["Bachelor's degree in Computer Science, Information Technology or a related field","caching layers such as Redis","Contributions to open source","Git/GitHub workflows","GraphQL","Kubernetes","Prisma or other modern data access layers","Terraform","testing practices including unit, integration and end-to-end testing"]
- Run 4 matched: ["AWS","CI/CD pipelines","Docker","Express","JavaScript","MongoDB","Next.js","Node.js","PostgreSQL","React","REST APIs","TypeScript"]
- Run 4 missing: ["Bachelor's degree in Computer Science, Information Technology or a related field","caching layers such as Redis","Contributions to open source","Git/GitHub workflows","GraphQL","Kubernetes","Prisma or other modern data access layers","Terraform","testing practices including unit, integration and end-to-end testing"]
- Run 5 matched: ["AWS","CI/CD pipelines","Docker","Express","JavaScript","MongoDB","Next.js","Node.js","PostgreSQL","React","REST APIs","TypeScript"]
- Run 5 missing: ["Bachelor's degree in Computer Science, Information Technology or a related field","caching layers such as Redis","Contributions to open source","Git/GitHub workflows","GraphQL","Kubernetes","Prisma or other modern data access layers","Terraform","testing practices including unit, integration and end-to-end testing"]
