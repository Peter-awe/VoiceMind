// ============================================================
// gemini-client.ts — Client-side Gemini REST API calls
// Calls Google API directly from browser, no server needed
// ============================================================

const MODEL = "gemini-2.0-flash";
const BASE_URL = "https://generativelanguage.googleapis.com/v1beta";

const LANGUAGE_NAMES: Record<string, string> = {
  zh: "Chinese",
  en: "English",
  ja: "Japanese",
  ko: "Korean",
  fr: "French",
  de: "German",
  es: "Spanish",
  pt: "Portuguese",
  ru: "Russian",
  ar: "Arabic",
};

function langName(code: string): string {
  return LANGUAGE_NAMES[code] || code;
}

// --------------- Translation (non-streaming) ---------------

export async function translateText(
  apiKey: string,
  text: string,
  sourceLang: string,
  targetLang: string
): Promise<string> {
  const res = await fetch(
    `${BASE_URL}/models/${MODEL}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `Translate the following text from ${langName(sourceLang)} to ${langName(targetLang)}. Return ONLY the translated text, nothing else.\n\nText: ${text}`,
              },
            ],
          },
        ],
        generationConfig: { temperature: 0.3, maxOutputTokens: 1024 },
      }),
    }
  );

  if (!res.ok) return "";

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
}

// --------------- Streaming Analysis ---------------

export async function streamAnalysis(
  apiKey: string,
  text: string,
  targetLang: string,
  onToken: (token: string) => void,
  onDone: (fullText: string) => void,
  onError?: (err: string) => void
): Promise<void> {
  try {
    const res = await fetch(
      `${BASE_URL}/models/${MODEL}:streamGenerateContent?key=${apiKey}&alt=sse`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `You are an intelligent meeting assistant. Analyze the following transcript excerpt and provide brief, actionable insights. Focus on: key topics, important decisions, action items, or notable points. Respond in ${langName(targetLang)}. Keep it concise (3-5 bullet points max).

Transcript:
${text}`,
                },
              ],
            },
          ],
          generationConfig: { temperature: 0.5, maxOutputTokens: 512 },
        }),
      }
    );

    if (!res.ok) {
      onError?.(`API error: ${res.status}`);
      return;
    }

    const reader = res.body?.getReader();
    if (!reader) return;

    const decoder = new TextDecoder();
    let buffer = "";
    let fullText = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const jsonStr = line.slice(6).trim();
          if (!jsonStr) continue;
          try {
            const data = JSON.parse(jsonStr);
            const token =
              data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (token) {
              fullText += token;
              onToken(fullText);
            }
          } catch {
            // skip
          }
        }
      }
    }

    onDone(fullText);
  } catch (err) {
    onError?.(String(err));
  }
}

// --------------- Streaming Summary ---------------

export async function streamSummary(
  apiKey: string,
  transcript: string,
  targetLang: string,
  onToken: (token: string) => void,
  onDone: () => void,
  onError?: (err: string) => void
): Promise<void> {
  try {
    const res = await fetch(
      `${BASE_URL}/models/${MODEL}:streamGenerateContent?key=${apiKey}&alt=sse`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `You are a professional meeting analyst. Analyze the following complete meeting transcript and generate a structured summary. Respond in ${langName(targetLang)}.

Use exactly these 5 sections with these headers:

## 📋 Key Points / 会议要点
List the most important points discussed (3-7 items).

## ✅ Action Items / 待办事项
List specific tasks, assignments, or commitments mentioned.

## 💡 Innovations & Ideas / 创新点与想法
List any creative ideas, proposals, or innovative approaches mentioned.

## ❓ Open Questions / 待解决问题
List any unresolved questions, concerns, or topics that need follow-up.

## 📝 Summary / 总结
A brief 2-3 paragraph executive summary of the entire meeting.

Transcript:
${transcript}`,
                },
              ],
            },
          ],
          generationConfig: { temperature: 0.5, maxOutputTokens: 2048 },
        }),
      }
    );

    if (!res.ok) {
      onError?.(`API error: ${res.status}`);
      return;
    }

    const reader = res.body?.getReader();
    if (!reader) return;

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const jsonStr = line.slice(6).trim();
          if (!jsonStr) continue;
          try {
            const data = JSON.parse(jsonStr);
            const token =
              data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (token) {
              onToken(token);
            }
          } catch {
            // skip
          }
        }
      }
    }

    onDone();
  } catch (err) {
    onError?.(String(err));
  }
}
