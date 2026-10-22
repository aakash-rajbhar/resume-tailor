/**
 * Feature flag for the Master Profile architecture. When it is off, the app
 * keeps the anonymous, single-user flow exactly as it was: no session, no
 * database and no file cache changes.
 */
export function isAuthEnabled(): boolean {
  return process.env.ENABLE_AUTH === "true";
}
