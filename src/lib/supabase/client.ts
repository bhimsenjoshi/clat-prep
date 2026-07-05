import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Browser-side Supabase client.
 * Session is stored in localStorage by default.
 * After sign-in, the access token is also saved to a cookie so the
 * server/middleware can read it during the next page load.
 */
export function createClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

/**
 * Persist the current Supabase session to a cookie so the server can read it.
 * Call this after sign-in, before navigating to a new page.
 */
export async function persistSessionToCookie(supabase: SupabaseClient) {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    const maxAge = 60 * 60 * 24 * 7;
    document.cookie = `clat-at=${session.access_token}; path=/; max-age=${maxAge}; Secure; SameSite=Lax`;
    document.cookie = `clat-rt=${session.refresh_token}; path=/; max-age=${maxAge}; Secure; SameSite=Lax`;
  }
}
