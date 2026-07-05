import { createClient } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  // Read auth tokens from custom cookies (set by browser client after sign-in)
  const accessToken = request.cookies.get('clat-at')?.value;
  const refreshToken = request.cookies.get('clat-rt')?.value;

  let user = null;
  if (accessToken) {
    // Verify the token with Supabase
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data } = await supabase.auth.getUser(accessToken);
    user = data?.user ?? null;
  }

  const { pathname } = request.nextUrl;

  // Protected routes → redirect to login if not authenticated
  if (!user && (pathname.startsWith('/admin') || pathname.startsWith('/student'))) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  // Auth page + logged in → redirect to admin dashboard
  if (user && pathname.startsWith('/auth')) {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url));
  }

  return NextResponse.next({ request });
}
