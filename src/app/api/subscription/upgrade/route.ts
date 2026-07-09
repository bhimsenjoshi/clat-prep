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
 */
export async function POST(_req: NextRequest) {
  try {
    const { user, supabase } = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use service role for admin operations
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const admin = createClient(supabaseUrl, serviceKey);

    // Fetch user's current plan
    const { data: profile, error: profileErr } = await admin
      .from('profiles')
      .select('subscription_plan, is_promo_user, promo_claimed_at')
      .eq('id', user.id)
      .single();

    if (profileErr || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // ── Campaign validation ──

    // 1. Must currently be on 'free' plan
    if (profile.subscription_plan !== 'free') {
      return NextResponse.json({
        error: 'Already upgraded',
        message: profile.subscription_plan === 'premium'
          ? 'You already have Premium access!'
          : 'You already have Max access!',
        plan: profile.subscription_plan,
      }, { status: 400 });
    }

    // 2. Must be within campaign period (July 2026)
    const now = new Date();
    const campaignEnd = new Date('2026-07-31T23:59:59Z');
    if (now > campaignEnd) {
      return NextResponse.json({
        error: 'Campaign ended',
        message: 'The free upgrade campaign ended on July 31, 2026. Check back for new offers!',
      }, { status: 400 });
    }

    // 3. Count current promo users (first 20 cap)
    const { count: promoCount, error: countErr } = await admin
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('is_promo_user', true)
      .eq('subscription_plan', 'premium');

    if (countErr) {
      console.error('Failed to count promo users:', countErr);
      return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }

    const remainingSlots = 20 - (promoCount ?? 0);
    if (remainingSlots <= 0) {
      return NextResponse.json({
        error: 'Campaign full',
        message: 'Sorry, all 20 promo slots have been claimed! Stay tuned for more offers.',
      }, { status: 400 });
    }

    // ── Perform upgrade ──
    const { error: updateErr } = await admin
      .from('profiles')
      .update({
        subscription_plan: 'premium',
        is_promo_user: true,
        promo_claimed_at: now.toISOString(),
      })
      .eq('id', user.id);

    if (updateErr) {
      console.error('Upgrade failed:', updateErr);
      return NextResponse.json({ error: 'Upgrade failed' }, { status: 500 });
    }

    // ── Audit log (DPDP compliance: immutable trail) ──
    const { error: logErr } = await admin
      .from('upgrade_log')
      .insert({
        user_id: user.id,
        from_plan: 'free',
        to_plan: 'premium',
        upgrade_type: 'promo_campaign',
        campaign_remaining: remainingSlots - 1,
      });

    if (logErr) {
      // Log failure is non-fatal — upgrade already succeeded
      console.error('Audit log insertion failed:', logErr);
    }

    return NextResponse.json({
      success: true,
      plan: 'premium',
      message: '🎉 You\'ve been upgraded to Premium!',
      campaign_slots_remaining: remainingSlots - 1,
    });

  } catch (err) {
    console.error('Upgrade error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
