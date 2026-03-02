// ============================================================
// POST /api/stt/enhance — Enhanced STT via OpenAI Transcribe
// Accepts audio file, returns high-quality transcript
// Tracks usage against monthly allowance
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { requirePaid } from "@/lib/server-auth";
import { createClient } from "@supabase/supabase-js";

const OPENAI_KEY = process.env.OPENAI_API_KEY || "";

function getAdminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  );
}

export async function POST(req: NextRequest) {
  const auth = await requirePaid(req);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check usage
  const supabase = getAdminSupabase();
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("subscription_tier, stt_hours_used, stt_hours_reset_at")
    .eq("id", auth.userId)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  // Reset monthly counter if needed
  const now = new Date();
  const resetAt = profile.stt_hours_reset_at
    ? new Date(profile.stt_hours_reset_at)
    : null;
  let hoursUsed = profile.stt_hours_used || 0;

  if (!resetAt || now > resetAt) {
    hoursUsed = 0;
    const nextReset = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    await supabase
      .from("user_profiles")
      .update({ stt_hours_used: 0, stt_hours_reset_at: nextReset.toISOString() })
      .eq("id", auth.userId);
  }

  // Pro: 10 hours included
  if (profile.subscription_tier === "pro" && hoursUsed >= 10) {
    return NextResponse.json(
      {
        error: "Monthly STT limit reached (10 hours). Purchase additional hours or wait for reset.",
        hours_used: hoursUsed,
        limit: 10,
      },
      { status: 429 }
    );
  }

  try {
    const formData = await req.formData();
    const audioFile = formData.get("audio") as File | null;
    const language = (formData.get("language") as string) || undefined;

    if (!audioFile) {
      return NextResponse.json({ error: "No audio file" }, { status: 400 });
    }

    // Calculate duration in hours (approximate from file size at ~128kbps)
    const fileSizeMB = audioFile.size / (1024 * 1024);
    const estimatedMinutes = fileSizeMB / 0.96; // ~0.96 MB/min at 128kbps
    const estimatedHours = estimatedMinutes / 60;

    // Send to OpenAI Whisper / GPT-4o-mini-transcribe
    const openaiForm = new FormData();
    openaiForm.append("file", audioFile);
    openaiForm.append("model", "whisper-1");
    if (language) openaiForm.append("language", language);
    openaiForm.append("response_format", "verbose_json");

    const res = await fetch(
      "https://api.openai.com/v1/audio/transcriptions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENAI_KEY}`,
        },
        body: openaiForm,
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`OpenAI STT error: ${res.status} ${errText}`);
    }

    const data = await res.json();

    // Update usage
    const actualHours = (data.duration || estimatedMinutes * 60) / 3600;
    const newUsage = hoursUsed + Math.max(actualHours, estimatedHours);

    await supabase
      .from("user_profiles")
      .update({ stt_hours_used: newUsage })
      .eq("id", auth.userId);

    return NextResponse.json({
      text: data.text,
      segments: data.segments,
      duration: data.duration,
      hours_used: newUsage,
      hours_remaining:
        profile.subscription_tier === "pro"
          ? Math.max(0, 10 - newUsage)
          : null,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "STT failed";
    console.error("STT enhance error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
