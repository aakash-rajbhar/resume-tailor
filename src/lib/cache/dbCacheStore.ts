import { eq, lt } from "drizzle-orm";
import type { Db } from "@/db/client";
import { llmCache } from "@/db/schema";
import type { CacheStore } from "../cache";

export interface DbCacheStoreOptions {
  purpose: string;
  model?: string;
  promptVersion?: string;
  ttlDays?: number;
}

/**
 * Database-backed implementation of the cache store. It keeps the same
 * `CacheStore` interface as the file store, so callers do not change.
 *
 * Rows are shared across users and are keyed by a hash of the request, so
 * they must never contain personal data, resume text or credentials: only the
 * extracted job-description structure is stored.
 */
export function createDbCacheStore(
  client: Db,
  options: DbCacheStoreOptions,
): CacheStore {
  const ttlMs = (options.ttlDays ?? 30) * 24 * 60 * 60 * 1000;

  return {
    async get<T>(key: string): Promise<T | null> {
      const rows = await client
        .select()
        .from(llmCache)
        .where(eq(llmCache.key, key))
        .limit(1);

      const row = rows[0];
      if (!row) return null;

      if (row.expiresAt && row.expiresAt.getTime() <= Date.now()) {
        await client.delete(llmCache).where(eq(llmCache.key, key));
        return null;
      }

      return row.payload as T;
    },

    async set<T>(key: string, value: T): Promise<void> {
      const expiresAt = new Date(Date.now() + ttlMs);
      await client
        .insert(llmCache)
        .values({
          key,
          purpose: options.purpose,
          model: options.model ?? "",
          promptVersion: options.promptVersion ?? "",
          payload: value as never,
          expiresAt,
        })
        .onConflictDoUpdate({
          target: llmCache.key,
          set: {
            payload: value as never,
            expiresAt,
            createdAt: new Date(),
          },
        });
    },

    async delete(key: string): Promise<void> {
      await client.delete(llmCache).where(eq(llmCache.key, key));
    },

    async clear(): Promise<void> {
      // The cache is shared across users, so only expired rows are removed.
      await client.delete(llmCache).where(lt(llmCache.expiresAt, new Date()));
    },
  };
}
