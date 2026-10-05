import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

export function getSupabase() {
  if (client) return client;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Supabase server configuration is missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  }
  client = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
    db: { schema: "public" },
  });
  return client;
}

export const CONTEXTCORE_WORKSPACE_ID = "00000000-0000-0000-0000-000000000001";

export function requireData<T>(result: { data: T | null; error: { message: string } | null }, operation: string): T {
  if (result.error) throw new Error(`${operation} failed: ${result.error.message}`);
  if (result.data === null) throw new Error(`${operation} returned no data.`);
  return result.data;
}

export function requireMutation(result: { error: { message: string } | null }, operation: string) {
  if (result.error) throw new Error(`${operation} failed: ${result.error.message}`);
}
