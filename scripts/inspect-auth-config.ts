/**
 * Inspect Neon Auth project configuration columns/values without printing
 * secret-looking fields. Used to check trusted origins for deployment.
 */
import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const sql = neon(url);

async function main() {
  const columns = await sql`
    select column_name, data_type
    from information_schema.columns
    where table_schema = 'neon_auth' and table_name = 'project_config'
    order by ordinal_position
  `;
  console.log("project_config columns:");
  for (const column of columns) {
    console.log(`  ${column.column_name} (${column.data_type})`);
  }

  const rows = await sql`select * from neon_auth.project_config limit 5`;
  console.log(`\nrows: ${rows.length}`);
  for (const row of rows) {
    for (const [key, value] of Object.entries(row)) {
      if (/secret|password|key/i.test(key) && !/url/i.test(key)) {
        console.log(`  ${key}: [redacted]`);
      } else {
        console.log(`  ${key}: ${JSON.stringify(value)}`);
      }
    }
  }
}

main().catch((error) => {
  console.error("Inspect failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
