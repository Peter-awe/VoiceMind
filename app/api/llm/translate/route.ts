// ============================================================
// POST /api/llm/translate — LLM translation proxy for Pro users
// Body: { text, sourceLang, targetLang }
// Returns: { translation: string }
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { requirePaid } from "@/lib/server-auth";

const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY || "";

export async function POST(req: NextRequest) {
  const auth = await requirePaid(req);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { text, sourceLang, targetLang } = await req.json();
  if (!text || !sourceLang || !targetLang) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

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
          {
            role: "system",
            content: `You are a professional translator. Translate the following text from ${sourceLang} to ${targetLang}. Output ONLY the translation, nothing else.`,
          },
          { role: "user", content: text },
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`DeepSeek API error: ${res.status} ${errText}`);
    }

    const data = await res.json();
    const translation =
      data.choices?.[0]?.message?.content?.trim() || "(Translation failed)";

    return NextResponse.json({ translation });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Translation failed";
    console.error("LLM translate error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
