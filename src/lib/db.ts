import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";

// Get the DATABASE_URL from environment variables
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// Create Neon serverless client
const sql = neon(databaseUrl);

// Create drizzle ORM instance
export const db = drizzle(sql);

// Export the neon client for raw queries if needed
export const neonClient = neon(databaseUrl);