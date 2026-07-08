import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );
}

/**
 * Fallback: try to verify a user from a Bearer token or clat-at cookie.
 * This handles the case where the browser refreshed the session (via refreshSession)
 * updating clat-at but leaving the default Supabase cookies stale.
 */
export async function getServerUser() {
  const supabase = await createServerSupabaseClient();
  const cookieStore = await cookies();

  // 1. Try default cookie-based auth first
  const { data: { user } } = await supabase.auth.getUser();
  if (user) return { user, supabase };

  // 2. Fallback: try clat-at cookie (custom cookie set by persistSessionToCookie)
  const clatAt = cookieStore.get('clat-at')?.value;
  if (clatAt) {
    const { data: { user: tokenUser } } = await supabase.auth.getUser(clatAt);
    if (tokenUser) return { user: tokenUser, supabase };
  }

  return { user: null, supabase };
}

/**
 * Server client with the service-role key — bypasses RLS.
 * Only use in admin API routes / server actions.
 */
export function createAdminClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll: () => [],
        setAll: () => {},
      },
    }
  );
}
