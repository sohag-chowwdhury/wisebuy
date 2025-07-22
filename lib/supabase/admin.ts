// lib/supabase/admin.ts

import { createClient } from "@supabase/supabase-js";
import { Database } from "@/types/supabase";

// Validate environment variables
console.log('🔧 [ADMIN] Checking Supabase environment variables...');
console.log('🔧 [ADMIN] SUPABASE_URL exists:', !!process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('🔧 [ADMIN] SERVICE_ROLE_KEY exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('❌ Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('❌ Missing SUPABASE_SERVICE_ROLE_KEY environment variable - check your .env file');
}

console.log('✅ [ADMIN] Supabase admin client configured successfully');

// Admin client - only use server-side!
export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
