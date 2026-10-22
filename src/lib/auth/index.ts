import NextAuth from "next-auth";
import { createAuthConfig } from "./config";

let instance: ReturnType<typeof NextAuth> | null = null;

/**
 * Builds the Auth.js instance on first use. Nothing is created at import
 * time, so the app keeps working when the database is not configured.
 */
export function getAuth() {
  if (!instance) instance = NextAuth(createAuthConfig());
  return instance;
}

/** Reads the current session (null when signed out). */
export async function auth() {
  return (await getAuth()).auth();
}
