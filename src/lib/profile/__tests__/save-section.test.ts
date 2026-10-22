import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createTestDb } from "@/db/__tests__/helpers/pglite";
import type { Db } from "@/db/client";
import { createRepos, type Repos } from "@/db/repo";
import { users } from "@/db/schema";
import { ConflictError } from "@/lib/errors";
import { saveProfileSection } from "@/lib/profile/saveSection";
import type { ProfileSectionSave } from "@/lib/profile/schemas";

/**
 * Saving a section writes the whole section in one transaction: the new rows
 * are created, the changed rows are updated with an optimistic lock and the
 * rows the user removed are deleted. A stale version rolls the section back.
 */

const USER = "profile-user";

describe("saveProfileSection", () => {
  let client: Awaited<ReturnType<typeof createTestDb>>["client"];
  let db: Db;
  let repos: Repos;

  beforeAll(async () => {
    const created = await createTestDb();
    client = created.client;
    db = created.db as unknown as Db;
    repos = createRepos(db);
    await db.insert(users).values({ id: USER, name: "Profile User" });
  });

  afterAll(async () => {
    await client.close();
  });

  it("creates the profile when there is none", async () => {
    const saved = await saveProfileSection(
      USER,
      {
        section: "profile",
        profile: {
          fullName: "Ada Lovelace",
          headline: "Backend engineer",
          summary: "Builds payment services.",
          email: "ada@example.com",
          phone: null,
          location: "Bengaluru",
          links: [],
          githubUrl: null,
          linkedinUrl: null,
          portfolioUrl: null,
        },
      } satisfies ProfileSectionSave,
      db,
    );

    expect(saved.section).toBe("profile");
    expect(saved.rows).toHaveLength(1);
    expect(saved.rows[0].version).toBe(1);

    const row = await repos.profiles.get(USER);
    expect(row?.fullName).toBe("Ada Lovelace");
  });

  it("updates the profile with the version it was read at", async () => {
    const before = await repos.profiles.get(USER);

    const saved = await saveProfileSection(
      USER,
      {
        section: "profile",
        profile: {
          fullName: "Ada Lovelace",
          headline: "Staff backend engineer",
          summary: "Builds payment services.",
          email: "ada@example.com",
          phone: null,
          location: "Bengaluru",
          links: [],
          githubUrl: null,
          linkedinUrl: null,
          portfolioUrl: null,
        },
        version: before?.version,
      } satisfies ProfileSectionSave,
      db,
    );

    expect(saved.rows[0].version).toBe((before?.version ?? 0) + 1);

    const stale = await saveProfileSection(
      USER,
      {
        section: "profile",
        profile: {
          fullName: "Someone Else",
          headline: "Stale write",
          summary: "",
          email: null,
          phone: null,
          location: null,
          links: [],
          githubUrl: null,
          linkedinUrl: null,
          portfolioUrl: null,
        },
        version: before?.version,
      } satisfies ProfileSectionSave,
      db,
    ).catch((err: unknown) => err);

    expect(stale).toBeInstanceOf(ConflictError);

    const row = await repos.profiles.get(USER);
    expect(row?.headline).toBe("Staff backend engineer");
  });

  it("creates, updates and deletes the rows of a list section", async () => {
    const created = await saveProfileSection(
      USER,
      {
        section: "experience",
        items: [
          {
            company: "Acme",
            title: "Backend Engineer",
            location: "Bengaluru",
            employmentType: "full_time",
            startDate: "2021-01",
            endDate: null,
            isCurrent: true,
            description: "",
            bullets: ["Built the billing service with TypeScript."],
            sortOrder: 0,
          },
          {
            company: "Globex",
            title: "Engineer",
            location: "",
            employmentType: "full_time",
            startDate: "2019-01",
            endDate: "2020-12",
            isCurrent: false,
            description: "",
            bullets: [],
            sortOrder: 1,
          },
        ],
      } satisfies ProfileSectionSave,
      db,
    );

    expect(created.rows).toHaveLength(2);

    // The second role is removed, the first one is kept and a new one is added.
    const saved = await saveProfileSection(
      USER,
      {
        section: "experience",
        items: [
          {
            id: created.rows[0].id,
            version: created.rows[0].version,
            company: "Acme",
            title: "Senior Backend Engineer",
            location: "Bengaluru",
            employmentType: "full_time",
            startDate: "2021-01",
            endDate: null,
            isCurrent: true,
            description: "",
            bullets: ["Built the billing service with TypeScript."],
            sortOrder: 0,
          },
          {
            company: "Initech",
            title: "Engineer",
            location: "",
            employmentType: "contract",
            startDate: "2018-01",
            endDate: "2018-12",
            isCurrent: false,
            description: "",
            bullets: [],
            sortOrder: 1,
          },
        ],
      } satisfies ProfileSectionSave,
      db,
    );

    expect(saved.rows).toHaveLength(2);

    const rows = await repos.experience.list(USER);
    expect(rows).toHaveLength(2);
    expect(rows.map((row) => row.company).sort()).toEqual(["Acme", "Initech"]);
    expect(rows.find((row) => row.company === "Acme")?.title).toBe(
      "Senior Backend Engineer",
    );
    expect(rows.find((row) => row.company === "Acme")?.version).toBe(2);
  });

  it("rejects a row that was changed somewhere else", async () => {
    const before = await repos.experience.list(USER);
    const target = before.find((row) => row.company === "Acme");
    expect(target).toBeDefined();

    await repos.experience.update(
      USER,
      target!.id,
      { title: "Changed elsewhere" },
      target!.version,
    );

    await expect(
      saveProfileSection(
        USER,
        {
          section: "experience",
          items: [
            {
              id: target!.id,
              version: target!.version,
              company: "Acme",
              title: "My stale title",
              location: "",
              employmentType: "full_time",
              startDate: "2021-01",
              endDate: null,
              isCurrent: true,
              description: "",
              bullets: [],
              sortOrder: 0,
            },
          ],
        } satisfies ProfileSectionSave,
        db,
      ),
    ).rejects.toBeInstanceOf(ConflictError);

    const after = await repos.experience.get(USER, target!.id);
    expect(after?.title).toBe("Changed elsewhere");
  });

  it("computes the skill evidence in code and keeps the manual refs", async () => {
    const saved = await saveProfileSection(
      USER,
      {
        section: "skills",
        items: [
          {
            groupLabel: "Languages",
            name: "TypeScript",
            evidenceRefs: [{ kind: "manual", refId: "manual-1", note: "My own note" }],
            sortOrder: 0,
          },
          {
            groupLabel: "Languages",
            name: "Rust",
            evidenceRefs: [],
            sortOrder: 1,
          },
        ],
      } satisfies ProfileSectionSave,
      db,
    );

    expect(saved.rows).toHaveLength(2);

    const rows = await repos.skills.list(USER);
    const typescript = rows.find((row) => row.name === "TypeScript");
    const rust = rows.find((row) => row.name === "Rust");

    // The manual ref is kept and the code adds the role that mentions it.
    expect(typescript?.evidenceRefs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "manual", refId: "manual-1" }),
      ]),
    );
    expect(typescript?.evidenceRefs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "experience" }),
      ]),
    );

    // Nothing mentions Rust, so it has no evidence.
    expect(rust?.evidenceRefs).toEqual([]);
  });
});
