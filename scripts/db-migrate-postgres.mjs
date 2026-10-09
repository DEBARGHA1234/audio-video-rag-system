import { execFileSync } from "node:child_process";

const url = process.env.SUPABASE_DATABASE_URL ?? "";
if (!/^postgres(?:ql)?:\/\//i.test(url)) {
  throw new Error("Refusing db:pg:migrate: SUPABASE_DATABASE_URL must be a postgres:// or postgresql:// URL.");
}

execFileSync("drizzle-kit", ["migrate", "--config=drizzle.postgres.config.ts"], { stdio: "inherit" });
