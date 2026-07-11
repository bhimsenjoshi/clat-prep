import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendEmail } from '@/lib/email';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    const { student_id, new_plan } = await req.json() as {
      student_id: string;
      new_plan: 'free' | 'premium' | 'max';
    };

    if (!student_id || !new_plan) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
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

    // 3. Update subscription plan
    const { error: updateError } = await adminClient
      .from('profiles')
      .update({ subscription_plan: new_plan })
      .eq('id', student_id);

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update plan' }, { status: 500 });
    }

    // 4. Send email notification if promoted to Premium or Max
    if (new_plan !== 'free' && studentEmail) {
      const planName = new_plan === 'max' ? 'MAX Plan ✨' : 'PREMIUM Plan 🚀';
      const subject = `Your account has been upgraded to CLATly ${planName}!`;
      const html = `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #6366f1;">Congratulations ${studentName}! 🎉</h2>
          <p>Your CLATly account has been upgraded to <strong>${planName}</strong> by the administrator.</p>
          <p>This unlocks unlimited questions, advanced practice sets, and features tailored for your perfect CLAT prep journey!</p>
          <br />
          <a href="https://www.clatly.com/student/dashboard" style="background-color: #6366f1; color: white; padding: 10px 20px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Go to Dashboard</a>
          <br /><br />
          <p style="font-size: 11px; color: #999;">Best regards,<br />The CLATly Team</p>
        </div>
      `;
      await sendEmail({ to: studentEmail, subject, html });
    }

    return NextResponse.json({ success: true, message: `Plan updated to ${new_plan}` });
  } catch (err) {
    console.error('Update plan error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
