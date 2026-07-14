import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const username = req.nextUrl.searchParams.get('username')?.trim().toLowerCase();

    if (!username) {
      return NextResponse.json({ error: 'Missing username parameter' }, { status: 400 });
    }

    // Validate format: only letters, numbers, underscores, 3-20 chars
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      return NextResponse.json({
        valid: false,
        available: false,
        error: 'Username must be 3-20 characters (letters, numbers, underscores only)',
      });
    }

    const supabase = await createServerSupabaseClient();

    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', '@' + username)
      .maybeSingle();

    if (error) throw error;

    return NextResponse.json({
      valid: true,
      available: !data,
      error: null,
    });
  } catch (err: any) {
    console.error('Username check error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
