// Deprecated: all Gemini calls now happen client-side
export async function POST() {
  return new Response("data: [DONE]\n\n", {
    headers: { "Content-Type": "text/event-stream" },
  });
}
