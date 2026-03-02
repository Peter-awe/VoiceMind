import { NextRequest } from "next/server";
import { summarizeStream } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get("x-api-key");
  if (!apiKey) {
    return new Response("Missing API key", { status: 401 });
  }

  try {
    const { transcript, targetLang } = await req.json();

    if (!transcript?.trim()) {
      return new Response("No transcript provided", { status: 400 });
    }

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const token of summarizeStream(
            apiKey,
            transcript,
            targetLang || "zh"
          )) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(token)}\n\n`)
            );
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        } catch (err) {
          console.error("Summary stream error:", err);
          controller.enqueue(encoder.encode("data: [ERROR]\n\n"));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Summary error:", error);
    return new Response("Summary failed", { status: 500 });
  }
}
