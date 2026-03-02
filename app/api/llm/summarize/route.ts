// ============================================================
// POST /api/llm/summarize — LLM summary proxy for Pro users
// Body: { transcript, targetLang, knowledgeContext? }
// Returns: streaming text/event-stream
// ============================================================

import { NextRequest } from "next/server";
import { requirePaid } from "@/lib/server-auth";

const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY || "";

export async function POST(req: NextRequest) {
  const auth = await requirePaid(req);
  if (!auth) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { transcript, targetLang, knowledgeContext } = await req.json();
  if (!transcript) {
    return new Response("Missing transcript", { status: 400 });
  }

  const systemPrompt = `You are a professional meeting summarizer. Create a comprehensive summary of the following meeting transcript:

Structure:
## Meeting Summary
### Key Points
### Decisions Made
### Action Items (with owners if mentioned)
### Innovations & Ideas
### Open Questions

${knowledgeContext ? `Reference material for context:\n${knowledgeContext}\n\n` : ""}
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
