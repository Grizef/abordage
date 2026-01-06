import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing Supabase service role environment variables");
}

// Client with service role key for server-side operations (bypasses RLS)
export const supabaseServer = createClient(supabaseUrl, supabaseServiceKey);
