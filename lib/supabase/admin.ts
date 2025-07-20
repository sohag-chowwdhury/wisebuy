// lib/supabase/admin.ts

import { createClient } from "@supabase/supabase-js";
import { Database } from "@/types/supabase";

// Admin client - only use server-side!
export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
