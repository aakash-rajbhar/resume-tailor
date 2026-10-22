import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { sql } from "drizzle-orm";
import { createTestDb } from "./helpers/pglite";

const EXPECTED_TABLES = [
  "accounts",
  "certifications",
  "education",
  "experience",
  "jobs",
  "llm_cache",
  "profiles",
  "projects",
  "sessions",
  "skills",
  "users",
  "verification_tokens",
  "verified_facts",
];

describe("database migrations", () => {
  let client: Awaited<ReturnType<typeof createTestDb>>["client"];
  let db: Awaited<ReturnType<typeof createTestDb>>["db"];

  beforeAll(async () => {
    const created = await createTestDb();
    client = created.client;
    db = created.db;
  });

  afterAll(async () => {
    await client.close();
  });

  it("creates every table", async () => {
    const rows = await db.execute<{ table_name: string }>(
      sql`select table_name from information_schema.tables where table_schema = 'public'`,
    );

    const names = rows.rows.map((row) => row.table_name);
    for (const table of EXPECTED_TABLES) {
      expect(names).toContain(table);
    }
  });

  it("enables row level security on every table", async () => {
    const rows = await db.execute<{
      relname: string;
      relrowsecurity: boolean;
      relforcerowsecurity: boolean;
    }>(
      sql`select c.relname, c.relrowsecurity, c.relforcerowsecurity
          from pg_class c
          join pg_namespace n on n.oid = c.relnamespace
          where n.nspname = 'public' and c.relkind = 'r'
          order by c.relname`,
    );

    expect(rows.rows.length).toBe(EXPECTED_TABLES.length);
    for (const row of rows.rows) {
      expect(row.relrowsecurity, `${row.relname} must have RLS`).toBe(true);
      // FORCE would also block the app's own owner connection.
      expect(row.relforcerowsecurity).toBe(false);
    }
  });

  it("creates no RLS policies", async () => {
    const rows = await db.execute<{ count: number }>(
      sql`select count(*)::int as count from pg_policies where schemaname = 'public'`,
    );

    expect(rows.rows[0].count).toBe(0);
  });

  it("revokes all privileges from anon and authenticated", async () => {
    for (const role of ["anon", "authenticated"]) {
      for (const table of EXPECTED_TABLES) {
        const rows = await db.execute<{ has_access: boolean }>(
          sql`select has_table_privilege(${role}, ${table}, 'SELECT') as has_access`,
        );
        expect(rows.rows[0].has_access, `${role} must not read ${table}`).toBe(
          false,
        );
      }
    }
  });
});
