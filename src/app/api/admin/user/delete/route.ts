import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendEmail } from '@/lib/email';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
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

    // 2. Fetch the target student profile to get email and name before deletion
    const { data: targetProfile, error: fetchError } = await adminClient
      .from('profiles')
      .select('full_name, email')
      .eq('id', student_id)
      .single();

    if (fetchError || !targetProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // 3. Delete user from auth.users (cascades to profiles and responses depending on foreign keys, but let's delete them cleanly)
    // Delete profile first to satisfy any strict foreign keys
    await adminClient
      .from('profiles')
      .delete()
      .eq('id', student_id);

    // Delete auth user via Admin Auth API
    const { error: deleteAuthError } = await adminClient.auth.admin.deleteUser(student_id);

    if (deleteAuthError) {
      console.error('Auth deletion error:', deleteAuthError);
      return NextResponse.json({ error: 'Failed to delete user from authentication database' }, { status: 500 });
    }

    // 4. Send account deletion notification email
    if (targetProfile.email) {
      const subject = `Your CLATly account has been closed`;
      const html = `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #dc2626;">Account Closed</h2>
          <p>Hello ${targetProfile.full_name || 'there'},</p>
          <p>We are writing to inform you that your CLATly account has been closed by the administrator.</p>
          <p>Your subscription has been canceled, and all your practice data has been permanently deleted from our servers in compliance with our data retention policy.</p>
          <p>Thank you for trying out CLATly, and we wish you the best in your future endeavors!</p>
          <br />
          <p style="font-size: 11px; color: #999;">Best regards,<br />The CLATly Team</p>
        </div>
      `;
      await sendEmail({ to: targetProfile.email, subject, html });
    }

    return NextResponse.json({ success: true, message: 'User deleted successfully' });
  } catch (err) {
    console.error('Delete user error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
