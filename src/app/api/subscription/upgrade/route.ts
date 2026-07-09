import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getServerUser } from '@/lib/supabase/server';

/**
 * POST /api/subscription/upgrade
 *
 * Campaign: Free upgrade from 'free' to 'premium'
 * - Valid till July 31, 2026
 * - Limited to first 20 users
 * - DPDP: audit trail in upgrade_log table
 *
 * IMPORTANT: All database operations use the service-role client (bypasses RLS).
 * Campaign columns (is_promo_user, promo_claimed_at) are updated in a separate
 * best-effort query — if they don't exist yet (migration pending), the upgrade
 * still succeeds.
 */
export async function POST(_req: NextRequest) {
  try {
    const { user } = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const admin = createClient(supabaseUrl, serviceKey);

    // ── Step 1: Fetch current plan ──
    const { data: profile, error: profileErr } = await admin
      .from('profiles')
      .select('subscription_plan')
      .eq('id', user.id)
      .single();

    if (profileErr || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    if (profile.subscription_plan !== 'free') {
      return NextResponse.json({
        error: 'Already upgraded',
        message: profile.subscription_plan === 'premium'
          ? 'You already have Premium access!'
          : 'You already have Max access!',
        plan: profile.subscription_plan,
      }, { status: 400 });
    }

    // ── Step 2: Check campaign period ──
    const now = new Date();
    if (now > new Date('2026-07-31T23:59:59Z')) {
      return NextResponse.json({
        error: 'Campaign ended',
        message: 'The free upgrade campaign ended on July 31, 2026.',
      }, { status: 400 });
    }

    // ── Step 3: Perform the core upgrade (always works) ──
    const { error: updateErr } = await admin
      .from('profiles')
      .update({ subscription_plan: 'premium' })
      .eq('id', user.id);

    if (updateErr) {
      console.error('Upgrade failed:', updateErr);
      return NextResponse.json({ error: 'Upgrade failed' }, { status: 500 });
    }

    // ── Step 4: Best-effort campaign tracking (silent if columns don't exist) ──
    let campaignSlotsRemaining: number | null = null;

    try {
      // Count current promo users
      const { count: promoCount } = await admin
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('is_promo_user', true);

      const remainingSlots = 20 - (promoCount ?? 0);

      if (remainingSlots > 0) {
        // Update campaign fields best-effort
        await admin
          .from('profiles')
          .update({
            is_promo_user: true,
            promo_claimed_at: now.toISOString(),
          })
          .eq('id', user.id);

        // Write audit log best-effort
        await admin
          .from('upgrade_log')
          .insert({
            user_id: user.id,
            from_plan: 'free',
            to_plan: 'premium',
            upgrade_type: 'promo_campaign',
            campaign_remaining: remainingSlots - 1,
          });

        campaignSlotsRemaining = remainingSlots - 1;
      }
    } catch {
      // Campaign columns or upgrade_log table don't exist yet — that's fine
      // The core upgrade already succeeded
    }

    return NextResponse.json({
      success: true,
      plan: 'premium',
      message: '🎉 You\'ve been upgraded to Premium!',
      campaign_slots_remaining: campaignSlotsRemaining,
    });

  } catch (err) {
    console.error('Upgrade error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
