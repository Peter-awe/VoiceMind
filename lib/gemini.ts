// ============================================================
// gemini.ts — Gemini REST API wrapper (server-side only)
// Uses direct fetch calls for Cloudflare Workers compatibility
// ============================================================

const MODEL = "gemini-2.0-flash";
const BASE_URL = "https://generativelanguage.googleapis.com/v1beta";

// --------------- Language helpers ---------------

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

// --------------- Helper: non-streaming call ---------------

async function geminiGenerate(
  apiKey: string,
  prompt: string,
  temperature = 0.3,
  maxTokens = 1024
): Promise<string> {
  const res = await fetch(
    `${BASE_URL}/models/${MODEL}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature,
          maxOutputTokens: maxTokens,
        },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API error: ${res.status} ${err}`);
  }

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
}

// --------------- Helper: streaming call ---------------

async function* geminiStream(
  apiKey: string,
  prompt: string,
  temperature = 0.5,
  maxTokens = 1024
): AsyncGenerator<string> {
  const res = await fetch(
    `${BASE_URL}/models/${MODEL}:streamGenerateContent?key=${apiKey}&alt=sse`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature,
          maxOutputTokens: maxTokens,
        },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API error: ${res.status} ${err}`);
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
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            yield text;
          }
        } catch {
          // skip parse errors
        }
      }
    }
  }
}

// --------------- Translation ---------------

export async function translateText(
  apiKey: string,
  text: string,
  sourceLang: string,
  targetLang: string
): Promise<string> {
  return geminiGenerate(
    apiKey,
    `Translate the following text from ${langName(sourceLang)} to ${langName(targetLang)}. Return ONLY the translated text, nothing else.\n\nText: ${text}`,
    0.3,
    1024
  );
}

// --------------- Streaming Analysis ---------------

export async function* analyzeStream(
  apiKey: string,
  text: string,
  targetLang: string
): AsyncGenerator<string> {
  yield* geminiStream(
    apiKey,
    `You are an intelligent meeting assistant. Analyze the following transcript excerpt and provide brief, actionable insights. Focus on: key topics, important decisions, action items, or notable points. Respond in ${langName(targetLang)}. Keep it concise (3-5 bullet points max).

Transcript:
${text}`,
    0.5,
    512
  );
}

// --------------- Meeting Summary ---------------

export async function* summarizeStream(
  apiKey: string,
  transcript: string,
  targetLang: string
): AsyncGenerator<string> {
  yield* geminiStream(
    apiKey,
    `You are a professional meeting analyst. Analyze the following complete meeting transcript and generate a structured summary. Respond in ${langName(targetLang)}.

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
    0.5,
    2048
  );
}

// --------------- Validation ---------------

export async function validateApiKey(apiKey: string): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/models?key=${apiKey}`);
    return res.ok;
  } catch {
    return false;
  }
}
