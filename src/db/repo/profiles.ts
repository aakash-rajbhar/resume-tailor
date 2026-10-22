import { profiles } from "@/db/schema";
import type { ProfileInput } from "@/lib/schemas";
import { and, eq, sql } from "drizzle-orm";
import type { Db } from "@/db/client";
import { ConflictError } from "@/lib/errors";

/**
 * Data access for profiles. Every function takes the owner id as its first
 * argument and filters on `user_id`, so one user can never read or write
 * another user's rows. Writes use an optimistic lock.
 */

export function createProfilesRepo(client: Db) {
  return {
    async get(userId: string) {
      const rows = await client
        .select()
        .from(profiles)
        .where(eq(profiles.userId, userId))
        .limit(1);
      return rows[0] ?? null;
    },
    async getById(userId: string, id: string) {
      const rows = await client
        .select()
        .from(profiles)
        .where(and(eq(profiles.id, id), eq(profiles.userId, userId)))
        .limit(1);
      return rows[0] ?? null;
    },
    async create(userId: string, input: ProfileInput) {
      const rows = await client
        .insert(profiles)
        .values({
          userId,
          fullName: input.fullName,
          headline: input.headline,
          summary: input.summary,
          email: input.email ?? null,
          phone: input.phone ?? null,
          location: input.location ?? null,
          links: input.links,
          githubUrl: input.githubUrl ?? null,
          linkedinUrl: input.linkedinUrl ?? null,
          portfolioUrl: input.portfolioUrl ?? null,
        })
        .returning();
      return rows[0];
    },
    async update(
      userId: string,
      id: string,
      patch: Partial<ProfileInput>,
      version: number,
    ) {
      const rows = await client
        .update(profiles)
        .set({
          ...(patch.fullName !== undefined ? { fullName: patch.fullName } : {}),
          ...(patch.headline !== undefined ? { headline: patch.headline } : {}),
          ...(patch.summary !== undefined ? { summary: patch.summary } : {}),
          ...(patch.email !== undefined ? { email: patch.email ?? null } : {}),
          ...(patch.phone !== undefined ? { phone: patch.phone ?? null } : {}),
          ...(patch.location !== undefined
            ? { location: patch.location ?? null }
            : {}),
          ...(patch.links !== undefined ? { links: patch.links } : {}),
          ...(patch.githubUrl !== undefined
            ? { githubUrl: patch.githubUrl ?? null }
            : {}),
          ...(patch.linkedinUrl !== undefined
            ? { linkedinUrl: patch.linkedinUrl ?? null }
            : {}),
          ...(patch.portfolioUrl !== undefined
            ? { portfolioUrl: patch.portfolioUrl ?? null }
            : {}),
          version: sql`${profiles.version} + 1`,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(profiles.id, id),
            eq(profiles.userId, userId),
            eq(profiles.version, version),
          ),
        )
        .returning();
      if (rows.length === 0) throw new ConflictError();
      return rows[0];
    },
    async remove(userId: string, id: string) {
      const rows = await client
        .delete(profiles)
        .where(and(eq(profiles.id, id), eq(profiles.userId, userId)))
        .returning({ id: profiles.id });
      return rows.length > 0;
    },
  };
}
