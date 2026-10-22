/**
 * Skill alias map. Canonical name -> accepted surface forms.
 *
 * Extend this file to teach the matcher a new synonym. Matching is
 * token-based, so every entry must stay free of filler words.
 */
export const SKILL_SYNONYMS: Record<string, string[]> = {
  JavaScript: ["JavaScript", "JS", "ECMAScript", "ES6", "ES2015"],
  TypeScript: ["TypeScript", "TS"],
  React: ["React", "React.js", "ReactJS"],
  "Next.js": ["Next.js", "NextJS"],
  "Node.js": ["Node.js", "NodeJS"],
  Express: ["Express", "Express.js", "ExpressJS"],
  REST: ["REST", "REST API", "REST APIs", "RESTful", "RESTful API", "RESTful APIs"],
  GraphQL: ["GraphQL"],
  PostgreSQL: ["PostgreSQL", "Postgres", "PSQL", "PostgreSQL DB"],
  MongoDB: ["MongoDB", "Mongo"],
  MySQL: ["MySQL", "MariaDB"],
  Redis: ["Redis"],
  DynamoDB: ["DynamoDB"],
  Elasticsearch: ["Elasticsearch", "Elastic Search"],
  AWS: ["AWS", "Amazon Web Services", "Amazon EC2", "Amazon S3", "Amazon RDS"],
  Docker: ["Docker", "Dockerfile", "Docker Compose", "Containerization", "Containers"],
  Kubernetes: ["Kubernetes", "K8s", "Kube"],
  Terraform: ["Terraform", "Infrastructure as Code", "IaC"],
  "CI/CD": [
    "CI/CD",
    "CICD",
    "CI CD",
    "Continuous Integration",
    "Continuous Delivery",
    "Continuous Deployment",
    "CI Pipeline",
    "CD Pipeline",
    "GitHub Actions",
    "Build Pipeline",
  ],
  Jenkins: ["Jenkins"],
  Git: ["Git", "GitHub", "Git/GitHub", "Github", "Bitbucket"],
  Java: ["Java", "Java 8", "Java 11", "Java 17", "Java 21"],
  Python: ["Python", "Python3", "Python 3"],
  Django: ["Django"],
  Laravel: ["Laravel"],
  FastAPI: ["FastAPI"],
  Flask: ["Flask"],
  "Tailwind CSS": ["Tailwind CSS", "TailwindCSS", "Tailwind"],
  "Material UI": ["Material UI", "MUI", "Material-UI"],
  Redux: ["Redux", "Redux Toolkit", "RTK"],
  JWT: ["JWT", "JSON Web Token", "JSON Web Tokens"],
  OAuth: ["OAuth", "OAuth 2.0", "OAuth2"],
  HTML5: ["HTML5", "HTML"],
  CSS3: ["CSS3", "CSS", "SCSS", "Sass"],
  "Responsive Design": ["Responsive Design", "Responsive UI", "Responsive Layout"],
  Performance: [
    "Performance Optimization",
    "Performance Tuning",
    "Web Performance",
    "Web Vitals",
    "Core Web Vitals",
    "Page Speed",
  ],
  SSR: ["SSR", "Server-Side Rendering", "Server Side Rendering"],
  SSG: ["SSG", "Static Site Generation"],
  ISR: ["ISR", "Incremental Static Regeneration"],
  WebSocket: ["WebSocket", "WebSockets", "Socket.io", "Socket IO"],
  Jest: ["Jest"],
  Playwright: ["Playwright"],
  Cypress: ["Cypress"],
  Testing: [
    "Testing",
    "Unit Testing",
    "Integration Testing",
    "End-to-End Testing",
    "End to End Testing",
    "E2E Testing",
    "Test Automation",
    "Automated Testing",
    "TDD",
    "Test-Driven Development",
    "QA",
  ],
  Prisma: ["Prisma"],
  ORM: ["ORM", "Object-Relational Mapping"],
  Microservices: ["Microservices", "Microservice Architecture", "Service Oriented Architecture"],
  "System Design": ["System Design", "Software Architecture", "Solution Architecture"],
  "Data Structures and Algorithms": [
    "Data Structures and Algorithms",
    "Data Structures & Algorithms",
    "DSA",
    "Algorithms",
    "Data Structures",
  ],
  OOP: ["OOP", "Object-Oriented Programming", "Object Oriented Programming"],
  "Design Patterns": ["Design Patterns", "Software Design Patterns"],
  Agile: ["Agile", "Scrum", "Kanban"],
  Linux: ["Linux", "Ubuntu"],
  "Machine Learning": ["Machine Learning", "ML"],
  LLM: ["LLM", "LLMs", "Large Language Model", "Large Language Models"],
  Claude: ["Claude", "Anthropic Claude", "Claude Code"],
  GPT: ["GPT", "OpenAI", "ChatGPT", "GPT-4", "GPT-4o"],
  Figma: ["Figma"],
  Jira: ["Jira"],
  Confluence: ["Confluence"],
  "Cloud Storage": ["Cloud Storage", "File Storage", "Object Storage"],
  Authentication: [
    "Authentication",
    "Auth",
    "Authentication and Authorization",
    "Access Control",
    "RBAC",
    "Role-Based Access Control",
    "OAuth",
  ],
  Encryption: ["Encryption", "AES-256", "AES", "Hashing"],
  "User Interface": ["User Interface", "UI", "UX", "UI/UX", "Frontend"],
};

