import { NextRequest, NextResponse } from 'next/server';
import { getServerUser } from '@/lib/supabase/server';
import { WhatsAppClient } from '@/lib/whatsapp';

export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json() as { phone?: string };

    const { user, supabase } = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate phone: must be India 10-digit format
    const cleaned = phone?.replace(/\s+/g, '').replace(/^\+91/, '').replace(/^91/, '') ?? '';
    if (!/^[6-9]\d{9}$/.test(cleaned)) {
      return NextResponse.json({
        error: 'Invalid phone number. Enter a valid 10-digit Indian mobile number.',
      }, { status: 400 });
    }

    const fullPhone = `91${cleaned}`;

    // Check if already registered by another user
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('phone', fullPhone)
      .neq('id', user.id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({
        error: 'This phone number is already registered with another account.',
      }, { status: 409 });
    }

    // Save phone — mark as opted-in (user consented by providing number)
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        phone: fullPhone,
        whatsapp_opted_in: true,
      })
      .eq('id', user.id);

    if (updateError) {
      return NextResponse.json({ error: 'Failed to save phone number' }, { status: 500 });
    }

    // Send welcome message if WhatsApp is configured
    const wa = new WhatsAppClient();
    let welcomeSent = false;

    if (wa.isConfigured) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      const name = profile?.full_name ?? 'there';
      const result = await wa.sendText(
        fullPhone,
        `👋 Hey ${name}! Welcome to CLAT Prep WhatsApp!\n\nYou'll now receive your daily practice summaries and quiz results here. Reply STOP anytime to opt out.\n\n— CLAT Prep Team 🚀`
      );

      if (result.success) {
        welcomeSent = true;
        // Log the message
        await supabase.from('whatsapp_log').insert({
          user_id: user.id,
          message_type: 'welcome',
          message_body: `Welcome message to ${fullPhone}`,
          whatsapp_message_id: result.messageId,
          status: 'sent',
        });
      }
    }

    return NextResponse.json({
      success: true,
      phone: fullPhone,
      welcome_sent: welcomeSent,
      message: 'Phone number registered! You\'ll receive practice updates on WhatsApp.',
    });

  } catch (err) {
    console.error('WhatsApp register error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET — check if user has WhatsApp registered
 */
export async function GET() {
  const { user, supabase } = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('phone, whatsapp_opted_in')
    .eq('id', user.id)
    .single();

  return NextResponse.json({
    registered: !!(profile?.phone && profile?.whatsapp_opted_in),
    phone: profile?.phone ?? null,
  });
}
