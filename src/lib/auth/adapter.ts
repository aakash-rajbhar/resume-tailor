import { DrizzleAdapter } from "@auth/drizzle-adapter";
import type { Adapter } from "next-auth/adapters";
import type { Db } from "@/db/client";
import { getDb } from "@/db/client";
import {
  accountsTable,
  sessionsTable,
  usersTable,
  verificationTokensTable,
} from "@/db/schema";
import { encryptSecret } from "@/lib/crypto";

/**
 * Auth.js writes OAuth tokens to the `accounts` table in plaintext. The
 * adapter's `linkAccount` is the only write path for those tokens
 * (@auth/core calls it from lib/actions/callback/handle-login.js, before the
 * `linkAccount` event fires), so encrypting there guarantees no plaintext
 * token is ever persisted.
 */
export function createEncryptingAdapter(client: Db): Adapter {
  const base = DrizzleAdapter(client, {
    usersTable: usersTable,
    accountsTable: accountsTable,
    sessionsTable: sessionsTable,
    verificationTokensTable: verificationTokensTable,
  });

  return {
    ...base,
    async linkAccount(account) {
      await base.linkAccount!({
        ...account,
        access_token: account.access_token
          ? encryptSecret(account.access_token)
          : undefined,
        refresh_token: account.refresh_token
          ? encryptSecret(account.refresh_token)
          : undefined,
        id_token: account.id_token
          ? encryptSecret(account.id_token)
          : undefined,
      });
    },
  };
}

let cached: Adapter | null = null;

/** Lazily built so importing this module never requires a database. */
export function getEncryptingAdapter(): Adapter {
  if (!cached) cached = createEncryptingAdapter(getDb());
  return cached;
}
