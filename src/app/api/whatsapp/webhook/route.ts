import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhook } from '@/lib/whatsapp';

/**
 * GET = Meta's webhook verification challenge.
 * When you configure the webhook URL in Meta Dashboard, they send a GET
 * with hub.mode, hub.verify_token, hub.challenge to verify ownership.
 *
 * Set WHATSAPP_VERIFY_TOKEN in Vercel env vars to a secret string of your choice.
 */
export async function GET(request: NextRequest) {
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN ?? '';

  const verified = verifyWebhook(request, verifyToken);
  if (verified) return verified;

  return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
}

/**
 * POST = Incoming messages + status callbacks from WhatsApp.
 * Meta sends:
 *   - Incoming user messages (when a student replies)
 *   - Status updates (sent, delivered, read)
 *
 * Log these to whatsapp_log for tracking.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Meta sends a "hub.challenge" on webhook setup too, but that's GET.
    // POST receives actual message/status objects.

    // Log all incoming payloads for debugging
    console.log('WhatsApp webhook received:', JSON.stringify(body).slice(0, 1000));

    // Extract message status updates
    if (body.entry) {
      for (const entry of body.entry) {
        for (const change of entry.changes ?? []) {
          if (change.field === 'messages') {
            const value = change.value;

            // Status updates (sent → delivered → read)
            if (value.statuses) {
              for (const status of value.statuses) {
                console.log(`WhatsApp status: ${status.id} → ${status.status} (timestamp: ${status.timestamp})`);
                // TODO: Update whatsapp_log.status where whatsapp_message_id = status.id
              }
            }

            // Incoming messages from users
            if (value.messages) {
              for (const msg of value.messages) {
                console.log(`WhatsApp msg from ${msg.from}: ${msg.type} = ${msg.text?.body ?? '(non-text)'}`);
                // TODO: Handle student replies (opt-out, request stats, etc.)
              }
            }
          }
        }
      }
    }

    // Meta expects 200 OK to acknowledge receipt
    return NextResponse.json({ status: 'ok' });
  } catch (err) {
    console.error('WhatsApp webhook error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
