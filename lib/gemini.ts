// ============================================================
// gemini.ts — Gemini API wrapper (server-side only)
// Uses @google/genai SDK with user-provided API key (BYOK)
// ============================================================

import { GoogleGenAI } from "@google/genai";

const MODEL = "gemini-2.5-flash";

function createClient(apiKey: string): GoogleGenAI {
  return new GoogleGenAI({ apiKey });
}

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

// --------------- Translation ---------------

export async function translateText(
  apiKey: string,
  text: string,
  sourceLang: string,
  targetLang: string
): Promise<string> {
  const ai = createClient(apiKey);

  const response = await ai.models.generateContent({
    model: MODEL,
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
    config: {
      temperature: 0.3,
      maxOutputTokens: 1024,
    },
  });

  return response.text?.trim() || "";
}

// --------------- Streaming Analysis ---------------

export async function* analyzeStream(
  apiKey: string,
  text: string,
  targetLang: string
): AsyncGenerator<string> {
  const ai = createClient(apiKey);

  const stream = await ai.models.generateContentStream({
    model: MODEL,
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
    config: {
      temperature: 0.5,
      maxOutputTokens: 512,
    },
  });

  for await (const chunk of stream) {
    const chunkText = chunk.text;
    if (chunkText) {
      yield chunkText;
    }
  }
}

// --------------- Meeting Summary ---------------

export async function* summarizeStream(
  apiKey: string,
  transcript: string,
  targetLang: string
): AsyncGenerator<string> {
  const ai = createClient(apiKey);

  const stream = await ai.models.generateContentStream({
    model: MODEL,
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
    config: {
      temperature: 0.5,
      maxOutputTokens: 2048,
    },
  });

  for await (const chunk of stream) {
    const chunkText = chunk.text;
    if (chunkText) {
      yield chunkText;
    }
  }
}

// --------------- Validation ---------------

export async function validateApiKey(apiKey: string): Promise<boolean> {
  try {
    const ai = createClient(apiKey);
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: [
        {
          role: "user",
          parts: [{ text: "Say 'ok'" }],
        },
      ],
      config: {
        maxOutputTokens: 10,
      },
    });
    return !!response.text;
  } catch {
    return false;
  }
}
