/**
 * Daily WhatsApp Stats Reporter
 *
 * Runs via Hermes cron job every evening.
 * Sends daily practice summary to all opted-in WhatsApp users.
 *
 * Environment variables: SUPABASE_SERVICE_ROLE_KEY, WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_ACCESS_TOKEN
 */

import { createClient } from '@supabase/supabase-js';
import { WhatsAppClient } from '../lib/whatsapp';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function main() {
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
  const wa = new WhatsAppClient();

  if (!wa.isConfigured) {
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
      // Get today's practice stats for this user
      const { data: todaySessions } = await supabase
        .from('quiz_sessions')
        .select('id, correct_count, questions_answered, section')
        .eq('student_id', user.id)
        .gte('created_at', `${today}T00:00:00`)
        .lte('created_at', `${today}T23:59:59`);

      const totalAnswered = todaySessions?.reduce((sum, s) => sum + (s.questions_answered ?? 0), 0) ?? 0;
      const totalCorrect = todaySessions?.reduce((sum, s) => sum + (s.correct_count ?? 0), 0) ?? 0;

      if (totalAnswered === 0) {
        // No practice today — send gentle reminder
        await wa.sendText(user.phone!, [
          `👋 Hey ${user.full_name || 'there'}!`,
          ``,
          `You haven't practiced today yet.`,
          `Even 5 questions a day builds momentum! 🚀`,
          ``,
          `Start now: clatly.com/student/quiz`,
          `_CLAT Prep_`,
        ].join('\n'));

        await supabase.from('whatsapp_log').insert({
          user_id: user.id,
          message_type: 'daily_summary',
          message_body: 'No practice today — reminder sent',
          status: 'sent',
        });

        console.log(`  → ${user.phone}: reminder sent (no practice today)`);
        continue;
      }

      // Calculate weak area
      const sectionStats: Record<string, { correct: number; total: number }> = {};
      for (const s of todaySessions ?? []) {
        if (!sectionStats[s.section]) sectionStats[s.section] = { correct: 0, total: 0 };
        sectionStats[s.section].correct += s.correct_count ?? 0;
        sectionStats[s.section].total += s.questions_answered ?? 0;
      }

      let weakArea: string | undefined;
      let worstPct = 100;
      for (const [section, stats] of Object.entries(sectionStats)) {
        if (stats.total >= 3) {
          const pct = (stats.correct / stats.total) * 100;
          if (pct < worstPct) {
            worstPct = pct;
            weakArea = section;
          }
        }
      }

      // Get streak (consecutive days with at least 1 session)
      // Simplified: count distinct dates in the last 30 days
      // For a proper streak calculation, we'd need a streak tracking system

      const result = await wa.sendDailySummary(user.phone!, {
        name: user.full_name || 'there',
        questionsDone: totalAnswered,
        correct: totalCorrect,
        total: totalAnswered,
        weakArea,
        streak: 0, // TODO: proper streak tracking
        plan: weakArea
          ? `Practice ${weakArea} tomorrow to improve!`
          : 'Great all-round performance! 🎉',
      });

      await supabase.from('whatsapp_log').insert({
        user_id: user.id,
        message_type: 'daily_summary',
        message_body: `Daily report: ${totalCorrect}/${totalAnswered} correct`,
        whatsapp_message_id: result.messageId,
        status: result.success ? 'sent' : 'failed',
        error: result.error,
      });

      console.log(`  → ${user.phone}: ${result.success ? 'sent' : 'failed (' + result.error + ')'}`);

      // Rate limit: wait 1s between sends to avoid Meta rate limits
      await new Promise(r => setTimeout(r, 1000));

    } catch (err) {
      console.error(`  → ${user.phone}: error — ${err}`);
    }
  }

  console.log('✅ Daily WhatsApp report complete');
}

main().catch(console.error);
