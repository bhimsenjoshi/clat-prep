/**
 * WhatsApp Cloud API client (Meta free tier).
 *
 * Usage:
 *   const wa = new WhatsAppClient();
 *   await wa.sendText('91XXXXXXXXXX', 'Hello from CLAT Prep!');
 *
 * Pre-req: Meta Business Account + WhatsApp app configured at
 * https://developers.facebook.com
 *
 * Env vars needed:
 *   WHATSAPP_PHONE_NUMBER_ID  — from WhatsApp app dashboard
 *   WHATSAPP_ACCESS_TOKEN     — permanent token from WhatsApp app
 *   WHATSAPP_VERIFY_TOKEN     — your secret token for webhook verification
 */

const API_BASE = 'https://graph.facebook.com/v22.0';

export class WhatsAppClient {
  private phoneNumberId: string;
  private accessToken: string;

  constructor() {
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID ?? '';
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN ?? '';
  }

  get isConfigured() {
    return !!this.phoneNumberId && !!this.accessToken;
  }

  /**
   * Send a plain text message to a user.
   * `to` should be in international format: 91XXXXXXXXXX (no +)
   */
  async sendText(to: string, body: string): Promise<WhatsAppSendResult> {
    return this._call('messages', {
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body },
    });
  }

  /**
   * Send a pre-approved template message.
   * Templates are created in Meta Business Manager -> WhatsApp -> Message templates.
   */
  async sendTemplate(
    to: string,
    templateName: string,
    components?: WhatsAppTemplateComponent[],
    lang = 'en'
  ): Promise<WhatsAppSendResult> {
    return this._call('messages', {
      messaging_product: 'whatsapp',
      to,
      type: 'template',
      template: {
        name: templateName,
        language: { code: lang },
        components,
      },
    });
  }

  /**
   * Send a quiz-result summary card as a formatted text message.
   */
  async sendQuizResult(
    to: string,
    data: {
      name: string;
      section: string;
      correct: number;
      total: number;
      accuracy: number;
      streak?: number;
    }
  ): Promise<WhatsAppSendResult> {
    const emoji = data.accuracy >= 70 ? '🎉' : data.accuracy >= 40 ? '👍' : '💪';
    const pct = Math.round(data.accuracy);

    const body = [
      `📊 *Quiz Result — ${data.section}*`,
      ``,
      `${emoji} Hey ${data.name}!`,
      ``,
      `✅ Correct: ${data.correct}/${data.total}`,
      `🎯 Accuracy: ${pct}%`,
      ...(data.streak ? [`🔥 Streak: ${data.streak} days`] : []),
      ``,
      data.accuracy >= 70
        ? 'Great job! Keep it up! 🚀'
        : data.accuracy >= 40
          ? 'Good effort! Review your mistakes & try again.'
          : 'Keep practicing — you\'ll get better! 💪',
      ``,
      `_CLAT Prep — clatly.com_`,
    ].join('\n');

    return this.sendText(to, body);
  }

  /**
   * Send daily practice summary to a user.
   */
  async sendDailySummary(
    to: string,
    data: {
      name: string;
      questionsDone: number;
      correct: number;
      total: number;
      weakArea?: string;
      streak: number;
      plan: string;
    }
  ): Promise<WhatsAppSendResult> {
    const pct = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
    const emoji = pct >= 70 ? '🎉' : pct >= 40 ? '👍' : '💪';

    const body = [
      `📊 *${data.name} — Daily Practice Report*`,
      `━━━━━━━━━━━━━━━━━━`,
      `${emoji} Questions done: ${data.questionsDone}`,
      `✅ Correct: ${data.correct}/${data.total} (${pct}%)`,
      `🔥 Streak: ${data.streak} days`,
      ...(data.weakArea ? [`💪 Focus: ${data.weakArea}`] : []),
      `━━━━━━━━━━━━━━━━━━`,
      `Plan: ${data.plan}`,
      ``,
      `Keep going! 🚀`,
      `_CLAT Prep — clatly.com_`,
    ].join('\n');

    return this.sendText(to, body);
  }

  // ─── Raw API call ───

  private async _call(endpoint: string, payload: Record<string, unknown>): Promise<WhatsAppSendResult> {
    if (!this.isConfigured) {
      return { success: false, error: 'WhatsApp not configured — set WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN' };
    }

    const url = `${API_BASE}/${this.phoneNumberId}/${endpoint}`;

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        return {
          success: false,
          error: data?.error?.message ?? `HTTP ${res.status}`,
          raw: data,
        };
      }

      return {
        success: true,
        messageId: data?.messages?.[0]?.id,
        raw: data,
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      };
    }
  }
}

// ─── Types ───

export interface WhatsAppSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  raw?: unknown;
}

export interface WhatsAppTemplateComponent {
  type: 'header' | 'body' | 'button';
  parameters: { type: 'text' | 'image' | 'document'; text?: string; image?: { link: string } }[];
}

/**
 * Verify the webhook challenge (GET request from Meta).
 * Returns 200 with the hub.challenge echo on success.
 */
export function verifyWebhook(request: Request, verifyToken: string): Response | null {
  const url = new URL(request.url);
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === verifyToken && challenge) {
    return new Response(challenge, { status: 200 });
  }

  return null; // caller handles 403
}
