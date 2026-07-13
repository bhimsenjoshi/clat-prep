import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendEmail } from '@/lib/email';
import { cookies } from 'next/headers';

// ─── Simple in-memory rate limiter ───
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
function checkRateLimit(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= maxRequests) return false;
  entry.count++;
  return true;
}

export async function POST(req: NextRequest) {
  try {
    // Rate limit: max 5 requests per minute per IP
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    if (!checkRateLimit(`admin-delete:${ip}`, 5, 60_000)) {
      return NextResponse.json({ error: 'Rate limited. Try again in a minute.' }, { status: 429 });
    }

    const { student_id } = await req.json() as {
      student_id: string;
    };

    if (!student_id) {
      return NextResponse.json({ error: 'Missing student ID' }, { status: 400 });
    }

    // 1. Verify admin privilege via service_role check
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('clat-at')?.value;
    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: { user } } = await supabase.auth.getUser(accessToken);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminClient = createClient(supabaseUrl, serviceKey);
    const { data: adminProfile } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (adminProfile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Prevent admin from deleting themselves
    if (user.id === student_id) {
      return NextResponse.json({ error: 'You cannot delete your own admin account!' }, { status: 400 });
    }

    // 2. Fetch the target student from Admin Auth API to get email
    const { data: authUserData, error: authFetchError } = await adminClient.auth.admin.getUserById(student_id);
    if (authFetchError || !authUserData?.user) {
      console.error('Auth fetch error:', authFetchError);
      return NextResponse.json({ error: 'User not found in authentication database' }, { status: 404 });
    }

    const studentEmail = authUserData.user.email;

    // Fetch the display name from profiles (without selecting the email column, which might not exist)
    const { data: targetProfile } = await adminClient
      .from('profiles')
      .select('full_name')
      .eq('id', student_id)
      .single();

    const studentName = targetProfile?.full_name || 'there';

    // 3. Delete all foreign key references first, then profile, then auth user
    // Order matters to avoid FK constraint violations

    // 3a. Delete any tests created by this user (tests_created_by_fkey)
    const { data: userTests } = await adminClient
      .from('tests')
      .select('id')
      .eq('created_by', student_id);
    if (userTests && userTests.length > 0) {
      const testIds = userTests.map((t: any) => t.id);
      console.log(`Deleting ${testIds.length} tests created by user`);
      const { error: delTests } = await adminClient
        .from('tests')
        .delete()
        .in('id', testIds);
      if (delTests) console.error('Error deleting user tests:', delTests);
    }

    // 3b. Delete any upgrade_log entries for this user
    await adminClient
      .from('upgrade_log')
      .delete()
      .eq('user_id', student_id);

    // 3c. Delete user responses/attempts
    await adminClient
      .from('attempts')
      .delete()
      .eq('student_id', student_id);

    // 3d. Now delete the profile
    const { error: profileDeleteError } = await adminClient
      .from('profiles')
      .delete()
      .eq('id', student_id);
    if (profileDeleteError) {
      console.error('Profile deletion error:', profileDeleteError);
      return NextResponse.json({ error: 'Failed to delete user profile. Please try again.' }, { status: 500 });
    }

    // 3e. Delete auth user via Admin Auth API
    const { error: deleteAuthError } = await adminClient.auth.admin.deleteUser(student_id);

    if (deleteAuthError) {
      console.error('Auth deletion error:', deleteAuthError);
      return NextResponse.json({ error: 'Profile deleted but failed to revoke login. Auth error: ' + deleteAuthError.message }, { status: 500 });
    }

    // 4. Send account deletion notification email
    if (studentEmail) {
      const subject = `Your CLATly account has been closed`;
      const html = `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #dc2626;">Account Closed</h2>
          <p>Hello ${studentName},</p>
          <p>We are writing to inform you that your CLATly account has been closed by the administrator.</p>
          <p>Your subscription has been canceled, and all your practice data has been permanently deleted from our servers in compliance with our data retention policy.</p>
          <p>Thank you for trying out CLATly, and we wish you the best in your future endeavors!</p>
          <br />
          <p style="font-size: 11px; color: #999;">Best regards,<br />The CLATly Team</p>
        </div>
      `;
      await sendEmail({ to: studentEmail, subject, html });
    }

    return NextResponse.json({ success: true, message: 'User deleted successfully' });
  } catch (err) {
    console.error('Delete user error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
