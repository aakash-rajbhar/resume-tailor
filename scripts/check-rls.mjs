#!/usr/bin/env node
/**
 * Verifies the database lockdown:
 *  - every table in the public schema has row level security enabled
 *  - no RLS policy was created (default deny for the public roles)
 *  - the `anon` and `authenticated` roles have no privileges on the tables
 *  - the app connection can still read and write (owner bypasses RLS)
 *
 * Usage: npm run db:check-rls
 */
import { existsSync, readFileSync } from "node:fs";
import postgres from "postgres";

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

const connectionString = process.env.DATABASE_URL?.trim();
if (!connectionString) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const sql = postgres(connectionString, { prepare: false, max: 1 });

const tables = await sql`
  select c.relname as name,
         c.relrowsecurity as rls,
         c.relforcerowsecurity as force_rls
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'r'
  order by c.relname
`;

const policies = await sql`
  select count(*)::int as count from pg_policies where schemaname = 'public'
`;

const role = await sql`
  select current_user as name, rolbypassrls as bypass, rolsuper as super
  from pg_roles where rolname = current_user
`;

const publicRoles = ["anon", "authenticated"];
const roleRows = await sql`
  select rolname as name from pg_roles where rolname = any(${publicRoles})
`;
const existingRoles = roleRows.map((row) => row.name);

let failed = false;

console.log("Table                       RLS   FORCE");
for (const table of tables) {
  const rls = table.rls ? "on " : "OFF";
  const force = table.force_rls ? "on " : "off";
  console.log(`${table.name.padEnd(28)} ${rls}   ${force}`);
  if (!table.rls) failed = true;
  if (table.force_rls) {
    console.error(`  ${table.name}: FORCE ROW LEVEL SECURITY would block the app's own connection.`);
    failed = true;
  }
}

console.log("");
console.log(
  `RLS policies in public: ${policies[0].count} (expected 0: the public roles are denied by default)`,
);
if (policies[0].count !== 0) failed = true;

console.log(
  `App connection role: ${role[0].name} (bypassrls=${role[0].bypass}, superuser=${role[0].super})`,
);
if (!role[0].bypass && !role[0].super) {
  console.error(
    "  The app role does not bypass RLS, so the app's own queries would return no rows.",
  );
  failed = true;
}

if (existingRoles.length > 0) {
  for (const publicRole of existingRoles) {
    const privileges = await sql`
      select c.relname as name,
             has_table_privilege(${publicRole}, c.relname, 'SELECT') as can_select,
             has_table_privilege(${publicRole}, c.relname, 'INSERT') as can_insert,
             has_table_privilege(${publicRole}, c.relname, 'UPDATE') as can_update,
             has_table_privilege(${publicRole}, c.relname, 'DELETE') as can_delete
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relkind = 'r'
      order by c.relname
    `;
    const granted = privileges.filter(
      (row) => row.can_select || row.can_insert || row.can_update || row.can_delete,
    );
    console.log(
      `Privileges for ${publicRole}: ${granted.length} table(s) (expected 0)`,
    );
    for (const row of granted) {
      console.error(`  ${publicRole} still has privileges on ${row.name}.`);
      failed = true;
    }
  }
} else {
  console.log(
    "Roles anon/authenticated do not exist on this database, so no grants could be checked.",
  );
}

await sql.end({ timeout: 5 });

if (failed) {
  console.error("\nRLS check failed.");
  process.exit(1);
}

console.log("\nRLS check passed.");
