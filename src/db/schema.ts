import { relations, sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * Every table is declared with `.enableRLS()`, which makes drizzle-kit emit
 * `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`. No policies are created, so
 * Supabase's public roles (`anon`, `authenticated`) get default-deny while the
 * app's own server connection (table owner) keeps working.
 *
 * Property names of the Auth.js tables are fixed by @auth/drizzle-adapter and
 * are camelCase; their database columns are snake_case.
 */

export const answerTypeEnum = pgEnum("answer_type", ["has", "none", "skipped"]);
export const projectSourceEnum = pgEnum("project_source", ["github", "manual"]);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
};

const usersBase = pgTable(
  "users",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()::text`),
    name: text("name"),
    email: text("email"),
    emailVerified: timestamp("email_verified", {
      withTimezone: true,
      mode: "date",
    }),
    image: text("image"),
    githubLogin: text("github_login"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("users_email_unique").on(table.email),
    uniqueIndex("users_github_login_unique").on(table.githubLogin),
  ],
);

export const users = usersBase.enableRLS();
/** The same table, typed for the Auth.js adapter. */
export const usersTable = usersBase;

const accountsBase = pgTable(
  "accounts",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()::text`),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    /** AES-256-GCM ciphertext (`iv:tag:ciphertext`). Never plaintext. */
    access_token: text("access_token"),
    /** AES-256-GCM ciphertext (`iv:tag:ciphertext`). Never plaintext. */
    refresh_token: text("refresh_token"),
    /** AES-256-GCM ciphertext (`iv:tag:ciphertext`). Never plaintext. */
    id_token: text("id_token"),
    token_type: text("token_type"),
    scope: text("scope"),
    expires_at: integer("expires_at"),
    session_state: text("session_state"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("accounts_provider_account_unique").on(
      table.provider,
      table.providerAccountId,
    ),
    index("accounts_user_id_idx").on(table.userId),
  ],
);

export const accounts = accountsBase.enableRLS();
export const accountsTable = accountsBase;

const sessionsBase = pgTable(
  "sessions",
  {
    sessionToken: text("session_token").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expires: timestamp("expires", { withTimezone: true, mode: "date" }).notNull(),
    ...timestamps,
  },
  (table) => [index("sessions_user_id_idx").on(table.userId)],
);

export const sessions = sessionsBase.enableRLS();
export const sessionsTable = sessionsBase;

const verificationTokensBase = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { withTimezone: true, mode: "date" }).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("verification_tokens_identifier_token_unique").on(
      table.identifier,
      table.token,
    ),
  ],
);

export const verificationTokens = verificationTokensBase.enableRLS();
export const verificationTokensTable = verificationTokensBase;

export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id")
      .primaryKey()
      .defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    fullName: text("full_name").notNull().default(""),
    headline: text("headline").notNull().default(""),
    summary: text("summary").notNull().default(""),
    email: text("email"),
    phone: text("phone"),
    location: text("location"),
    links: jsonb("links").notNull().default(sql`'[]'::jsonb`),
    githubUrl: text("github_url"),
    linkedinUrl: text("linkedin_url"),
    portfolioUrl: text("portfolio_url"),
    version: integer("version").notNull().default(1),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("profiles_user_id_unique").on(table.userId),
    index("profiles_user_id_idx").on(table.userId),
  ],
).enableRLS();

export const experience = pgTable(
  "experience",
  {
    id: uuid("id")
      .primaryKey()
      .defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    company: text("company").notNull().default(""),
    title: text("title").notNull().default(""),
    location: text("location").notNull().default(""),
    employmentType: text("employment_type").notNull().default(""),
    /** `YYYY-MM`, validated by Zod. */
    startDate: text("start_date"),
    /** `YYYY-MM`, validated by Zod. */
    endDate: text("end_date"),
    isCurrent: boolean("is_current").notNull().default(false),
    description: text("description").notNull().default(""),
    bullets: jsonb("bullets").notNull().default(sql`'[]'::jsonb`),
    sortOrder: integer("sort_order").notNull().default(0),
    version: integer("version").notNull().default(1),
    ...timestamps,
  },
  (table) => [
    index("experience_user_id_idx").on(table.userId),
    index("experience_user_id_sort_order_idx").on(table.userId, table.sortOrder),
  ],
).enableRLS();