const PROTECTED_TOKENS: [string, string][] = [
  ["asp.net", "aspnet"],
  ["vb.net", "vbnet"],
  [".net", "dotnet"],
  ["c++", "cplusplus"],
  ["f#", "fsharp"],
  ["c#", "csharp"],
  ["node.js", "nodejs"],
  ["next.js", "nextjs"],
  ["react.js", "reactjs"],
  ["vue.js", "vuejs"],
  ["express.js", "expressjs"],
  ["angular.js", "angularjs"],
  ["ember.js", "emberjs"],
  ["backbone.js", "backbonejs"],
  ["three.js", "threejs"],
  ["d3.js", "d3js"],
];

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Lowercases, protects tokens whose meaning depends on punctuation
 * (c++, c#, .net, node.js) and strips everything else down to word characters.
 */
export function normalizeForMatch(input: string): string {
  let text = input.normalize("NFKC").toLowerCase();
  for (const [raw, token] of PROTECTED_TOKENS) {
    text = text.replace(
      new RegExp(`(?<![a-z0-9])${escapeRegExp(raw)}(?![a-z0-9])`, "g"),
      token,
    );
  }
  return text
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

interface SynonymGroup {
  canonical: string;
  variants: string[];
}

const GROUPS: SynonymGroup[] = Object.entries(SKILL_SYNONYMS).map(
  ([canonical, aliases]) => {
    const normalizedCanonical = normalizeForMatch(canonical);
    const variants = new Set<string>([normalizedCanonical]);
    for (const alias of aliases) {
      const normalized = normalizeForMatch(alias);
      if (normalized) variants.add(normalized);
    }
    return { canonical: normalizedCanonical, variants: [...variants] };
  },
);

const BY_VARIANT = new Map<string, SynonymGroup>();
for (const group of GROUPS) {
  for (const variant of group.variants) {
    if (!BY_VARIANT.has(variant)) BY_VARIANT.set(variant, group);
  }
}

/** Canonical, normalized name for a skill string. */
export function canonicalizeSkill(name: string): string {
  const normalized = normalizeForMatch(name);
  if (!normalized) return "";
  return BY_VARIANT.get(normalized)?.canonical ?? normalized;
}

/** Every surface form that counts as evidence for a skill string. */
export function skillVariants(name: string): string[] {
  const normalized = normalizeForMatch(name);
  if (!normalized) return [];
  const group = BY_VARIANT.get(normalized);
  return group ? [...group.variants] : [normalized];
}
