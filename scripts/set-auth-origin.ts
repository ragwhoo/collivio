/**
 * Adds the production origin to Neon Auth's trusted origins.
 * Run: npx tsx --env-file=.env.production.local scripts/set-auth-origin.ts https://example.com
 */
import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL;
const origin = process.argv[2];

if (!url) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}
if (!origin || !/^https?:\/\//.test(origin)) {
  console.error("Usage: tsx scripts/set-auth-origin.ts https://your-origin");
  process.exit(1);
}

const normalized = origin.replace(/\/+$/, "");
const sql = neon(url);

async function main() {
  const rows = await sql`
    select id, trusted_origins from neon_auth.project_config limit 1
  `;
  if (!rows.length) {
    console.error("No neon_auth.project_config row found.");
    process.exit(1);
  }

  const config = rows[0];
  const current = Array.isArray(config.trusted_origins)
    ? (config.trusted_origins as string[])
    : [];

  if (current.includes(normalized)) {
    console.log(`Origin already trusted: ${normalized}`);
    return;
  }

  const next = [...current, normalized];
  await sql`
    update neon_auth.project_config
    set trusted_origins = ${JSON.stringify(next)}::jsonb,
        updated_at = now()
    where id = ${config.id}
  `;

  console.log(`Trusted origins now: ${next.join(", ")}`);
}

main().catch((error) => {
  console.error("Update failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
