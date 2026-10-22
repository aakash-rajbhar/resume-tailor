import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import * as schema from "@/db/schema";

/**
 * In-process Postgres for tests. The real generated migrations are applied, so
 * the tests exercise the same DDL (including RLS) that runs in production.
 */
export async function createTestDb() {
  const client = new PGlite();

  // Supabase ships these roles; the revoke migration targets them.
  await client.exec("CREATE ROLE anon; CREATE ROLE authenticated;");

  const dir = path.join(process.cwd(), "migrations");
  const files = readdirSync(dir)
    .filter((file) => file.endsWith(".sql"))
    .sort();

  for (const file of files) {
    await client.exec(readFileSync(path.join(dir, file), "utf8"));
  }

  const db = drizzle(client, { schema });
  return { client, db };
}

/** Creates a user row the repositories can own rows with. */
export async function createTestUser(
  db: ReturnType<typeof drizzle<typeof schema>>,
  id: string,
) {
  await db.insert(schema.users).values({ id, name: `User ${id}` });
  return id;
}
