import { experience } from "@/db/schema";
import type { ExperienceInput } from "@/lib/schemas";
import { and, asc, eq, sql } from "drizzle-orm";
import type { Db } from "@/db/client";
import { ConflictError } from "@/lib/errors";

/**
 * Data access for experience. Every function takes the owner id as its first
 * argument and filters on `user_id`, so one user can never read or write
 * another user's rows. Writes use an optimistic lock.
 */

export function createExperienceRepo(client: Db) {
  return {
    async list(userId: string) {
      return client
        .select()
        .from(experience)
        .where(eq(experience.userId, userId))
        .orderBy(asc(experience.sortOrder), asc(experience.createdAt));
    },
    async get(userId: string, id: string) {
      const rows = await client
        .select()
        .from(experience)
        .where(and(eq(experience.id, id), eq(experience.userId, userId)))
        .limit(1);
      return rows[0] ?? null;
    },
    async create(userId: string, input: ExperienceInput) {
      const rows = await client
        .insert(experience)
        .values({
          userId,
          company: input.company,
          title: input.title,
          location: input.location,
          employmentType: input.employmentType,
          startDate: input.startDate ?? null,
          endDate: input.endDate ?? null,
          isCurrent: input.isCurrent,
          description: input.description,
          bullets: input.bullets,
          sortOrder: input.sortOrder,
        })
        .returning();
      return rows[0];
    },
    async update(
      userId: string,
      id: string,
      patch: Partial<ExperienceInput>,
      version: number,
    ) {
      const rows = await client
        .update(experience)
        .set({
          ...(patch.company !== undefined ? { company: patch.company } : {}),
          ...(patch.title !== undefined ? { title: patch.title } : {}),
          ...(patch.location !== undefined ? { location: patch.location } : {}),
          ...(patch.employmentType !== undefined
            ? { employmentType: patch.employmentType }
            : {}),
          ...(patch.startDate !== undefined
            ? { startDate: patch.startDate ?? null }
            : {}),
          ...(patch.endDate !== undefined
            ? { endDate: patch.endDate ?? null }
            : {}),
          ...(patch.isCurrent !== undefined
            ? { isCurrent: patch.isCurrent }
            : {}),
          ...(patch.description !== undefined
            ? { description: patch.description }
            : {}),
          ...(patch.bullets !== undefined ? { bullets: patch.bullets } : {}),
          ...(patch.sortOrder !== undefined
            ? { sortOrder: patch.sortOrder }
            : {}),
          version: sql`${experience.version} + 1`,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(experience.id, id),
            eq(experience.userId, userId),
            eq(experience.version, version),
          ),
        )
        .returning();
      if (rows.length === 0) throw new ConflictError();
      return rows[0];
    },
    async remove(userId: string, id: string) {
      const rows = await client
        .delete(experience)
        .where(and(eq(experience.id, id), eq(experience.userId, userId)))
        .returning({ id: experience.id });
      return rows.length > 0;
    },
  };
}
