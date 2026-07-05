import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} },
    }
  );

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  // Check env vars (don't leak the actual key, just existence)
  const envCheck = {
    supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    supabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
  };

  if (!user) {
    return NextResponse.json({
      loggedIn: false,
      userError: userError?.message,
      env: envCheck,
      cookies: cookieStore.getAll().map(c => c.name),
    });
  }

  // Query with service role
  const adminSupabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );

  const { data: profile, error: profileError } = await adminSupabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  return NextResponse.json({
    loggedIn: true,
    userId: user.id,
    email: user.email,
    env: envCheck,
    profileRole: profile?.role ?? null,
    profileError: profileError?.message ?? null,
    profileRaw: profile,
  });
}
