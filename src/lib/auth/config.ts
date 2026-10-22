import GitHub from "next-auth/providers/github";
import type { NextAuthConfig } from "next-auth";
import { getEncryptingAdapter } from "./adapter";

const THIRTY_DAYS = 30 * 24 * 60 * 60;

/**
 * Auth.js v5 configuration.
 *
 * - The session strategy is JWT: the cookie only carries the user id and
 *   display fields, never a provider token.
 * - `trustHost` comes from AUTH_TRUST_HOST instead of being hard-coded, so
 *   the deployment decides whether the host header is trusted.
 */
export function createAuthConfig(): NextAuthConfig {
  return {
    adapter: getEncryptingAdapter(),
    providers: [
      GitHub({
        clientId: process.env.AUTH_GITHUB_ID,
        clientSecret: process.env.AUTH_GITHUB_SECRET,
        authorization: {
          params: { scope: "read:user user:email" },
        },
      }),
    ],
    session: {
      strategy: "jwt",
      maxAge: THIRTY_DAYS,
    },
    trustHost: process.env.AUTH_TRUST_HOST === "true",
    pages: {
      signIn: "/login",
    },
    callbacks: {
      async jwt({ token, user }) {
        if (user) {
          token.sub = user.id;
          token.name = user.name;
          token.email = user.email;
          token.picture = user.image;
        }
        // Whitelist: nothing from the OAuth account is copied into the token.
        return {
          sub: token.sub,
          name: token.name,
          email: token.email,
          picture: token.picture,
        };
      },
      async session({ session, token }) {
        const user: {
          id: string;
          name?: string | null;
          email?: string | null;
          image?: string | null;
        } = session.user;
        user.id = token.sub ?? "";
        user.name = token.name ?? null;
        user.email = token.email ?? null;
        user.image = token.picture ?? null;
        return session;
      },
    },
  };
}
