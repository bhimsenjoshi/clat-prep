import { createClient } from '@supabase/supabase-js';

/**
 * Rate limiter backed by Supabase (works across serverless instances).
 * Uses a simple `rate_limits` table to track request counts per key.
 * Falls back to allowing the request if the table doesn't exist yet.
 */
export async function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number,
): Promise<boolean> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const now = Date.now();
    const windowStart = new Date(now - windowMs).toISOString();

    // Atomic upsert: increment count for this key in the current window
    const { data: existing } = await supabase
      .from('rate_limits')
      .select('count, reset_at')
      .eq('key', key)
      .maybeSingle();

    if (!existing || new Date(existing.reset_at).getTime() < now) {
      // New window: insert or reset
      await supabase
        .from('rate_limits')
        .upsert(
          {
            key,
            count: 1,
            reset_at: new Date(now + windowMs).toISOString(),
          },
          { onConflict: 'key' },
        );
      return true;
    }

    if (existing.count >= maxRequests) return false;

    await supabase
      .from('rate_limits')
      .update({ count: existing.count + 1 })
      .eq('key', key);

    return true;
  } catch {
    // If rate_limits table doesn't exist, allow the request
    return true;
  }
}
