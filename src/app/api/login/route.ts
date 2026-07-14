import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { email, password } = await request.json();
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  // Query role + session count
  const adminSupabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );

  const { data: profile } = await adminSupabase
    .from('profiles')
    .select('role, session_version')
    .eq('id', data.user.id)
    .single();

  // Allow up to 2 concurrent sessions. session_version cycles 1→2→1→2...
  // Each login picks the next slot, bumping the oldest session in that slot.
  const currentVersion = profile?.session_version ?? 0;
  const newVersion = currentVersion >= 2 ? 1 : currentVersion + 1;

  await adminSupabase
    .from('profiles')
    .update({ session_version: newVersion })
    .eq('id', data.user.id);

  // Store session_version so middleware can check it
  cookieStore.set('clat-sv', String(newVersion), {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });

  const role = profile?.role === 'admin' ? 'admin' : 'student';
  const redirectTo = role === 'admin' ? '/admin/dashboard' : '/student/dashboard';

  return NextResponse.json({
    success: true,
    redirectTo,
    role,
  });
}
