import { describe, expect, it, beforeAll, afterAll, beforeEach } from "vitest";
import { eq } from "drizzle-orm";
import { createTestDb } from "./helpers/pglite";
import { createEncryptingAdapter } from "@/lib/auth/adapter";
import { accounts, users } from "@/db/schema";
import { isEncryptedValue } from "@/lib/crypto";
import type { Db } from "@/db/client";

const PLAINTEXT_TOKEN = "gho_16C7e42F292c6912E7710c838347Ae178B4a";
const USER = "adapter-user";

describe("encrypting adapter", () => {
  let client: Awaited<ReturnType<typeof createTestDb>>["client"];
  let db: Db;

  beforeAll(async () => {
    const created = await createTestDb();
    client = created.client;
    db = created.db as unknown as Db;
  });

  afterAll(async () => {
    await client.close();
  });

  beforeEach(() => {
    process.env.TOKEN_ENCRYPTION_KEY = "c".repeat(64);
  });

  it("stores the OAuth token encrypted, never in plaintext", async () => {
    await db.insert(users).values({ id: USER, name: "Adapter User" });

    const adapter = createEncryptingAdapter(db);
    await adapter.linkAccount!({
      userId: USER,
      type: "oauth",
      provider: "github",
      providerAccountId: "github-123",
      access_token: PLAINTEXT_TOKEN,
      refresh_token: PLAINTEXT_TOKEN,
      id_token: PLAINTEXT_TOKEN,
      token_type: "bearer",
      scope: "read:user user:email",
    });

    const rows = await db.select().from(accounts).where(eq(accounts.provider, "github"));
    expect(rows).toHaveLength(1);

    const row = rows[0];
    expect(row.access_token).not.toBe(PLAINTEXT_TOKEN);
    expect(row.access_token).not.toContain(PLAINTEXT_TOKEN);
    expect(isEncryptedValue(row.access_token ?? "")).toBe(true);
    expect(isEncryptedValue(row.refresh_token ?? "")).toBe(true);
    expect(isEncryptedValue(row.id_token ?? "")).toBe(true);

    // The ciphertext can be decrypted back to the original token.
    const { decryptSecret } = await import("@/lib/crypto");
    expect(decryptSecret(row.access_token ?? "")).toBe(PLAINTEXT_TOKEN);
  });
});
