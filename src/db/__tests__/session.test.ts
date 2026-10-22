import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { setDbForTesting } from "@/db/client";
import { users } from "@/db/schema";
import { UnauthorizedError } from "@/lib/errors";
import { createTestDb } from "./helpers/pglite";
import type { Db } from "@/db/client";

const sessionUser = { id: "session-user" };

vi.mock("@/lib/auth", () => ({
  auth: async () => ({ user: sessionUser }),
  getAuth: () => ({ auth: async () => ({ user: sessionUser }) }),
}));

describe("requireUser", () => {
  let client: Awaited<ReturnType<typeof createTestDb>>["client"];
  let db: Db;

  beforeEach(async () => {
    const created = await createTestDb();
    client = created.client;
    db = created.db as unknown as Db;
    setDbForTesting(db);
  });

  afterEach(async () => {
    setDbForTesting(null);
    await client.close();
  });

  it("returns the session user when the row still exists", async () => {
    await db.insert(users).values({ id: sessionUser.id, name: "Session User" });

    const { requireUser } = await import("@/lib/auth/session");
    const user = await requireUser();

    expect(user.id).toBe(sessionUser.id);
  });

  it("rejects a session whose user row was deleted", async () => {
    const { requireUser } = await import("@/lib/auth/session");

    await expect(requireUser()).rejects.toBeInstanceOf(UnauthorizedError);
  });
});
