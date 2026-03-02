// ============================================================
// gemini-client.ts — Client-side Gemini REST API calls
// Calls Google API directly from browser, no server needed
// Includes rate limiting, request coalescing, and backoff
// ============================================================

const MODEL = "gemini-2.0-flash";
const BASE_URL = "https://generativelanguage.googleapis.com/v1beta";

// Gemini free tier: 10 RPM → ensure we never exceed this
const MIN_REQUEST_INTERVAL_MS = 8000; // ~7.5 RPM max
const MAX_RETRIES = 2;
const INITIAL_BACKOFF_MS = 20000; // 20s initial backoff on 429

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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// =============== Simple Rate Limiter ===============
// Serialises ALL Gemini calls through a single queue
// with minimum spacing between requests.

let _busy = false;
const _queue: Array<{
  fn: () => Promise<void>;
  tag: string;
}> = [];

let _lastRequestTime = 0;

async function drain() {
  if (_busy) return;
  _busy = true;
  while (_queue.length > 0) {
    const item = _queue.shift()!;

    // Enforce minimum interval
    const now = Date.now();
    const wait = MIN_REQUEST_INTERVAL_MS - (now - _lastRequestTime);
    if (wait > 0) {
      await sleep(wait);
    }
    _lastRequestTime = Date.now();

    try {
      await item.fn();
    } catch (e) {
      console.error(`[gemini-client] ${item.tag} error:`, e);
    }
  }
  _busy = false;
}

function enqueue(tag: string, fn: () => Promise<void>) {
  _queue.push({ fn, tag });
  drain();
}

/** Remove all queued items with the given tag (does NOT cancel in-flight) */
function cancelQueued(tag: string) {
  for (let i = _queue.length - 1; i >= 0; i--) {
    if (_queue[i].tag === tag) _queue.splice(i, 1);
  }
}

// =============== Retry with backoff for 429 ===============

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = MAX_RETRIES
): Promise<Response> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const res = await fetch(url, options);

    if (res.status === 429 && attempt < maxRetries) {
      const backoff = INITIAL_BACKOFF_MS * Math.pow(2, attempt);
      console.warn(
        `Gemini 429 — waiting ${backoff / 1000}s then retry ${attempt + 1}/${maxRetries}`
      );
      await sleep(backoff);
      _lastRequestTime = Date.now(); // update so subsequent spacing is correct
      continue;
    }

    return res;
  }

  // Should never reach here, but satisfy TS
  return fetch(url, options);
}

// =============== Concurrency guard for analysis ===============

let _analysisInFlight = false;

export function isAnalysisInProgress(): boolean {
  return _analysisInFlight;
}

// =============== Translation (non-streaming) ===============
// Uses "replace" strategy: if a new translate request arrives while a
// previous one is still queued, the old queued one is discarded.

export function translateText(
  apiKey: string,
  text: string,
  sourceLang: string,
  targetLang: string
): Promise<string> {
  if (!text.trim()) return Promise.resolve("");

  // Cancel any previously-queued (not yet started) translation
  cancelQueued("translate");

  return new Promise<string>((resolve) => {
    enqueue("translate", async () => {
      try {
        const res = await fetchWithRetry(
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

        if (!res.ok) {
          resolve("");
          return;
        }

        const data = await res.json();
        resolve(
          data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || ""
        );
      } catch {
        resolve("");
      }
    });
  });
}

// =============== Streaming Analysis ===============

export function streamAnalysis(
  apiKey: string,
  text: string,
  targetLang: string,
  onToken: (token: string) => void,
  onDone: (fullText: string) => void,
  onError?: (err: string) => void
): void {
  // Guard: one at a time
  if (_analysisInFlight) {
    console.log("Analysis skipped — one already in flight");
    return;
  }

  // Cancel any previously queued analysis
  cancelQueued("analysis");

  _analysisInFlight = true;

  enqueue("analysis", async () => {
    try {
      const res = await fetchWithRetry(
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

      await readSSE(res, onToken, onDone);
    } catch (err) {
      onError?.(String(err));
    } finally {
      _analysisInFlight = false;
    }
  });
}

// =============== Streaming Summary ===============

export function streamSummary(
  apiKey: string,
  transcript: string,
  targetLang: string,
  onToken: (token: string) => void,
  onDone: () => void,
  onError?: (err: string) => void
): void {
  // Cancel anything low-priority still queued
  cancelQueued("translate");
  cancelQueued("analysis");

  enqueue("summary", async () => {
    try {
      const res = await fetchWithRetry(
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

## Key Points
List the most important points discussed (3-7 items).

## Action Items
List specific tasks, assignments, or commitments mentioned.

## Innovations & Ideas
List any creative ideas, proposals, or innovative approaches mentioned.

## Open Questions
List any unresolved questions, concerns, or topics that need follow-up.

## Summary
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

      await readSSEraw(res, onToken, onDone);
    } catch (err) {
      onError?.(String(err));
    }
  });
}

// =============== SSE helpers ===============

/** Read SSE stream, accumulating full text and calling onToken with it */
async function readSSE(
  res: Response,
  onToken: (fullText: string) => void,
  onDone: (fullText: string) => void
) {
  const reader = res.body?.getReader();
  if (!reader) return;

  const decoder = new TextDecoder();
  let buffer = "";
  let fullText = "";

  // eslint-disable-next-line no-constant-condition
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
          const t = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (t) {
            fullText += t;
            onToken(fullText);
          }
        } catch {
          // skip
        }
      }
    }
  }

  onDone(fullText);
}

/** Read SSE stream, calling onToken with each new chunk (not accumulated) */
async function readSSEraw(
  res: Response,
  onToken: (chunk: string) => void,
  onDone: () => void
) {
  const reader = res.body?.getReader();
  if (!reader) return;

  const decoder = new TextDecoder();
  let buffer = "";

  // eslint-disable-next-line no-constant-condition
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
          const t = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (t) onToken(t);
        } catch {
          // skip
        }
      }
    }
  }

  onDone();
}
