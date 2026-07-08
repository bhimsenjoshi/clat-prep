import { NextRequest, NextResponse } from 'next/server';
import { getServerUser } from '@/lib/supabase/server';
import { WhatsAppClient } from '@/lib/whatsapp';

/**
 * POST /api/whatsapp/send-quiz-result
 *
 * Called after a student completes a quiz session.
 * Sends their result to WhatsApp if they've opted in.
 */
export async function POST(request: NextRequest) {
  try {
    const { section, correct, total } = await request.json() as {
      section?: string;
      correct?: number;
      total?: number;
    };

    const { user, supabase } = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate inputs
    if (!section || typeof correct !== 'number' || typeof total !== 'number' || total <= 0) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }

    // Check if user has WhatsApp registered
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, phone, whatsapp_opted_in, daily_free_questions, last_practice_date')
      .eq('id', user.id)
      .single();

    if (!profile?.phone || !profile?.whatsapp_opted_in) {
      // Not registered for WhatsApp — silent skip
      return NextResponse.json({ sent: false, reason: 'not_registered' });
    }

    // Calculate accuracy
    const accuracy = Math.round((correct / total) * 100);

    // Send via WhatsApp
    const wa = new WhatsAppClient();
    if (!wa.isConfigured) {
      return NextResponse.json({ sent: false, reason: 'wa_not_configured' });
    }

    const result = await wa.sendQuizResult(profile.phone, {
      name: profile.full_name || 'there',
      section,
      correct,
      total,
      accuracy,
    });

    // Log the message
    if (result.success) {
      await supabase.from('whatsapp_log').insert({
        user_id: user.id,
        message_type: 'quiz_result',
        message_body: `Quiz result: ${section} — ${correct}/${total} (${accuracy}%)`,
        whatsapp_message_id: result.messageId,
        status: 'sent',
      });
    }

    return NextResponse.json({
      sent: result.success,
      message_id: result.messageId,
      error: result.error,
    });

  } catch (err) {
    console.error('WhatsApp send-quiz-result error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
