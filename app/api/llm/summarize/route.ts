// ============================================================
// POST /api/llm/summarize — LLM summary proxy for Pro users
// Body: { transcript, targetLang }
// Returns: streaming text/event-stream
// ============================================================

import { NextRequest } from "next/server";
import { requirePaid } from "@/lib/server-auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { createClient } from "@supabase/supabase-js";

const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY || "";

function getAdminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ggczwqlopjiyuhbnnpgs.supabase.co",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  );
}

async function getKBContext(userId: string): Promise<string> {
  try {
    const supabase = getAdminSupabase();
    const { data } = await supabase
      .from("documents")
      .select("filename, content")
      .eq("user_id", userId)
      .limit(5);
    if (!data || data.length === 0) return "";
    let ctx = "";
    for (const doc of data) {
      const snippet = (doc.content || "").substring(0, 2000);
      ctx += `--- ${doc.filename} ---\n${snippet}\n\n`;
      if (ctx.length > 8000) break;
    }
    return ctx.trim();
  } catch {
    return "";
  }
}

export async function POST(req: NextRequest) {
  const auth = await requirePaid(req);
  if (!auth) {
    return new Response("Unauthorized", { status: 401 });
  }

  // ── Rate limit check ──
  const rl = await checkRateLimit(auth.userId, "summarize", auth.tier as "plus" | "pro");
  if (!rl.allowed) {
    return new Response(
      `Daily summary limit reached (${rl.limit}/day). Resets at midnight UTC.`,
      { status: 429, headers: { "X-RateLimit-Remaining": "0", "X-RateLimit-Limit": String(rl.limit) } }
    );
  }

  if (!DEEPSEEK_KEY) {
    return new Response("Summary service is temporarily unavailable. Please try again later.", { status: 503 });
  }

  const { transcript, targetLang } = await req.json();
  if (!transcript) {
    return new Response("Missing transcript", { status: 400 });
  }

  // Limit input size to prevent API abuse
  if (transcript.length > 50000) {
    return new Response("Transcript too long (max 50,000 chars)", { status: 400 });
  }

  // Fetch actual KB content server-side
  const kbContent = await getKBContext(auth.userId);

  const systemPrompt = `You are a professional meeting summarizer. Create a comprehensive summary of the following meeting transcript:

Structure:
## Meeting Summary
### Key Points
### Decisions Made
### Action Items (with owners if mentioned)
### Innovations & Ideas
### Open Questions

${kbContent ? `Reference material for context:\n${kbContent}\n\n` : ""}
Respond in ${targetLang || "English"}. Be thorough but concise.`;

  try {
    const res = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${DEEPSEEK_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: transcript },
        ],
        temperature: 0.5,
        max_tokens: 4000,
        stream: true,
      }),
    });

    if (!res.ok || !res.body) {
      throw new Error(`DeepSeek error: ${res.status}`);
    }

    return new Response(res.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Summary failed";
    console.error("LLM summarize error:", message);
    return new Response(message, { status: 500 });
  }
}
