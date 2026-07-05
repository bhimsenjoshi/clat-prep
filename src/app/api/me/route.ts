import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  const cookieStore = await cookies();

  // Get the authenticated user via cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    }
  );

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return NextResponse.json({ user: null, role: null }, { status: 401 });
  }

  // Use service_role key to query profile (bypasses RLS)
  const adminSupabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );

  const { data: profile } = await adminSupabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single();

  return NextResponse.json({
    user: { id: user.id, email: user.email },
    role: profile?.role ?? 'student',
    fullName: profile?.full_name ?? '',
  });
}
