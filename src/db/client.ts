import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export type Db = PostgresJsDatabase<typeof schema>;

let client: ReturnType<typeof postgres> | null = null;
let database: Db | null = null;

/**
 * The pooler caps the number of backend connections, so keep the runtime pool
 * small (1-3). `prepare: false` is required by the Supabase transaction
 * pooler, which does not support prepared statements.
 */
const POOL_MAX = 3;

/** Creates a postgres client tuned for the Supabase transaction pooler. */
function createClient(connectionString: string) {
  return postgres(connectionString, {
    prepare: false,
    max: POOL_MAX,
    idle_timeout: 20,
    connect_timeout: 10,
    onnotice: () => {},
  });
}

/**
 * Lazily creates the database client. Importing this module never requires
 * `DATABASE_URL` to be set, so the anonymous flow keeps working when the
 * database is not configured at all.
 */
export function getDb(): Db {
  if (database) return database;

  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set.");
  }

  client = createClient(connectionString);
  database = drizzle(client, { schema });
  return database;
}

/** True when a database connection string is configured. */
export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

export async function closeDb(): Promise<void> {
  if (client) {
    await client.end({ timeout: 5 });
  }
  client = null;
  database = null;
}

/** Test helper: swaps in an in-process database (PGlite) for the session. */
export function setDbForTesting(next: Db | null): void {
  database = next;
}
