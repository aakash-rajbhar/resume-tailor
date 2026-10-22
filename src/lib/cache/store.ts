import { getDb, isDatabaseConfigured } from "@/db/client";
import { isAuthEnabled } from "@/lib/auth/feature";
import { llmCache as fileCache, type CacheStore } from "../cache";
import { createDbCacheStore } from "./dbCacheStore";

export type CachePurpose = "jd-extract" | "tailor";

export interface CacheStoreMeta {
  model?: string;
  promptVersion?: string;
}

/**
 * Picks the cache store for a purpose.
 *
 * - `jd-extract` uses the database when the Master Profile is enabled, so the
 *   extracted job description is shared instead of re-extracted.
 * - `tailor` always uses the file store: the tailored resume contains the
 *   candidate's name and contact details and must never be shared.
 */
export function cacheStoreFor(
  purpose: CachePurpose,
  meta: CacheStoreMeta = {},
): CacheStore {
  if (
    purpose === "jd-extract" &&
    isAuthEnabled() &&
    isDatabaseConfigured()
  ) {
    return createDbCacheStore(getDb(), {
      purpose,
      model: meta.model,
      promptVersion: meta.promptVersion,
    });
  }
  return fileCache;
}
