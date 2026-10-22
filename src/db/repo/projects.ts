import { projects } from "@/db/schema";
import type { ProjectInput } from "@/lib/schemas";
import { and, asc, eq, sql } from "drizzle-orm";
import type { DbExecutor } from "@/db/client";
import { ConflictError } from "@/lib/errors";

/**
 * Data access for projects. Every function takes the owner id as its first
 * argument and filters on `user_id`, so one user can never read or write
 * another user's rows. Writes use an optimistic lock.
 */

export function createProjectsRepo(client: DbExecutor) {
  return {
    async list(userId: string) {
      return client
        .select()
        .from(projects)
        .where(eq(projects.userId, userId))
        .orderBy(asc(projects.sortOrder), asc(projects.createdAt));
    },
    async get(userId: string, id: string) {
      const rows = await client
        .select()
        .from(projects)
        .where(and(eq(projects.id, id), eq(projects.userId, userId)))
        .limit(1);
      return rows[0] ?? null;
    },
    async create(userId: string, input: ProjectInput) {
      const rows = await client
        .insert(projects)
        .values({
          userId,
          name: input.name,
          summary: input.summary,
          url: input.url ?? null,
          source: input.source,
          githubRepoId: input.githubRepoId ?? null,
          importance: input.importance,
          includeByDefault: input.includeByDefault,
          confirmed: input.confirmed,
          tools: input.tools,
          bullets: input.bullets,
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
      patch: Partial<ProjectInput>,
      version: number,
    ) {
      const rows = await client
        .update(projects)
        .set({
          ...(patch.name !== undefined ? { name: patch.name } : {}),
          ...(patch.summary !== undefined ? { summary: patch.summary } : {}),
          ...(patch.url !== undefined ? { url: patch.url ?? null } : {}),
          ...(patch.source !== undefined ? { source: patch.source } : {}),
          ...(patch.githubRepoId !== undefined
            ? { githubRepoId: patch.githubRepoId ?? null }
            : {}),
          ...(patch.importance !== undefined
            ? { importance: patch.importance }
            : {}),
          ...(patch.includeByDefault !== undefined
            ? { includeByDefault: patch.includeByDefault }
            : {}),
          ...(patch.confirmed !== undefined
            ? { confirmed: patch.confirmed }
            : {}),
          ...(patch.tools !== undefined ? { tools: patch.tools } : {}),
          ...(patch.bullets !== undefined ? { bullets: patch.bullets } : {}),
          ...(patch.startDate !== undefined
            ? { startDate: patch.startDate ?? null }
            : {}),
          ...(patch.endDate !== undefined ? { endDate: patch.endDate ?? null } : {}),
          ...(patch.sortOrder !== undefined
            ? { sortOrder: patch.sortOrder }
            : {}),
          version: sql`${projects.version} + 1`,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(projects.id, id),
            eq(projects.userId, userId),
            eq(projects.version, version),
          ),
        )
        .returning();
      if (rows.length === 0) throw new ConflictError();
      return rows[0];
    },
    async remove(userId: string, id: string) {
      const rows = await client
        .delete(projects)
        .where(and(eq(projects.id, id), eq(projects.userId, userId)))
        .returning({ id: projects.id });
      return rows.length > 0;
    },
  };
}
