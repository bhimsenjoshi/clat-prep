import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function AuthRedirectPage() {
  const cookieStore = await cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  // Read access token from our custom cookie
  const accessToken = cookieStore.get('clat-at')?.value;

  if (!accessToken) {
    redirect('/auth/login');
  }

  // Verify the token
  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data: { user } } = await supabase.auth.getUser(accessToken);

  if (!user) {
    redirect('/auth/login');
  }

  // Check role with service_role key
  if (serviceKey) {
    const adminClient = createClient(supabaseUrl, serviceKey);
    const { data: profile } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role === 'admin') {
      redirect('/admin/dashboard');
    }
  }

  redirect('/student/dashboard');
}
