import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const redirectUrl = new URL('/auth/redirect', request.url);

  if (code) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    });

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.session) {
      const cookieStore = await cookies();
      const maxAge = 60 * 60 * 24 * 7; // 7 days

      // Set session cookies so server pages and middleware can read them
      cookieStore.set('clat-at', data.session.access_token, {
        path: '/',
        maxAge,
        secure: true,
        sameSite: 'lax',
      });
      cookieStore.set('clat-rt', data.session.refresh_token, {
        path: '/',
        maxAge,
        secure: true,
        sameSite: 'lax',
      });
    } else {
      console.error('Auth callback session exchange error:', error);
      // If code exchange fails, send them back to login with error
      return NextResponse.redirect(new URL('/auth/login?error=auth_exchange_failed', request.url));
    }
  }

  // URL redirect page handles routing based on user role (Admin vs Student)
  return NextResponse.redirect(redirectUrl);
}