export const projects = pgTable(
  "projects",
  {
    id: uuid("id")
      .primaryKey()
      .defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull().default(""),
    summary: text("summary").notNull().default(""),
    url: text("url"),
    source: projectSourceEnum("source").notNull().default("manual"),
    /** GitHub repository id, unique per user. */
    githubRepoId: text("github_repo_id"),
    /** 1 (lowest) to 5 (highest). */
    importance: integer("importance").notNull().default(3),
    includeByDefault: boolean("include_by_default").notNull().default(true),
    confirmed: boolean("confirmed").notNull().default(false),
    tools: jsonb("tools").notNull().default(sql`'[]'::jsonb`),
    bullets: jsonb("bullets").notNull().default(sql`'[]'::jsonb`),
    /** `YYYY-MM`, validated by Zod. */
    startDate: text("start_date"),
    /** `YYYY-MM`, validated by Zod. */
    endDate: text("end_date"),
    sortOrder: integer("sort_order").notNull().default(0),
    version: integer("version").notNull().default(1),
    ...timestamps,
  },
  (table) => [
    index("projects_user_id_idx").on(table.userId),
    index("projects_user_id_sort_order_idx").on(table.userId, table.sortOrder),
    uniqueIndex("projects_user_id_github_repo_id_unique").on(
      table.userId,
      table.githubRepoId,
    ),
  ],
).enableRLS();

export const skills = pgTable(
  "skills",
  {
    id: uuid("id")
      .primaryKey()
      .defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    groupLabel: text("group_label").notNull().default(""),
    name: text("name").notNull().default(""),
    /**
     * Where the skill is evidenced (resume line, project, verified fact).
     * Shape is validated by Zod on write. There is deliberately no stored
     * canonical skill column: canonicalization happens in code.
     */
    evidenceRefs: jsonb("evidence_refs")
      .notNull()
      .default(sql`'[]'::jsonb`),
    sortOrder: integer("sort_order").notNull().default(0),
    version: integer("version").notNull().default(1),
    ...timestamps,
  },
  (table) => [
    index("skills_user_id_idx").on(table.userId),
    index("skills_user_id_sort_order_idx").on(table.userId, table.sortOrder),
  ],
).enableRLS();

export const education = pgTable(
  "education",
  {
    id: uuid("id")
      .primaryKey()
      .defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    school: text("school").notNull().default(""),
    degree: text("degree").notNull().default(""),
    fieldOfStudy: text("field_of_study").notNull().default(""),
    /** `YYYY-MM`, validated by Zod. */
    startDate: text("start_date"),
    /** `YYYY-MM`, validated by Zod. */
    endDate: text("end_date"),
    sortOrder: integer("sort_order").notNull().default(0),
    version: integer("version").notNull().default(1),
    ...timestamps,
  },
  (table) => [
    index("education_user_id_idx").on(table.userId),
    index("education_user_id_sort_order_idx").on(table.userId, table.sortOrder),
  ],
).enableRLS();

export const certifications = pgTable(
  "certifications",
  {
    id: uuid("id")
      .primaryKey()
      .defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull().default(""),
    issuer: text("issuer").notNull().default(""),
    /** `YYYY-MM`, validated by Zod. */
    issuedOn: text("issued_on"),
    url: text("url"),
    sortOrder: integer("sort_order").notNull().default(0),
    version: integer("version").notNull().default(1),
    ...timestamps,
  },
  (table) => [
    index("certifications_user_id_idx").on(table.userId),
    index("certifications_user_id_sort_order_idx").on(
      table.userId,
      table.sortOrder,
    ),
  ],
).enableRLS();

