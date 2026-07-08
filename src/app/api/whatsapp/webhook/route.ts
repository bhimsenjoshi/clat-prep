import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhook } from '@/lib/whatsapp';
import { WaQuizBot } from '@/lib/wa-quiz-bot';

/**
 * GET /api/whatsapp/webhook — Meta webhook verification
 *
 * When you configure the webhook URL in Meta Dashboard, they send a GET
 * with hub.mode, hub.verify_token, hub.challenge to verify ownership.
 *
 * Set WHATSAPP_VERIFY_TOKEN in Vercel env vars to your chosen secret string.
 */
export async function GET(request: NextRequest) {
  // TEMP: hardcoded for Meta webhook verification. TODO: move to env var.
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN ?? 'clatPrep2027';

  const verified = verifyWebhook(request, verifyToken);
  if (verified) return verified;

  return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
}

/**
 * POST /api/whatsapp/webhook — Incoming messages from users
 *
 * This is the interactive quiz bot entry point.
 * Users send messages like "start english", "A", "B", "help", etc.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Log incoming for debugging
    if (body.entry) {
      for (const entry of body.entry) {
        for (const change of entry.changes ?? []) {
          if (change.field === 'messages') {
            const value = change.value;

            // ─── Handle status updates (delivered/read receipts) ───
            if (value.statuses) {
              for (const status of value.statuses) {
                console.log(`WhatsApp status: ${status.id} → ${status.status}`);
                // Could update whatsapp_log here in future
              }
            }

            // ─── Handle incoming text messages (the actual quiz interaction) ───
            if (value.messages) {
              const bot = new WaQuizBot();

              for (const msg of value.messages) {
                const phone = msg.from;   // sender's phone number (91XXXXXXXXXX)
                const msgType = msg.type;

                if (msgType === 'text') {
                  const text = msg.text?.body ?? '';
                  await bot.handleIncoming(phone, text);
                } else if (msgType === 'interactive') {
                  // Button reply — extract the button ID
                  const buttonReply = msg.interactive?.button_reply;
                  if (buttonReply?.id) {
                    await bot.handleIncoming(phone, buttonReply.id);
                  }
                }
              }
            }
          }
        }
      }
    }

    // Always return 200 OK to acknowledge receipt
    return NextResponse.json({ status: 'ok' });
  } catch (err) {
    console.error('WhatsApp webhook error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
