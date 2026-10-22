import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { getDb, isDatabaseConfigured, setDbForTesting } from "@/db/client";
import { cacheStoreFor } from "@/lib/cache/store";
import { llmCache as fileCache } from "@/lib/cache";
import { createTestDb } from "./helpers/pglite";
import { eq } from "drizzle-orm";
import { llmCache } from "@/db/schema";
import type { Db } from "@/db/client";

describe("database client", () => {
  const originalUrl = process.env.DATABASE_URL;

  afterEach(() => {
    setDbForTesting(null);
    if (originalUrl === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = originalUrl;
    delete process.env.ENABLE_AUTH;
  });

  it("does not require DATABASE_URL when imported", async () => {
    delete process.env.DATABASE_URL;
    process.env.ENABLE_AUTH = "false";
    const clientModule = await import("@/db/client");

    expect(clientModule.isDatabaseConfigured()).toBe(false);
    expect(() => clientModule.getDb()).toThrow(/DATABASE_URL/);
  });

  it("keeps the anonymous flow working with no database configured", async () => {
    delete process.env.DATABASE_URL;
    process.env.ENABLE_AUTH = "false";

    // No store is built, so nothing tries to reach a database.
    expect(cacheStoreFor("jd-extract")).toBe(fileCache);
    expect(cacheStoreFor("tailor")).toBe(fileCache);
    expect(() => getDb()).toThrow(/DATABASE_URL/);
  });

  it("reports whether a connection string is configured", () => {
    process.env.DATABASE_URL = "postgres://localhost:5432/db";
    expect(isDatabaseConfigured()).toBe(true);
  });

  it("builds the repository singleton on first use", async () => {
    const { getRepos } = await import("@/db/repo");
    const created = await createTestDb();
    setDbForTesting(created.db as unknown as Db);

    const repos = getRepos();
    expect(repos).toBe(getRepos());
    expect(repos.profiles.get).toBeTypeOf("function");
    expect(repos.users.exists).toBeTypeOf("function");

    await created.client.close();
  });
});

describe("cache store selection", () => {
  afterEach(() => {
    delete process.env.ENABLE_AUTH;
    delete process.env.DATABASE_URL;
  });

  it("uses the file store when the Master Profile is off", () => {
    process.env.ENABLE_AUTH = "false";
    process.env.DATABASE_URL = "postgres://localhost:5432/db";

    expect(cacheStoreFor("jd-extract")).toBe(fileCache);
    expect(cacheStoreFor("tailor")).toBe(fileCache);
  });

  it("keeps the tailored resume on the file store", () => {
    process.env.ENABLE_AUTH = "true";
    process.env.DATABASE_URL = "postgres://localhost:5432/db";

    expect(cacheStoreFor("tailor")).toBe(fileCache);
  });

  it("uses the database store for extraction when enabled", () => {
    process.env.ENABLE_AUTH = "true";
    process.env.DATABASE_URL = "postgres://localhost:5432/db";

    expect(cacheStoreFor("jd-extract")).not.toBe(fileCache);
  });
});

describe("database cache store", () => {
  let client: Awaited<ReturnType<typeof createTestDb>>["client"];
  let db: Db;

  beforeEach(async () => {
    const created = await createTestDb();
    client = created.client;
    db = created.db as unknown as Db;
  });

  afterEach(async () => {
    await client.close();
  });

  it("stores, reads and expires entries behind the CacheStore interface", async () => {
    const { createDbCacheStore } = await import("@/lib/cache/dbCacheStore");
    const store = createDbCacheStore(db, {
      purpose: "jd-extract",
      model: "gemini-test",
      promptVersion: "v1",
    });

    expect(await store.get("missing")).toBeNull();

    await store.set("key-1", { required_skills: ["TypeScript"] });
    expect(await store.get("key-1")).toEqual({ required_skills: ["TypeScript"] });

    const rows = await db.select().from(llmCache).where(eq(llmCache.key, "key-1"));
    expect(rows).toHaveLength(1);
    expect(rows[0].purpose).toBe("jd-extract");
    expect(rows[0].model).toBe("gemini-test");
    expect(rows[0].promptVersion).toBe("v1");
    expect(rows[0].expiresAt).not.toBeNull();

    // Expired rows are ignored and removed.
    await db
      .update(llmCache)
      .set({ expiresAt: new Date(Date.now() - 1000) })
      .where(eq(llmCache.key, "key-1"));
    expect(await store.get("key-1")).toBeNull();
    const after = await db.select().from(llmCache).where(eq(llmCache.key, "key-1"));
    expect(after).toHaveLength(0);
  });

  it("only clears expired rows because the cache is shared", async () => {
    const { createDbCacheStore } = await import("@/lib/cache/dbCacheStore");
    const store = createDbCacheStore(db, { purpose: "jd-extract" });

    await store.set("fresh", { a: 1 });
    await db
      .insert(llmCache)
      .values({
        key: "stale",
        purpose: "jd-extract",
        payload: { a: 1 },
        expiresAt: new Date(Date.now() - 1000),
      });

    await store.clear();

    const rows = await db.select().from(llmCache);
    expect(rows.map((row) => row.key)).toEqual(["fresh"]);
  });
});