export const jobs = pgTable(
  "jobs",
  {
    id: uuid("id")
      .primaryKey()
      .defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    company: text("company").notNull().default(""),
    title: text("title").notNull().default(""),
    jdText: text("jd_text").notNull().default(""),
    parsedJd: jsonb("parsed_jd"),
    selection: jsonb("selection"),
    answers: jsonb("answers"),
    /** The final tailored resume produced for this job. */
    resume: jsonb("resume"),
    modelUsed: text("model_used"),
    status: text("status").notNull().default("draft"),
    scoreBefore: integer("score_before"),
    scoreAfter: integer("score_after"),
    version: integer("version").notNull().default(1),
    ...timestamps,
  },
  (table) => [
    index("jobs_user_id_idx").on(table.userId),
    index("jobs_user_id_created_at_idx").on(table.userId, table.createdAt),
  ],
).enableRLS();

export const verifiedFacts = pgTable(
  "verified_facts",
  {
    id: uuid("id")
      .primaryKey()
      .defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    questionKey: text("question_key").notNull(),
    question: text("question").notNull().default(""),
    answer: text("answer").notNull().default(""),
    answerType: answerTypeEnum("answer_type").notNull().default("has"),
    status: text("status").notNull().default("verified"),
    source: text("source").notNull().default("interview"),
    jobId: uuid("job_id").references(() => jobs.id, { onDelete: "set null" }),
    version: integer("version").notNull().default(1),
    ...timestamps,
  },
  (table) => [
    index("verified_facts_user_id_idx").on(table.userId),
    uniqueIndex("verified_facts_user_id_question_key_unique").on(
      table.userId,
      table.questionKey,
    ),
  ],
).enableRLS();

/**
 * Shared LLM cache. Rows are intentionally shared across users and keyed by a
 * hash of the request: they must never contain personal data, resume text or
 * credentials. Only extracted job-description structure is stored.
 */
export const llmCache = pgTable(
  "llm_cache",
  {
    key: text("key").primaryKey(),
    purpose: text("purpose").notNull(),
    model: text("model").notNull().default(""),
    promptVersion: text("prompt_version").notNull().default(""),
    payload: jsonb("payload").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date" }),
  },
  (table) => [
    index("llm_cache_purpose_model_idx").on(table.purpose, table.model),
    index("llm_cache_expires_at_idx").on(table.expiresAt),
  ],
).enableRLS();

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  profiles: many(profiles),
  experience: many(experience),
  projects: many(projects),
  skills: many(skills),
  education: many(education),
  certifications: many(certifications),
  jobs: many(jobs),
  verifiedFacts: many(verifiedFacts),
}));

export const profilesRelations = relations(profiles, ({ one }) => ({
  user: one(users, { fields: [profiles.userId], references: [users.id] }),
}));

export const experienceRelations = relations(experience, ({ one }) => ({
  user: one(users, { fields: [experience.userId], references: [users.id] }),
}));

export const projectsRelations = relations(projects, ({ one }) => ({
  user: one(users, { fields: [projects.userId], references: [users.id] }),
}));

export const skillsRelations = relations(skills, ({ one }) => ({
  user: one(users, { fields: [skills.userId], references: [users.id] }),
}));

export const educationRelations = relations(education, ({ one }) => ({
  user: one(users, { fields: [education.userId], references: [users.id] }),
}));

export const certificationsRelations = relations(certifications, ({ one }) => ({
  user: one(users, { fields: [certifications.userId], references: [users.id] }),
}));

export const jobsRelations = relations(jobs, ({ one, many }) => ({
  user: one(users, { fields: [jobs.userId], references: [users.id] }),
  verifiedFacts: many(verifiedFacts),
}));

export const verifiedFactsRelations = relations(verifiedFacts, ({ one }) => ({
  user: one(users, { fields: [verifiedFacts.userId], references: [users.id] }),
  job: one(jobs, { fields: [verifiedFacts.jobId], references: [jobs.id] }),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export type UserRow = typeof users.$inferSelect;
export type ProfileRow = typeof profiles.$inferSelect;
export type ExperienceRow = typeof experience.$inferSelect;
export type ProjectRow = typeof projects.$inferSelect;
export type SkillRow = typeof skills.$inferSelect;
export type EducationRow = typeof education.$inferSelect;
export type CertificationRow = typeof certifications.$inferSelect;
export type JobRow = typeof jobs.$inferSelect;
export type VerifiedFactRow = typeof verifiedFacts.$inferSelect;
