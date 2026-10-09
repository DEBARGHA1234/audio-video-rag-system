import mysql from "mysql2/promise";
import { createClient } from "@supabase/supabase-js";

if (process.env.SUPABASE_DATABASE_URL) {
  throw new Error("Refusing db:copy-users: SUPABASE_DATABASE_URL is set; the Postgres cutover has begun.");
}
if (process.env.CUTOVER_DONE === "1") {
  throw new Error("Refusing db:copy-users: CUTOVER_DONE=1 indicates the cutover is complete.");
}

const mysqlUrl = process.env.DATABASE_URL;
const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!mysqlUrl || !supabaseUrl || !serviceKey) {
  throw new Error("DATABASE_URL, SUPABASE_URL, and SUPABASE_SERVICE_ROLE_KEY are required");
}

const mysqlDb = await mysql.createConnection(mysqlUrl);
const [rows] = await mysqlDb.query(
  "select id, openId, name, email, loginMethod, role, createdAt, updatedAt, lastSignedIn from users order by id",
);
await mysqlDb.end();

const payload = rows.map(row => ({
  id: Number(row.id),
  open_id: String(row.openId),
  name: row.name ?? null,
  email: row.email ?? null,
  login_method: row.loginMethod ?? null,
  role: row.role === "admin" ? "admin" : "user",
  created_at: new Date(row.createdAt).toISOString(),
  updated_at: new Date(row.updatedAt).toISOString(),
  last_signed_in: new Date(row.lastSignedIn).toISOString(),
}));

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

if (payload.length > 0) {
  // Insert new identities only. Existing rows are left untouched by the conflict operation.
  const { error } = await supabase.from("users").upsert(payload, {
    onConflict: "open_id",
    ignoreDuplicates: true,
  });
  if (error) throw new Error(`Supabase users insert failed: ${error.message}`);

  // The only mutable fields this compatibility copy is allowed to refresh on rerun.
  for (const row of payload) {
    const { error: updateError } = await supabase
      .from("users")
      .update({ name: row.name, email: row.email, login_method: row.login_method })
      .eq("open_id", row.open_id);
    if (updateError) throw new Error(`Supabase users profile refresh failed: ${updateError.message}`);
  }
}

const { data, error } = await supabase.from("users").select("id, role").limit(1000);
if (error) throw new Error(`Supabase users verification failed: ${error.message}`);

console.log(JSON.stringify({
  source_rows: payload.length,
  destination_rows: data?.length ?? 0,
  destination_admins: data?.filter(row => row.role === "admin").length ?? 0,
  idempotency_key: "open_id",
  conflict_updates: ["name", "email", "login_method"],
  protected_on_conflict: ["role", "created_at", "updated_at", "last_signed_in"],
}));
