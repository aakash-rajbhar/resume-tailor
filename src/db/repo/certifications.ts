import { certifications } from "@/db/schema";
import type { CertificationInput } from "@/lib/schemas";
import { and, asc, eq, sql } from "drizzle-orm";
import type { Db } from "@/db/client";
import { ConflictError } from "@/lib/errors";

/**
 * Data access for certifications. Every function takes the owner id as its first
 * argument and filters on `user_id`, so one user can never read or write
 * another user's rows. Writes use an optimistic lock.
 */

export function createCertificationsRepo(client: Db) {
  return {
    async list(userId: string) {
      return client
        .select()
        .from(certifications)
        .where(eq(certifications.userId, userId))
        .orderBy(asc(certifications.sortOrder), asc(certifications.createdAt));
    },
    async get(userId: string, id: string) {
      const rows = await client
        .select()
        .from(certifications)
        .where(
          and(
            eq(certifications.id, id),
            eq(certifications.userId, userId),
          ),
        )
        .limit(1);
      return rows[0] ?? null;
    },
    async create(userId: string, input: CertificationInput) {
      const rows = await client
        .insert(certifications)
        .values({
          userId,
          name: input.name,
          issuer: input.issuer,
          issuedOn: input.issuedOn ?? null,
          url: input.url ?? null,
          sortOrder: input.sortOrder,
        })
        .returning();
      return rows[0];
    },
    async update(
      userId: string,
      id: string,
      patch: Partial<CertificationInput>,
      version: number,
    ) {
      const rows = await client
        .update(certifications)
        .set({
          ...(patch.name !== undefined ? { name: patch.name } : {}),
          ...(patch.issuer !== undefined ? { issuer: patch.issuer } : {}),
          ...(patch.issuedOn !== undefined
            ? { issuedOn: patch.issuedOn ?? null }
            : {}),
          ...(patch.url !== undefined ? { url: patch.url ?? null } : {}),
          ...(patch.sortOrder !== undefined ? { sortOrder: patch.sortOrder } : {}),
          version: sql`${certifications.version} + 1`,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(certifications.id, id),
            eq(certifications.userId, userId),
            eq(certifications.version, version),
          ),
        )
        .returning();
      if (rows.length === 0) throw new ConflictError();
      return rows[0];
    },
    async remove(userId: string, id: string) {
      const rows = await client
        .delete(certifications)
        .where(
          and(eq(certifications.id, id), eq(certifications.userId, userId)),
        )
        .returning({ id: certifications.id });
      return rows.length > 0;
    },
  };
}
