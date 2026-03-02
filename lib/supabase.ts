// ============================================================
// supabase.ts — Supabase client for KiwiPenNotes
// Browser-side client for Auth + Database + Storage
// ============================================================

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _supabase: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (_supabase) return _supabase;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  if (!url || !key) {
    // Return a dummy client that won't crash — features just won't work
    console.warn("Supabase env vars not set — auth features disabled");
    _supabase = createClient("https://placeholder.supabase.co", "placeholder");
    return _supabase;
  }

  _supabase = createClient(url, key);
  return _supabase;
}

// Convenience alias
export const supabase = typeof window !== "undefined" ? getSupabase() : null;

// ---- Types ----

export type SubscriptionTier = "free" | "starter" | "pro";

export interface UserProfile {
  id: string;
  email: string;
  display_name: string | null;
  stripe_customer_id: string | null;
  subscription_tier: SubscriptionTier;
  subscription_status: string; // 'none' | 'active' | 'canceled' | 'past_due'
  stt_hours_used: number;
  stt_hours_reset_at: string | null;
  created_at: string;
}

// ---- Profile helpers ----

export async function getProfile(
  userId: string
): Promise<UserProfile | null> {
  const { data, error } = await getSupabase()
    .from("user_profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error || !data) return null;
  return data as UserProfile;
}

export async function upsertProfile(
  userId: string,
  updates: Partial<UserProfile>
): Promise<void> {
  await getSupabase().from("user_profiles").upsert(
    { id: userId, ...updates },
    { onConflict: "id" }
  );
}

// ---- Subscription helpers ----

export function isPro(profile: UserProfile | null): boolean {
  if (!profile) return false;
  return (
    profile.subscription_tier === "pro" &&
    profile.subscription_status === "active"
  );
}

export function isStarter(profile: UserProfile | null): boolean {
  if (!profile) return false;
  return (
    (profile.subscription_tier === "starter" ||
      profile.subscription_tier === "pro") &&
    profile.subscription_status === "active"
  );
}

export function canUseEnhancedSTT(profile: UserProfile | null): boolean {
  if (!profile) return false;
  if (profile.subscription_status !== "active") return false;
  if (profile.subscription_tier === "free") return false;

  // Pro: 10 hours included
  if (profile.subscription_tier === "pro") {
    return profile.stt_hours_used < 10;
  }
  // Starter: pay-per-hour, always allowed (billed)
  return true;
}
