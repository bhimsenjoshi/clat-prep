/**
 * Daily WhatsApp Stats Reporter
 *
 * Runs as a standalone Node.js script (no Next.js build dependency).
 * Sends daily practice summary to all opted-in WhatsApp users.
 *
 * Usage: node scripts/daily-whatsapp-report.mjs
 * Or via Hermes cron: cronjob action=create schedule="0 20 * * *" prompt="Run daily WhatsApp report"
 *
 * Requires env vars: SUPABASE_SERVICE_ROLE_KEY, WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_ACCESS_TOKEN
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const WA_PHONE_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
const WA_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || '';

const WA_API = `https://graph.facebook.com/v22.0/${WA_PHONE_ID}/messages`;

async function sendWa(phone, text) {
  if (!WA_PHONE_ID || !WA_TOKEN) return { success: false, error: 'WhatsApp not configured' };
  try {
    const res = await fetch(WA_API, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WA_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: phone,
        type: 'text',
        text: { body: text },
      }),
    });
    const data = await res.json();
    return { success: res.ok, messageId: data?.messages?.[0]?.id, error: data?.error?.message };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

async function main() {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.log('⏭️ Supabase not configured — skipping');
    return;
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

  if (!WA_PHONE_ID || !WA_TOKEN) {
    console.log('⏭️ WhatsApp not configured — skipping daily report');
    return;
  }

  // Get all opted-in users
  const { data: users, error } = await supabase
    .from('profiles')
    .select('id, full_name, phone')
    .not('phone', 'is', null)
    .eq('whatsapp_opted_in', true);

  if (error) {
    console.error('Failed to fetch opted-in users:', error.message);
    return;
  }

  console.log(`📱 Found ${users.length} opted-in users`);
  const today = new Date().toISOString().split('T')[0];

  for (const user of users) {
    try {
      const { data: todaySessions } = await supabase
        .from('quiz_sessions')
        .select('correct_count, questions_answered, section')
        .eq('student_id', user.id)
        .gte('created_at', `${today}T00:00:00`)
        .lte('created_at', `${today}T23:59:59`);

      const totalAnswered = todaySessions?.reduce((s, x) => s + (x.questions_answered ?? 0), 0) ?? 0;
      const totalCorrect = todaySessions?.reduce((s, x) => s + (x.correct_count ?? 0), 0) ?? 0;

      if (totalAnswered === 0) {
        const msg = [
          `👋 Hey ${user.full_name || 'there'}!`,
          ``,
          `You haven't practiced today yet.`,
          `Even 5 questions a day builds momentum! 🚀`,
          ``,
          `Start now: clatly.com/student/quiz`,
          `_CLAT Prep_`,
        ].join('\n');

        await sendWa(user.phone, msg);
        await supabase.from('whatsapp_log').insert({
          user_id: user.id,
          message_type: 'daily_summary',
          message_body: 'No practice today — reminder sent',
          status: 'sent',
        });
        console.log(`  → ${user.phone}: reminder sent`);
        continue;
      }

      // Weak area detection
      const sectionStats = {};
      for (const s of todaySessions ?? []) {
        if (!sectionStats[s.section]) sectionStats[s.section] = { correct: 0, total: 0 };
        sectionStats[s.section].correct += s.correct_count ?? 0;
        sectionStats[s.section].total += s.questions_answered ?? 0;
      }

      let weakArea;
      let worstPct = 100;
      for (const [section, stats] of Object.entries(sectionStats)) {
        if (stats.total >= 3) {
          const pct = (stats.correct / stats.total) * 100;
          if (pct < worstPct) { worstPct = pct; weakArea = section; }
        }
      }

      const pct = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;
      const emoji = pct >= 70 ? '🎉' : pct >= 40 ? '👍' : '💪';

      const msg = [
        `📊 *${user.full_name || 'Student'} — Daily Practice Report*`,
        `━━━━━━━━━━━━━━━━━━`,
        `${emoji} Questions done: ${totalAnswered}`,
        `✅ Correct: ${totalCorrect}/${totalAnswered} (${pct}%)`,
        ...(weakArea ? [`💪 Focus: ${weakArea}`] : []),
        `━━━━━━━━━━━━━━━━━━`,
        `Keep going! 🚀`,
        `_CLAT Prep — clatly.com_`,
      ].join('\n');

      const result = await sendWa(user.phone, msg);

      await supabase.from('whatsapp_log').insert({
        user_id: user.id,
        message_type: 'daily_summary',
        message_body: `Daily report: ${totalCorrect}/${totalAnswered} correct`,
        whatsapp_message_id: result.messageId,
        status: result.success ? 'sent' : 'failed',
        error: result.error,
      });

      console.log(`  → ${user.phone}: ${result.success ? 'sent' : 'failed (' + result.error + ')'}`);

      // Rate limit
      await new Promise(r => setTimeout(r, 1000));

    } catch (err) {
      console.error(`  → ${user.phone}: error — ${err}`);
    }
  }

  console.log('✅ Daily WhatsApp report complete');
}

main().catch(console.error);
