import { defineConfig } from "drizzle-kit";
import { existsSync, readFileSync } from "node:fs";

/**
 * drizzle-kit bundles dotenv but only reads `.env`. The app keeps its secrets
 * in `.env.local`, so the values are loaded here before the config is built.
 */
for (const file of [".env.local", ".env"]) {
  if (!existsSync(file)) continue;
  for (const line of readFileSync(file, "utf8").split("\n")) {
    const match = /^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key] !== undefined) continue;
    process.env[key] = rawValue.replace(/^["']|["']$/g, "");
  }
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./migrations",
  // Migrations run against the direct connection; the runtime uses the pooler.
  dbCredentials: { url: process.env.DIRECT_URL ?? "" },
  strict: true,
  verbose: true,
});
