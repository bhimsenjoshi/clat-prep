import { createClient } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  const accessToken = request.cookies.get('clat-at')?.value;
  const clientSv = request.cookies.get('clat-sv')?.value;

  let user = null;
  let role: string | null = 'student';

  if (accessToken) {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data } = await supabase.auth.getUser(accessToken);
    user = data?.user ?? null;

    if (user && serviceKey) {
      const adminClient = createClient(supabaseUrl, serviceKey);
      const { data: profile } = await adminClient
        .from('profiles')
        .select('role, session_version')
        .eq('id', user.id)
        .single();

      role = profile?.role ?? 'student';

      // session_version check: if user has a clat-sv cookie, validate it against DB.
      // If cookie is missing entirely (fresh login / new user), allow through — don't force re-login.
      // Only force re-login when cookie exists but doesn't match DB (session invalidated).
      if (profile && clientSv) {
        const dbSv = profile.session_version ?? 0;
        if (Number(clientSv) !== dbSv) {
          const res = NextResponse.redirect(new URL('/auth/login', request.url));
          res.cookies.delete('clat-at');
          res.cookies.delete('clat-sv');
          return res;
        }
      }
    }
  }

  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/admin')) {
    if (!user) return NextResponse.redirect(new URL('/auth/login', request.url));
    if (role !== 'admin') return NextResponse.redirect(new URL('/student/dashboard', request.url));
  }

  if (pathname.startsWith('/student')) {
    if (!user) return NextResponse.redirect(new URL('/auth/login', request.url));
    if (role === 'admin') return NextResponse.redirect(new URL('/admin/dashboard', request.url));
  }

  if (pathname.startsWith('/auth') && user) {
    return NextResponse.redirect(
      new URL(role === 'admin' ? '/admin/dashboard' : '/student/dashboard', request.url)
    );
  }

  return NextResponse.next({ request });
}
