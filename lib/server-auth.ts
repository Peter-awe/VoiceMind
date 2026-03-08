// ============================================================
// server-auth.ts — Server-side auth verification for API routes
// Verifies JWT from Supabase and checks subscription tier
// ============================================================

import { createClient } from "@supabase/supabase-js";
import { NextRequest } from "next/server";

function getAdminSupabase() {
  // NEXT_PUBLIC_* is inlined at build time by Next.js — may be undefined
  // on Cloudflare Workers if not set during build. Hardcode public URL fallback.
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    "https://ggczwqlopjiyuhbnnpgs.supabase.co";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error(
      "⚠️ server-auth: Missing env vars —",
      !url ? "NEXT_PUBLIC_SUPABASE_URL" : "",
      !key ? "SUPABASE_SERVICE_ROLE_KEY" : ""
    );
    throw new Error("Supabase admin env vars not configured");
  }
  return createClient(url, key);
}

export interface AuthResult {
  userId: string;
  email: string;
  tier: "free" | "plus" | "pro";
  isActive: boolean;
}

/**
 * Verify the request has a valid Supabase auth token
 * and return user info + subscription tier
 */
export async function verifyAuth(
  req: NextRequest
): Promise<AuthResult | null> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.slice(7);
  const supabase = getAdminSupabase();

  // Verify JWT
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) return null;

  // Get profile
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("subscription_tier, subscription_status")
    .eq("id", user.id)
    .single();

  const tier = (profile?.subscription_tier || "free") as AuthResult["tier"];
  const isActive = profile?.subscription_status === "active";

  return {
    userId: user.id,
    email: user.email || "",
    tier,
    isActive,
  };
}

/**
 * Require at least plus tier (paid)
 */
export async function requirePaid(
  req: NextRequest
): Promise<AuthResult | null> {
  const auth = await verifyAuth(req);
  if (!auth) return null;
  if (!auth.isActive || auth.tier === "free") return null;
  return auth;
}
