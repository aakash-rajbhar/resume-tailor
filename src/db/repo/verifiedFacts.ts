import { verifiedFacts } from "@/db/schema";
import type { VerifiedFactInput } from "@/lib/schemas";
import { and, asc, eq, sql } from "drizzle-orm";
import type { DbExecutor } from "@/db/client";
import { ConflictError } from "@/lib/errors";

/**
 * Data access for verifiedFacts. Every function takes the owner id as its first
 * argument and filters on `user_id`, so one user can never read or write
 * another user's rows. Writes use an optimistic lock.
 */

export function createVerifiedFactsRepo(client: DbExecutor) {
  return {
    async list(userId: string) {
      return client
        .select()
        .from(verifiedFacts)
        .where(eq(verifiedFacts.userId, userId))
        .orderBy(asc(verifiedFacts.createdAt));
    },
    async get(userId: string, id: string) {
      const rows = await client
        .select()
        .from(verifiedFacts)
        .where(and(eq(verifiedFacts.id, id), eq(verifiedFacts.userId, userId)))
        .limit(1);
      return rows[0] ?? null;
    },
    async getByQuestionKey(userId: string, questionKey: string) {
      const rows = await client
        .select()
        .from(verifiedFacts)
        .where(
          and(
            eq(verifiedFacts.userId, userId),
            eq(verifiedFacts.questionKey, questionKey),
          ),
        )
        .limit(1);
      return rows[0] ?? null;
    },
    async create(userId: string, input: VerifiedFactInput) {
      const rows = await client
        .insert(verifiedFacts)
        .values({
          userId,
          questionKey: input.questionKey,
          question: input.question,
          answer: input.answer,
          answerType: input.answerType,
          status: input.status,
          source: input.source,
          jobId: input.jobId ?? null,
        })
        .returning();
      return rows[0];
    },
    async update(
      userId: string,
      id: string,
      patch: Partial<VerifiedFactInput>,
      version: number,
    ) {
      const rows = await client
        .update(verifiedFacts)
        .set({
          ...(patch.questionKey !== undefined
            ? { questionKey: patch.questionKey }
            : {}),
          ...(patch.question !== undefined ? { question: patch.question } : {}),
          ...(patch.answer !== undefined ? { answer: patch.answer } : {}),
          ...(patch.answerType !== undefined
            ? { answerType: patch.answerType }
            : {}),
          ...(patch.status !== undefined ? { status: patch.status } : {}),
          ...(patch.source !== undefined ? { source: patch.source } : {}),
          ...(patch.jobId !== undefined ? { jobId: patch.jobId ?? null } : {}),
          version: sql`${verifiedFacts.version} + 1`,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(verifiedFacts.id, id),
            eq(verifiedFacts.userId, userId),
            eq(verifiedFacts.version, version),
          ),
        )
        .returning();
      if (rows.length === 0) throw new ConflictError();
      return rows[0];
    },
    async remove(userId: string, id: string) {
      const rows = await client
        .delete(verifiedFacts)
        .where(and(eq(verifiedFacts.id, id), eq(verifiedFacts.userId, userId)))
        .returning({ id: verifiedFacts.id });
      return rows.length > 0;
    },
  };
}
