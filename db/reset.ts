import { config } from "dotenv";
config({ path: ".env.local" });

import { Pool } from "pg";

/**
 * Drops and recreates the public schema, then runs migrations.
 * Local/dev only — does not seed data.
 */
async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  const pool = new Pool({ connectionString });
  console.log("Resetting public schema…");
  await pool.query("DROP SCHEMA IF EXISTS public CASCADE");
  await pool.query("DROP SCHEMA IF EXISTS drizzle CASCADE");
  await pool.query("CREATE SCHEMA public");
  await pool.query("GRANT ALL ON SCHEMA public TO public");
  await pool.end();

  const { spawnSync } = await import("child_process");
  const result = spawnSync("npx", ["tsx", "db/migrate.ts"], {
    stdio: "inherit",
    cwd: process.cwd(),
    env: process.env,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
