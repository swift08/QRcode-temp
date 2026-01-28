import { createClient } from '@supabase/supabase-js';

// Centralized Supabase admin client for all backend/server logic.
// Uses the service role key and should only be used in server-side code.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

