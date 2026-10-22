import { jobs } from "@/db/schema";
import type { JobInput, JobUpdate } from "@/lib/schemas";
import { and, desc, eq, sql } from "drizzle-orm";
import type { Db } from "@/db/client";
import { ConflictError } from "@/lib/errors";

/**
 * Data access for jobs. Every function takes the owner id as its first
 * argument and filters on `user_id`, so one user can never read or write
 * another user's rows. Writes use an optimistic lock.
 */

export function createJobsRepo(client: Db) {
  return {
    async list(userId: string) {
      return client
        .select()
        .from(jobs)
        .where(eq(jobs.userId, userId))
        .orderBy(desc(jobs.createdAt));
    },
    async get(userId: string, id: string) {
      const rows = await client
        .select()
        .from(jobs)
        .where(and(eq(jobs.id, id), eq(jobs.userId, userId)))
        .limit(1);
      return rows[0] ?? null;
    },
    async create(userId: string, input: JobInput) {
      const rows = await client
        .insert(jobs)
        .values({
          userId,
          company: input.company,
          title: input.title,
          jdText: input.jdText,
          status: input.status,
        })
        .returning();
      return rows[0];
    },
    async update(
      userId: string,
      id: string,
      patch: JobUpdate,
      version: number,
    ) {
      const rows = await client
        .update(jobs)
        .set({
          ...(patch.company !== undefined ? { company: patch.company } : {}),
          ...(patch.title !== undefined ? { title: patch.title } : {}),
          ...(patch.status !== undefined ? { status: patch.status } : {}),
          ...(patch.parsedJd !== undefined ? { parsedJd: patch.parsedJd } : {}),
          ...(patch.selection !== undefined
            ? { selection: patch.selection }
            : {}),
          ...(patch.answers !== undefined ? { answers: patch.answers } : {}),
          ...(patch.resume !== undefined ? { resume: patch.resume } : {}),
          ...(patch.modelUsed !== undefined
            ? { modelUsed: patch.modelUsed ?? null }
            : {}),
          ...(patch.scoreBefore !== undefined
            ? { scoreBefore: patch.scoreBefore ?? null }
            : {}),
          ...(patch.scoreAfter !== undefined
            ? { scoreAfter: patch.scoreAfter ?? null }
            : {}),
          version: sql`${jobs.version} + 1`,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(jobs.id, id),
            eq(jobs.userId, userId),
            eq(jobs.version, version),
          ),
        )
        .returning();
      if (rows.length === 0) throw new ConflictError();
      return rows[0];
    },
    async remove(userId: string, id: string) {
      const rows = await client
        .delete(jobs)
        .where(and(eq(jobs.id, id), eq(jobs.userId, userId)))
        .returning({ id: jobs.id });
      return rows.length > 0;
    },
  };
}
