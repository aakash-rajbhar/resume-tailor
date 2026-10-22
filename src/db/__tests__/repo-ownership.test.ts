import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { eq } from "drizzle-orm";
import type { AnyPgTable } from "drizzle-orm/pg-core";
import { createTestDb } from "./helpers/pglite";
import { createRepos, type Repos } from "@/db/repo";
import { users, accounts, profiles, experience, projects, skills, education, certifications, jobs, verifiedFacts } from "@/db/schema";
import { ConflictError } from "@/lib/errors";
import { encryptSecret } from "@/lib/crypto";
import type { Db } from "@/db/client";

const USER_A = "user-a";
const USER_B = "user-b";

interface IsolationCase {
  name: string;
  create: (repos: Repos, userId: string) => Promise<{ id: string; version: number }>;
  list: (repos: Repos, userId: string) => Promise<{ id: string }[]>;
  get: (repos: Repos, userId: string, id: string) => Promise<{ id: string } | null>;
  update: (
    repos: Repos,
    userId: string,
    id: string,
    version: number,
  ) => Promise<unknown>;
  remove: (repos: Repos, userId: string, id: string) => Promise<boolean>;
  table: AnyPgTable;
}

describe("repository ownership", () => {
  let client: Awaited<ReturnType<typeof createTestDb>>["client"];
  let db: Db;
  let repos: Repos;
  const originalKey = process.env.TOKEN_ENCRYPTION_KEY;

  beforeAll(async () => {
    process.env.TOKEN_ENCRYPTION_KEY = "c".repeat(64);
    const created = await createTestDb();
    client = created.client;
    db = created.db as unknown as Db;
    repos = createRepos(db);

    await db.insert(users).values([
      { id: USER_A, name: "User A" },
      { id: USER_B, name: "User B" },
    ]);
  });

  afterAll(async () => {
    if (originalKey === undefined) delete process.env.TOKEN_ENCRYPTION_KEY;
    else process.env.TOKEN_ENCRYPTION_KEY = originalKey;
    await client.close();
  });

  const cases: IsolationCase[] = [
    {
      name: "profiles",
      table: profiles,
      create: (r, userId) =>
        r.profiles.create(userId, {
          fullName: "Ada Lovelace",
          headline: "Engineer",
          summary: "",
          links: [],
        }),
      list: async (r, userId) => {
        const row = await r.profiles.get(userId);
        return row ? [row] : [];
      },
      get: (r, userId, id) => r.profiles.getById(userId, id),
      update: (r, userId, id, version) =>
        r.profiles.update(userId, id, { headline: "Hijacked" }, version),
      remove: (r, userId, id) => r.profiles.remove(userId, id),
    },
    {
      name: "experience",
      table: experience,
      create: (r, userId) =>
        r.experience.create(userId, {
          company: "Acme",
          title: "Engineer",
          location: "",
          employmentType: "full_time",
          isCurrent: true,
          description: "",
          bullets: ["Did the thing"],
          sortOrder: 0,
        }),
      list: (r, userId) => r.experience.list(userId),
      get: (r, userId, id) => r.experience.get(userId, id),
      update: (r, userId, id, version) =>
        r.experience.update(userId, id, { title: "Hijacked" }, version),
      remove: (r, userId, id) => r.experience.remove(userId, id),
    },
    {
      name: "projects",
      table: projects,
      create: (r, userId) =>
        r.projects.create(userId, {
          name: "Toolkit",
          summary: "",
          source: "manual",
          importance: 3,
          includeByDefault: true,
          confirmed: false,
          tools: ["TypeScript"],
          bullets: [],
          sortOrder: 0,
        }),
      list: (r, userId) => r.projects.list(userId),
      get: (r, userId, id) => r.projects.get(userId, id),
      update: (r, userId, id, version) =>
        r.projects.update(userId, id, { name: "Hijacked" }, version),
      remove: (r, userId, id) => r.projects.remove(userId, id),
    },
    {
      name: "skills",
      table: skills,
      create: (r, userId) =>
        r.skills.create(userId, {
          groupLabel: "Languages",
          name: "TypeScript",
          evidenceRefs: [],
          sortOrder: 0,
        }),
      list: (r, userId) => r.skills.list(userId),
      get: (r, userId, id) => r.skills.get(userId, id),
      update: (r, userId, id, version) =>
        r.skills.update(userId, id, { name: "Hijacked" }, version),
      remove: (r, userId, id) => r.skills.remove(userId, id),
    },
    {
      name: "education",
      table: education,
      create: (r, userId) =>
        r.education.create(userId, {
          school: "Polytechnic",
          degree: "BSc",
          fieldOfStudy: "Computing",
          sortOrder: 0,
        }),
      list: (r, userId) => r.education.list(userId),
      get: (r, userId, id) => r.education.get(userId, id),
      update: (r, userId, id, version) =>
        r.education.update(userId, id, { school: "Hijacked" }, version),
      remove: (r, userId, id) => r.education.remove(userId, id),
    },
    {
      name: "certifications",
      table: certifications,
      create: (r, userId) =>
        r.certifications.create(userId, {
          name: "AWS SAA",
          issuer: "Amazon",
          sortOrder: 0,
        }),
      list: (r, userId) => r.certifications.list(userId),
      get: (r, userId, id) => r.certifications.get(userId, id),
      update: (r, userId, id, version) =>
        r.certifications.update(userId, id, { name: "Hijacked" }, version),
      remove: (r, userId, id) => r.certifications.remove(userId, id),
    },
    {
      name: "jobs",
      table: jobs,
      create: (r, userId) =>
        r.jobs.create(userId, {
          company: "Globex",
          title: "Engineer",
          jdText: "Looking for an engineer.",
          status: "draft",
        }),
      list: (r, userId) => r.jobs.list(userId),
      get: (r, userId, id) => r.jobs.get(userId, id),
      update: (r, userId, id, version) =>
        r.jobs.update(userId, id, { title: "Hijacked" }, version),
      remove: (r, userId, id) => r.jobs.remove(userId, id),
    },
    {
      name: "verifiedFacts",
      table: verifiedFacts,
      create: (r, userId) =>
        r.verifiedFacts.create(userId, {
          questionKey: "scale",
          question: "Have you scaled a system?",
          answer: "Yes",
          answerType: "has",
          status: "verified",
          source: "interview",
        }),
      list: (r, userId) => r.verifiedFacts.list(userId),
      get: (r, userId, id) => r.verifiedFacts.get(userId, id),
      update: (r, userId, id, version) =>
        r.verifiedFacts.update(userId, id, { answer: "Hijacked" }, version),
      remove: (r, userId, id) => r.verifiedFacts.remove(userId, id),
    },
  ];

  for (const testCase of cases) {
    it(`keeps ${testCase.name} isolated between users`, async () => {
      const created = await testCase.create(repos, USER_A);

      // Reading another user's row returns nothing.
      expect(await testCase.get(repos, USER_B, created.id)).toBeNull();

      // Listing only returns the caller's own rows.
      const own = await testCase.list(repos, USER_A);
      const other = await testCase.list(repos, USER_B);
      expect(own.some((row) => row.id === created.id)).toBe(true);
      expect(other.some((row) => row.id === created.id)).toBe(false);

      // Writing another user's row is rejected.
      await expect(
        testCase.update(repos, USER_B, created.id, created.version),
      ).rejects.toBeInstanceOf(ConflictError);

      // Deleting another user's row does nothing.
      expect(await testCase.remove(repos, USER_B, created.id)).toBe(false);

      const surviving = await db
        .select()
        .from(testCase.table)
        .where(eq((testCase.table as unknown as typeof profiles).id, created.id));
      expect(surviving).toHaveLength(1);

      // The owner can still read, update and delete the row.
      expect(await testCase.get(repos, USER_A, created.id)).not.toBeNull();
      await testCase.update(repos, USER_A, created.id, created.version);
      expect(await testCase.remove(repos, USER_A, created.id)).toBe(true);
    });
  }

  it("scopes the accounts repository to its owner", async () => {
    await db.insert(users).values([{ id: "user-c", name: "User C" }]);

    const rows = await repos.accounts.listForUser("user-c");
    expect(rows).toHaveLength(0);
  });

  it("never lists another user's accounts and decrypts only for the owner", async () => {
    await db.insert(users).values([{ id: "user-f", name: "User F" }]);

    const token = "gho_16C7e42F292c6912E7710c838347Ae178B4a";
    const encrypted = encryptSecret(token);

    await db.insert(accounts).values({
      userId: USER_A,
      type: "oauth",
      provider: "github",
      providerAccountId: "github-a",
      access_token: encrypted,
      token_type: "bearer",
      scope: "read:user user:email",
    });

    // The list only returns the caller's own rows.
    expect(await repos.accounts.listForUser(USER_B)).toHaveLength(0);
    expect(await repos.accounts.listForUser(USER_A)).toHaveLength(1);

    // The token is only decrypted for the owner, and never in plaintext.
    expect(await repos.accounts.getGithubToken(USER_B)).toBeNull();
    expect(await repos.accounts.getGithubToken(USER_A)).toBe(token);
  });

  it("refuses to read a token that is not encrypted", async () => {
    await db.insert(users).values([{ id: "user-g", name: "User G" }]);

    await db.insert(accounts).values({
      userId: "user-g",
      type: "oauth",
      provider: "github",
      providerAccountId: "github-g",
      access_token: "gho_plaintext_token",
      token_type: "bearer",
    });

    await expect(repos.accounts.getGithubToken("user-g")).rejects.toThrow(
      /not encrypted/,
    );
  });

  it("reads a verified fact by question key for the owner only", async () => {
    await db.insert(users).values([{ id: "user-h", name: "User H" }]);

    await repos.verifiedFacts.create(USER_A, {
      questionKey: "scale",
      question: "Have you scaled a system?",
      answer: "Yes",
      answerType: "has",
      status: "verified",
      source: "interview",
    });

    expect(
      await repos.verifiedFacts.getByQuestionKey(USER_A, "scale"),
    ).not.toBeNull();
    expect(
      await repos.verifiedFacts.getByQuestionKey(USER_B, "scale"),
    ).toBeNull();
    expect(
      await repos.verifiedFacts.getByQuestionKey(USER_A, "unknown-key"),
    ).toBeNull();
  });

  it("reads a profile only for its owner", async () => {
    await repos.profiles.create(USER_A, {
      fullName: "Ada Lovelace",
      headline: "Engineer",
      summary: "",
      links: [],
    });

    expect(await repos.profiles.get(USER_B)).toBeNull();
    expect(await repos.profiles.get(USER_A)).not.toBeNull();
  });

  it("reports whether a user row exists", async () => {
    expect(await repos.users.exists(USER_A)).toBe(true);
    expect(await repos.users.exists("missing-user")).toBe(false);
  });

  it("keeps verified facts unique per question key and user", async () => {
    const user = "user-d";
    await db.insert(users).values({ id: user, name: "User D" });

    await repos.verifiedFacts.create(user, {
      questionKey: "scale",
      question: "Have you scaled a system?",
      answer: "Yes",
      answerType: "has",
      status: "verified",
      source: "interview",
    });

    await expect(
      repos.verifiedFacts.create(user, {
        questionKey: "scale",
        question: "Have you scaled a system?",
        answer: "Again",
        answerType: "has",
        status: "verified",
        source: "interview",
      }),
    ).rejects.toThrow();

    // Another user may use the same question key.
    const other = "user-e";
    await db.insert(users).values({ id: other, name: "User E" });
    await expect(
      repos.verifiedFacts.create(other, {
        questionKey: "scale",
        question: "Have you scaled a system?",
        answer: "Yes",
        answerType: "has",
        status: "verified",
        source: "interview",
      }),
    ).resolves.toBeTruthy();
  });
});
