import { execFileSync } from "node:child_process";

const url = process.env.DATABASE_URL ?? "";
if (!/^mysql(?:2)?:\/\//i.test(url)) {
  throw new Error("Refusing db:migrate: DATABASE_URL must be a mysql:// or mysql2:// URL.");
}
if (process.env.SUPABASE_DATABASE_URL) {
  throw new Error("Refusing db:migrate: SUPABASE_DATABASE_URL is set. Use pnpm db:pg:migrate for Postgres.");
}

execFileSync("drizzle-kit", ["migrate"], { stdio: "inherit" });
