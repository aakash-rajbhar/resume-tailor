import { skills } from "@/db/schema";
import type { SkillInput } from "@/lib/schemas";
import { and, asc, eq, sql } from "drizzle-orm";
import type { DbExecutor } from "@/db/client";
import { ConflictError } from "@/lib/errors";

/**
 * Data access for skills. Every function takes the owner id as its first
 * argument and filters on `user_id`, so one user can never read or write
 * another user's rows. Writes use an optimistic lock.
 */

export function createSkillsRepo(client: DbExecutor) {
  return {
    async list(userId: string) {
      return client
        .select()
        .from(skills)
        .where(eq(skills.userId, userId))
        .orderBy(asc(skills.sortOrder), asc(skills.createdAt));
    },
    async get(userId: string, id: string) {
      const rows = await client
        .select()
        .from(skills)
        .where(and(eq(skills.id, id), eq(skills.userId, userId)))
        .limit(1);
      return rows[0] ?? null;
    },
    async create(userId: string, input: SkillInput) {
      const rows = await client
        .insert(skills)
        .values({
          userId,
          groupLabel: input.groupLabel,
          name: input.name,
          evidenceRefs: input.evidenceRefs,
          sortOrder: input.sortOrder,
        })
        .returning();
      return rows[0];
    },
    async update(
      userId: string,
      id: string,
      patch: Partial<SkillInput>,
      version: number,
    ) {
      const rows = await client
        .update(skills)
        .set({
          ...(patch.groupLabel !== undefined
            ? { groupLabel: patch.groupLabel }
            : {}),
          ...(patch.name !== undefined ? { name: patch.name } : {}),
          ...(patch.evidenceRefs !== undefined
            ? { evidenceRefs: patch.evidenceRefs }
            : {}),
          ...(patch.sortOrder !== undefined ? { sortOrder: patch.sortOrder } : {}),
          version: sql`${skills.version} + 1`,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(skills.id, id),
            eq(skills.userId, userId),
            eq(skills.version, version),
          ),
        )
        .returning();
      if (rows.length === 0) throw new ConflictError();
      return rows[0];
    },
    async remove(userId: string, id: string) {
      const rows = await client
        .delete(skills)
        .where(and(eq(skills.id, id), eq(skills.userId, userId)))
        .returning({ id: skills.id });
      return rows.length > 0;
    },
  };
}
