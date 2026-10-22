/**
 * Read-only diagnostic for the configured database.
 * Prints schema/table names and row counts for key tables. Never prints the
 * connection string.
 */
import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const sql = neon(url);

async function main() {
  const tables = await sql`
    select table_schema, table_name
    from information_schema.tables
    where table_schema in ('public', 'neon_auth', 'drizzle')
    order by table_schema, table_name
  `;

  const publicTables = tables.filter((row) => row.table_schema === "public");
  const authTables = tables.filter((row) => row.table_schema === "neon_auth");
  const drizzleTables = tables.filter((row) => row.table_schema === "drizzle");

  console.log(`public tables: ${publicTables.length}`);
  console.log(publicTables.map((row) => row.table_name).join(", ") || "(none)");
  console.log(`\nneon_auth tables: ${authTables.length}`);
  console.log(authTables.map((row) => row.table_name).join(", ") || "(none)");
  console.log(`\ndrizzle tables: ${drizzleTables.length}`);
  console.log(drizzleTables.map((row) => row.table_name).join(", ") || "(none)");

  const known = ["profiles", "opportunities", "projects", "events", "media_posts"];
  for (const table of known) {
    if (!publicTables.some((row) => row.table_name === table)) continue;
    const result = await sql.query(`select count(*)::int as count from "${table}"`);
    console.log(`${table}: ${result[0]?.count ?? "?"} rows`);
  }
}

main().catch((error) => {
  console.error("Database check failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
