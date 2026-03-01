#!/usr/bin/env node
/**
 * db-rollback.js
 *
 * Rolls back the last applied D1 migration by:
 *   1. Querying d1_migrations to find the most recently applied migration
 *   2. Looking for a matching <name>.down.sql file in migrations/
 *   3. Applying that file to reverse the schema change
 *   4. Removing the migration record so wrangler treats it as unapplied
 *
 * Convention: for every migration you want to be reversible, create a paired
 * down file with the same base name:
 *   migrations/0001_init.sql       ← applied by wrangler (db:upgrade)
 *   migrations/0001_init.down.sql  ← applied by this script (db:rollback)
 *
 * Usage:
 *   node scripts/db-rollback.js           # local (default)
 *   node scripts/db-rollback.js --remote  # remote
 *
 * The DB name is read from the DB_NAME environment variable,
 * falling back to "project-starter". Update this when adopting the template.
 */

const { execSync } = require("child_process");
const { existsSync } = require("fs");
const { join } = require("path");

const remote = process.argv.includes("--remote");
const flag = remote ? "--remote" : "--local";
const db = process.env.DB_NAME || "project-starter";

// Query d1_migrations for the last applied migration
let lastMigration;
try {
  const raw = execSync(
    `wrangler d1 execute ${db} ${flag} --command="SELECT name FROM d1_migrations ORDER BY rowid DESC LIMIT 1" --json`,
    { encoding: "utf-8" }
  );
  const data = JSON.parse(raw);
  lastMigration = data[0]?.results?.[0]?.name;
} catch (err) {
  console.error("Failed to query migration state:", err.message);
  process.exit(1);
}

if (!lastMigration) {
  console.log("Nothing to roll back — no migrations have been applied.");
  process.exit(0);
}

// Find the paired down file
const baseName = lastMigration.replace(/\.sql$/i, "");
const downFile = join("migrations", `${baseName}.down.sql`);

if (!existsSync(downFile)) {
  console.error(`No down migration found for: ${lastMigration}`);
  console.error(`Expected: ${downFile}`);
  console.error(
    "Create that file to enable rollback for this migration."
  );
  process.exit(1);
}

console.log(`Rolling back: ${lastMigration}`);

// Apply the down migration
execSync(`wrangler d1 execute ${db} ${flag} --file=${downFile}`, {
  stdio: "inherit",
});

// Remove the migration record so wrangler considers it unapplied
execSync(
  `wrangler d1 execute ${db} ${flag} --command="DELETE FROM d1_migrations WHERE name = '${lastMigration}'"`,
  { stdio: "inherit" }
);

console.log(`Done — rolled back: ${lastMigration}`);
