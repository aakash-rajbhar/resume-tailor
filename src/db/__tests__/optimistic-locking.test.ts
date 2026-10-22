import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { createTestDb } from "./helpers/pglite";
import { createRepos, type Repos } from "@/db/repo";
import { users } from "@/db/schema";
import { ConflictError } from "@/lib/errors";
import type { Db } from "@/db/client";

const USER = "locking-user";

describe("optimistic locking", () => {
  let client: Awaited<ReturnType<typeof createTestDb>>["client"];
  let db: Db;
  let repos: Repos;

  beforeAll(async () => {
    const created = await createTestDb();
    client = created.client;
    db = created.db as unknown as Db;
    repos = createRepos(db);
    await db.insert(users).values({ id: USER, name: "Locking User" });
  });

  afterAll(async () => {
    await client.close();
  });

  it("rejects an update with a stale version", async () => {
    const created = await repos.experience.create(USER, {
      company: "Acme",
      title: "Engineer",
      location: "",
      employmentType: "full_time",
      isCurrent: true,
      description: "",
      bullets: [],
      sortOrder: 0,
    });

    expect(created.version).toBe(1);

    const updated = await repos.experience.update(
      USER,
      created.id,
      { title: "Senior Engineer" },
      created.version,
    );
    expect(updated.version).toBe(2);

    await expect(
      repos.experience.update(
        USER,
        created.id,
        { title: "Stale write" },
        created.version,
      ),
    ).rejects.toBeInstanceOf(ConflictError);

    // The stale write did not change the row.
    const current = await repos.experience.get(USER, created.id);
    expect(current?.title).toBe("Senior Engineer");
    expect(current?.version).toBe(2);
  });

  it("rejects an update when the version does not match at all", async () => {
    const created = await repos.projects.create(USER, {
      name: "Toolkit",
      summary: "",
      source: "manual",
      importance: 3,
      includeByDefault: true,
      confirmed: false,
      tools: [],
      bullets: [],
      sortOrder: 0,
    });

    await expect(
      repos.projects.update(USER, created.id, { name: "Nope" }, 99),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it("locks the profile as well", async () => {
    const created = await repos.profiles.create(USER, {
      fullName: "Ada Lovelace",
      headline: "Engineer",
      summary: "",
      links: [],
    });

    await repos.profiles.update(USER, created.id, { headline: "Staff" }, 1);

    await expect(
      repos.profiles.update(USER, created.id, { headline: "Stale" }, 1),
    ).rejects.toBeInstanceOf(ConflictError);
  });
});
