import { and, eq } from "drizzle-orm";
import type { Db } from "@/db/client";
import { accounts } from "@/db/schema";
import { decryptSecret, isEncryptedValue } from "@/lib/crypto";

/**
 * Account rows hold the OAuth tokens. They are encrypted at rest and only
 * ever decrypted on the server, for server-side GitHub calls.
 */
export function createAccountsRepo(client: Db) {
  return {
    async listForUser(userId: string) {
      return client.select().from(accounts).where(eq(accounts.userId, userId));
    },
    /**
     * The decrypted GitHub access token. Server-side only: no API route may
     * return this value.
     */
    async getGithubToken(userId: string): Promise<string | null> {
      const rows = await client
        .select()
        .from(accounts)
        .where(
          and(eq(accounts.userId, userId), eq(accounts.provider, "github")),
        )
        .limit(1);

      const token = rows[0]?.access_token;
      if (!token) return null;
      if (!isEncryptedValue(token)) {
        throw new Error("Stored access token is not encrypted.");
      }
      return decryptSecret(token);
    },
  };
}
