import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');

  // If there's an error from Supabase (e.g., expired link), redirect to login
  if (error) {
    console.error('Auth callback error:', error);
    return NextResponse.redirect(new URL('/auth/login?error=' + error, request.url));
  }

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

    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (!exchangeError && data.session) {
      const cookieStore = await cookies();
      const maxAge = 60 * 60 * 24 * 7; // 7 days

      // Set session cookies so server pages and middleware can read them
      cookieStore.set('clat-at', data.session.access_token, {
        path: '/',
        maxAge,
        secure: true,
        sameSite: 'lax',
        httpOnly: false, // allow client-side JS to read for Supabase client
      });
      cookieStore.set('clat-rt', data.session.refresh_token, {
        path: '/',
        maxAge,
        secure: true,
        sameSite: 'lax',
        httpOnly: false,
      });

      // Also store the user ID for role checks
      const profile = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.session.user.id)
        .single();

      // Redirect based on role
      if (profile?.data?.role === 'admin') {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url));
      }
      return NextResponse.redirect(new URL('/student/dashboard', request.url));
    } else {
      console.error('Auth callback session exchange error:', exchangeError);
      return NextResponse.redirect(new URL('/auth/login?error=auth_exchange_failed', request.url));
    }
  }

  // No code present — just redirect to login
  return NextResponse.redirect(new URL('/auth/login', request.url));
}
