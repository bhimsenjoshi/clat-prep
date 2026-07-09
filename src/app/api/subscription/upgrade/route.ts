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
 * Graceful fallback: If campaign columns (is_promo_user etc.) don't exist
 * in the DB yet (migration not run), the upgrade still works without
 * campaign tracking.
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

    // ── Step 1: Fetch user's current plan ──
    // Only select columns that definitely exist (subscription_plan).
    // Campaign columns (is_promo_user, promo_claimed_at) may not exist
    // if the migration hasn't been run yet.
    const { data: profile, error: profileErr } = await admin
      .from('profiles')
      .select('subscription_plan')
      .eq('id', user.id)
      .single();

    if (profileErr || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // ── Step 2: Must be on 'free' plan ──
    if (profile.subscription_plan !== 'free') {
      return NextResponse.json({
        error: 'Already upgraded',
        message: profile.subscription_plan === 'premium'
          ? 'You already have Premium access!'
          : 'You already have Max access!',
        plan: profile.subscription_plan,
      }, { status: 400 });
    }

    // ── Step 3: Check if campaign columns exist ──
    let hasCampaign = false;
    let remainingSlots = 0;
    const now = new Date();
    const campaignEnd = new Date('2026-07-31T23:59:59Z');

    try {
      // Probe: try selecting campaign columns
      await admin
        .from('profiles')
        .select('is_promo_user')
        .eq('id', user.id)
        .limit(1)
        .single();

      hasCampaign = true;

      // Campaign period check
      if (now > campaignEnd) {
        return NextResponse.json({
          error: 'Campaign ended',
          message: 'The free upgrade campaign ended on July 31, 2026. Check back for new offers!',
        }, { status: 400 });
      }

      // Count promo users (first 20 cap)
      const { count: promoCount } = await admin
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('is_promo_user', true)
        .eq('subscription_plan', 'premium');

      remainingSlots = 20 - (promoCount ?? 0);
      if (remainingSlots <= 0) {
        return NextResponse.json({
          error: 'Campaign full',
          message: 'Sorry, all 20 promo slots have been claimed! Stay tuned for more offers.',
        }, { status: 400 });
      }
    } catch {
      // Campaign columns don't exist — skip campaign checks
      // Upgrade will still work, just without promo tracking
      hasCampaign = false;
    }

    // ── Step 4: Perform upgrade ──
    const updateData: Record<string, unknown> = {
      subscription_plan: 'premium',
    };

    if (hasCampaign) {
      updateData.is_promo_user = true;
      updateData.promo_claimed_at = now.toISOString();
    }

    const { error: updateErr } = await admin
      .from('profiles')
      .update(updateData)
      .eq('id', user.id);

    if (updateErr) {
      console.error('Upgrade failed:', updateErr);
      return NextResponse.json({ error: 'Upgrade failed' }, { status: 500 });
    }

    // ── Step 5: Audit log (only if upgrade_log exists) ──
    if (hasCampaign) {
      try {
        await admin
          .from('upgrade_log')
          .insert({
            user_id: user.id,
            from_plan: 'free',
            to_plan: 'premium',
            upgrade_type: 'promo_campaign',
            campaign_remaining: remainingSlots - 1,
          });
      } catch {
        // Audit log failure is non-fatal
        console.warn('Audit log write skipped (table may not exist yet)');
      }
    }

    return NextResponse.json({
      success: true,
      plan: 'premium',
      message: hasCampaign
        ? '🎉 You\'ve been upgraded to Premium!'
        : '✅ Upgraded to Premium! Run the DB migration for full campaign tracking.',
      campaign_slots_remaining: hasCampaign ? remainingSlots - 1 : null,
    });

  } catch (err) {
    console.error('Upgrade error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
