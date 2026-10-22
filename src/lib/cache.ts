import { createHash } from "node:crypto";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { logger } from "./logger";

export interface CacheStore {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
}

export interface CacheResult<T> {
  value: T;
  cached: boolean;
}

const BULLET_CHARS = /[•‣⁃∙▪◦·‧●○⁃]/g;
const DASH_CHARS = /[–—−―]/g;

/**
 * Normalizes text so that cosmetic differences (bullet glyphs, dashes,
 * whitespace runs, unicode forms) never change a cache key.
 */
export function cleanTextForHash(text: string): string {
  if (!text) return "";
  return text
    .normalize("NFKC")
    .replace(BULLET_CHARS, "-")
    .replace(DASH_CHARS, "-")
    .replace(/\s+/g, " ")
    .trim();
}

/** Stable sha256 key over already-cleaned parts. */
export function hashKey(...parts: string[]): string {
  const hash = createHash("sha256");
  for (const part of parts) {
    hash.update(part);
    hash.update("\u0000");
  }
  return hash.digest("hex");
}

interface CacheEnvelope<T> {
  key: string;
  createdAt: string;
  value: T;
}

/**
 * File-backed cache. Lives under .cache/ (gitignored) and is swappable for a
 * database table later: only the CacheStore interface is used by callers.
 */
export function createFileCacheStore(directory: string): CacheStore {
  const safeKey = (key: string) => key.replace(/[^a-zA-Z0-9_-]/g, "");

  return {
    async get<T>(key: string): Promise<T | null> {
      try {
        const raw = await readFile(
          path.join(directory, `${safeKey(key)}.json`),
          "utf8",
        );
        const parsed = JSON.parse(raw) as CacheEnvelope<T>;
        return parsed?.value ?? null;
      } catch {
        return null;
      }
    },

    async set<T>(key: string, value: T): Promise<void> {
      const file = path.join(directory, `${safeKey(key)}.json`);
      const temp = `${file}.${process.pid}.tmp`;
      try {
        await mkdir(directory, { recursive: true });
        const envelope: CacheEnvelope<T> = {
          key,
          createdAt: new Date().toISOString(),
          value,
        };
        await writeFile(temp, JSON.stringify(envelope), "utf8");
        await rename(temp, file);
      } catch (error) {
        await rm(temp, { force: true }).catch(() => {});
        logger.warn("cache write failed", {
          error: error instanceof Error ? error.message : "unknown",
        });
      }
    },

    async delete(key: string): Promise<void> {
      try {
        await rm(path.join(directory, `${safeKey(key)}.json`), { force: true });
      } catch {
        /* ignore */
      }
    },

    async clear(): Promise<void> {
      try {
        const { readdir } = await import("node:fs/promises");
        const entries = await readdir(directory);
        await Promise.all(
          entries
            .filter((name) => name.endsWith(".json"))
            .map((name) => rm(path.join(directory, name), { force: true })),
        );
      } catch {
        /* ignore */
      }
    },
  };
}

export const llmCache: CacheStore = createFileCacheStore(
  path.join(process.cwd(), ".cache", "llm"),
);

/** Reads through the cache, storing successful results. */
export async function withCache<T>(
  key: string,
  producer: () => Promise<T>,
  store: CacheStore = llmCache,
): Promise<CacheResult<T>> {
  const hit = await store.get<T>(key);
  if (hit !== null && hit !== undefined) {
    return { value: hit, cached: true };
  }
  const value = await producer();
  await store.set(key, value);
  return { value, cached: false };
}
