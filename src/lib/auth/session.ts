import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { users } from "@/db/schema";
import { UnauthorizedError } from "@/lib/errors";
import { auth } from "./index";

export interface SessionUser {
  id: string;
  name: string | null;
  email: string | null;
}

/** The signed-in user, or null. Does not touch the database. */
export async function getOptionalUser(): Promise<SessionUser | null> {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return null;
  return {
    id,
    name: session.user.name ?? null,
    email: session.user.email ?? null,
  };
}

/**
 * The signed-in user, guaranteed to still exist in the database. A session
 * cookie can outlive a deleted account, so the user row is checked by primary
 * key before any data is read or written.
 */
export async function requireUser(): Promise<SessionUser> {
  const user = await getOptionalUser();
  if (!user) throw new UnauthorizedError();

  const rows = await getDb()
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);

  if (rows.length === 0) {
    throw new UnauthorizedError("This account no longer exists.");
  }

  return user;
}
