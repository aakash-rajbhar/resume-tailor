import { getDb, type Db } from "@/db/client";

import { createRepos, type Repos } from "./index";

/**
 * Runs a block inside one database transaction. The repositories are rebuilt
 * on the transaction handle, so every statement in the block either lands or
 * none of it does.
 *
 * The database can be passed in, which is how the tests run the same code
 * against an in-process Postgres.
 */
export async function withTransaction<T>(
  fn: (repos: Repos) => Promise<T>,
  db: Db = getDb(),
): Promise<T> {
  return db.transaction(async (tx) => fn(createRepos(tx)));
}
