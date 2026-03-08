// ============================================================
// rate-limit.ts — Daily API call rate limiter for paid LLM routes
//
// Uses user_profiles columns to track per-route daily usage.
// Resets automatically at the start of each new UTC day.
// Bypasses RLS via SUPABASE_SERVICE_ROLE_KEY.
//
// Tier-based daily limits:
//   Plus ($1.99/mo):
//     translate: 50/day   (~$0.0075 max)
//     analyze:    5/day   (~$0.009 max)
//     summarize:  2/day   (~$0.006 max)
//     Total max cost: ~$0.023/day = ~$0.68/month → 66% margin
//
//   Pro Max ($9.99/mo):
//     translate: 200/day  (~$0.03 max)
//     analyze:    60/day  (~$0.11 max)
//     summarize:  10/day  (~$0.03 max)
//     Total max cost: ~$0.17/day = ~$5/month → 50% margin
// ============================================================

import { createClient } from "@supabase/supabase-js";

type Route = "translate" | "analyze" | "summarize";
type Tier = "plus" | "pro";

const DAILY_LIMITS: Record<Tier, Record<Route, number>> = {
  plus: {
    translate: 50,
    analyze: 5,
    summarize: 2,
  },
  pro: {
    translate: 200,
    analyze: 60,
    summarize: 10,
  },
};

function getAdminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
      "https://ggczwqlopjiyuhbnnpgs.supabase.co",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  );
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
}

/**
 * Check and increment the daily call counter for a given LLM route.
 * Returns whether the request is allowed and how many calls remain.
 *
 * @param tier - User's subscription tier ("plus" or "pro")
 */
export async function checkRateLimit(
  userId: string,
  route: Route,
  tier: Tier = "pro"
): Promise<RateLimitResult> {
  const limit = DAILY_LIMITS[tier]?.[route] ?? DAILY_LIMITS.pro[route];
  const column = `llm_calls_${route}` as const;
  const supabase = getAdminSupabase();

  // Fetch current counters
  const { data: profile } = await supabase
    .from("user_profiles")
    .select(
      "llm_calls_translate, llm_calls_analyze, llm_calls_summarize, llm_calls_reset_date"
    )
    .eq("id", userId)
    .single();

  // If no profile row exists, deny (shouldn't happen for paid users)
  if (!profile) {
    return { allowed: false, remaining: 0, limit };
  }

  const today = new Date().toISOString().split("T")[0]; // "YYYY-MM-DD" UTC
  const resetDate = profile.llm_calls_reset_date;

  // ── New day → reset all counters, then count this request as 1 ──
  if (!resetDate || resetDate !== today) {
    const resetPayload: Record<string, unknown> = {
      llm_calls_translate: 0,
      llm_calls_analyze: 0,
      llm_calls_summarize: 0,
      llm_calls_reset_date: today,
    };
    // Set the current route to 1 (this request)
    resetPayload[column] = 1;

    await supabase
      .from("user_profiles")
      .update(resetPayload)
      .eq("id", userId);

    return { allowed: true, remaining: limit - 1, limit };
  }

  // ── Same day → check limit ──
  const currentCount: number =
    (profile as Record<string, number>)[column] || 0;

  if (currentCount >= limit) {
    return { allowed: false, remaining: 0, limit };
  }

  // Increment (minor race condition acceptable — worst case a few extra calls)
  await supabase
    .from("user_profiles")
    .update({ [column]: currentCount + 1 })
    .eq("id", userId);

  return { allowed: true, remaining: limit - currentCount - 1, limit };
}
