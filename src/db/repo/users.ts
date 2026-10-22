import { eq } from "drizzle-orm";
import type { DbExecutor } from "@/db/client";
import { users } from "@/db/schema";

export function createUsersRepo(client: DbExecutor) {
  return {
    /** True when the user row still exists. */
    async exists(userId: string) {
      const rows = await client
        .select({ id: users.id })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      return rows.length > 0;
    },
  };
}
