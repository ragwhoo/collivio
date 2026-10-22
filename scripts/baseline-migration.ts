/**
 * One-time baseline for a database whose schema was created with
 * `drizzle-kit push` before migration files existed.
 *
 * It records the baseline migration as already applied WITHOUT executing it,
 * so `drizzle-kit migrate` becomes a safe no-op for this database and future
 * migrations apply normally.
 *
 * Run: npx tsx --env-file=.env.production.local scripts/baseline-migration.ts
 */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const sql = neon(url);

type Journal = {
  entries: Array<{ idx: number; when: number; tag: string }>;
};

async function main() {
  const journal = JSON.parse(
    readFileSync("drizzle/meta/_journal.json", "utf8"),
  ) as Journal;

  if (!journal.entries.length) {
    console.log("No migrations in journal; nothing to baseline.");
    return;
  }

  await sql`create schema if not exists drizzle`;
  await sql`
    create table if not exists drizzle.__drizzle_migrations (
      id serial primary key,
      hash text not null,
      created_at bigint
    )
  `;

  for (const entry of journal.entries) {
    const query = readFileSync(`drizzle/${entry.tag}.sql`, "utf8");
    const hash = createHash("sha256").update(query).digest("hex");

    const existing = await sql`
      select id from drizzle.__drizzle_migrations where hash = ${hash} limit 1
    `;
    if (existing.length) {
      console.log(`already recorded: ${entry.tag}`);
      continue;
    }

    await sql`
      insert into drizzle.__drizzle_migrations (hash, created_at)
      values (${hash}, ${entry.when})
    `;
    console.log(`baselined: ${entry.tag}`);
  }

  const rows = await sql`
    select hash, created_at from drizzle.__drizzle_migrations order by created_at
  `;
  console.log(`migration rows: ${rows.length}`);
}

main().catch((error) => {
  console.error("Baseline failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
