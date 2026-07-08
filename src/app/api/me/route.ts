import { getServerUser, createAdminClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const { user, supabase } = await getServerUser();
  if (!user) {
    return NextResponse.json({ user: null, role: null }, { status: 401 });
  }

  // Use service_role key to query profile (bypasses RLS)
  const adminSupabase = createAdminClient();

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
