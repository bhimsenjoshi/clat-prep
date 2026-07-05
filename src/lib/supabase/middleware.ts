import { createClient } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  // Read auth token from cookie (set by client after sign-in)
  const accessToken = request.cookies.get('clat-at')?.value;

  let user = null;
  let role: string | null = 'student';

  if (accessToken) {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data } = await supabase.auth.getUser(accessToken);
    user = data?.user ?? null;

    // Check role via service_key (bypasses RLS)
    if (user && serviceKey) {
      const adminClient = createClient(supabaseUrl, serviceKey);
      const { data: profile } = await adminClient
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      role = profile?.role ?? 'student';
    }
  }

  const { pathname } = request.nextUrl;

  // Protected admin routes → redirect to login or student dash
  if (pathname.startsWith('/admin')) {
    if (!user) return NextResponse.redirect(new URL('/auth/login', request.url));
    if (role !== 'admin') return NextResponse.redirect(new URL('/student/dashboard', request.url));
  }

  // Protected student routes → redirect to login or admin dash
  if (pathname.startsWith('/student')) {
    if (!user) return NextResponse.redirect(new URL('/auth/login', request.url));
    if (role === 'admin') return NextResponse.redirect(new URL('/admin/dashboard', request.url));
  }

  // Auth pages → redirect logged-in users to their dashboard
  if (pathname.startsWith('/auth') && user) {
    return NextResponse.redirect(
      new URL(role === 'admin' ? '/admin/dashboard' : '/student/dashboard', request.url)
    );
  }

  return NextResponse.next({ request });
}
