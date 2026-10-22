import { education } from "@/db/schema";
import type { EducationInput } from "@/lib/schemas";
import { and, asc, eq, sql } from "drizzle-orm";
import type { DbExecutor } from "@/db/client";
import { ConflictError } from "@/lib/errors";

/**
 * Data access for education. Every function takes the owner id as its first
 * argument and filters on `user_id`, so one user can never read or write
 * another user's rows. Writes use an optimistic lock.
 */

export function createEducationRepo(client: DbExecutor) {
  return {
    async list(userId: string) {
      return client
        .select()
        .from(education)
        .where(eq(education.userId, userId))
        .orderBy(asc(education.sortOrder), asc(education.createdAt));
    },
    async get(userId: string, id: string) {
      const rows = await client
        .select()
        .from(education)
        .where(and(eq(education.id, id), eq(education.userId, userId)))
        .limit(1);
      return rows[0] ?? null;
    },
    async create(userId: string, input: EducationInput) {
      const rows = await client
        .insert(education)
        .values({
          userId,
          school: input.school,
          degree: input.degree,
          fieldOfStudy: input.fieldOfStudy,
          startDate: input.startDate ?? null,
          endDate: input.endDate ?? null,
          sortOrder: input.sortOrder,
        })
        .returning();
      return rows[0];
    },
    async update(
      userId: string,
      id: string,
      patch: Partial<EducationInput>,
      version: number,
    ) {
      const rows = await client
        .update(education)
        .set({
          ...(patch.school !== undefined ? { school: patch.school } : {}),
          ...(patch.degree !== undefined ? { degree: patch.degree } : {}),
          ...(patch.fieldOfStudy !== undefined
            ? { fieldOfStudy: patch.fieldOfStudy }
            : {}),
          ...(patch.startDate !== undefined
            ? { startDate: patch.startDate ?? null }
            : {}),
          ...(patch.endDate !== undefined ? { endDate: patch.endDate ?? null } : {}),
          ...(patch.sortOrder !== undefined ? { sortOrder: patch.sortOrder } : {}),
          version: sql`${education.version} + 1`,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(education.id, id),
            eq(education.userId, userId),
            eq(education.version, version),
          ),
        )
        .returning();
      if (rows.length === 0) throw new ConflictError();
      return rows[0];
    },
    async remove(userId: string, id: string) {
      const rows = await client
        .delete(education)
        .where(and(eq(education.id, id), eq(education.userId, userId)))
        .returning({ id: education.id });
      return rows.length > 0;
    },
  };
}
