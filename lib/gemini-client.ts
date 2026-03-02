// ============================================================
// gemini-client.ts — Client-side Gemini REST API calls
// Calls Google API directly from browser, no server needed
// Includes rate limiting, request queue, and exponential backoff
// ============================================================

const MODEL = "gemini-2.0-flash";
const BASE_URL = "https://generativelanguage.googleapis.com/v1beta";

// Gemini free tier: 10 RPM → space requests at least 7s apart for safety
const MIN_REQUEST_INTERVAL_MS = 7000;
const MAX_RETRIES = 2;
const INITIAL_BACKOFF_MS = 15000; // 15s initial backoff on 429

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

// =============== Rate Limiter / Request Queue ===============

type QueuedRequest<T> = {
  execute: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (err: unknown) => void;
  priority: number; // lower = higher priority
};

class RateLimiter {
  private queue: QueuedRequest<unknown>[] = [];
  private lastRequestTime = 0;
  private processing = false;

  async enqueue<T>(execute: () => Promise<T>, priority = 1): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push({
        execute: execute as () => Promise<unknown>,
        resolve: resolve as (value: unknown) => void,
        reject,
        priority,
      });
      // Sort: lower priority number = processed first
      this.queue.sort((a, b) => a.priority - b.priority);
      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.processing) return;
    this.processing = true;

    while (this.queue.length > 0) {
      const item = this.queue.shift()!;

      // Wait for rate limit window
      const now = Date.now();
      const elapsed = now - this.lastRequestTime;
      if (elapsed < MIN_REQUEST_INTERVAL_MS) {
        const waitTime = MIN_REQUEST_INTERVAL_MS - elapsed;
        await sleep(waitTime);
      }

      this.lastRequestTime = Date.now();

      try {
        const result = await item.execute();
        item.resolve(result);
      } catch (err) {
        item.reject(err);
      }
    }

    this.processing = false;
  }

  // Cancel all pending requests of a given priority or higher
  cancelLowPriority(minPriority: number) {
    const cancelled = this.queue.filter((q) => q.priority >= minPriority);
    this.queue = this.queue.filter((q) => q.priority < minPriority);
    cancelled.forEach((q) =>
      q.reject(new Error("Request cancelled — rate limit protection"))
    );
  }

  get pendingCount() {
    return this.queue.length;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Singleton rate limiter shared across all Gemini calls
const rateLimiter = new RateLimiter();

// =============== Retry with backoff for 429 ===============

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = MAX_RETRIES
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const res = await fetch(url, options);

    if (res.status === 429) {
      if (attempt < maxRetries) {
        const backoff = INITIAL_BACKOFF_MS * Math.pow(2, attempt);
        console.warn(
          `Gemini 429 rate limited. Waiting ${backoff / 1000}s before retry ${attempt + 1}/${maxRetries}...`
        );
        await sleep(backoff);
        continue;
      }
      // Final attempt also 429 — return it, caller will handle
      return res;
    }

    if (!res.ok) {
      lastError = new Error(`API error: ${res.status}`);
      // Don't retry non-429 errors
      return res;
    }

    return res;
  }

  throw lastError || new Error("fetchWithRetry exhausted");
}

// =============== Concurrency guard for analysis ===============

let _analysisInProgress = false;

export function isAnalysisInProgress(): boolean {
  return _analysisInProgress;
}

// =============== Translation (non-streaming) ===============
// Priority 0 = high (translation is user-visible, fast)

export async function translateText(
  apiKey: string,
  text: string,
  sourceLang: string,
  targetLang: string
): Promise<string> {
  // Skip empty text
  if (!text.trim()) return "";

  return rateLimiter.enqueue(async () => {
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

    if (!res.ok) return "";

    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
  }, 0); // priority 0 = highest
}

// =============== Streaming Analysis ===============
// Priority 1 = medium (analysis is less urgent than translation)

export async function streamAnalysis(
  apiKey: string,
  text: string,
  targetLang: string,
  onToken: (token: string) => void,
  onDone: (fullText: string) => void,
  onError?: (err: string) => void
): Promise<void> {
  // Concurrency guard: skip if another analysis is already running
  if (_analysisInProgress) {
    console.log("Analysis skipped — another analysis is already in progress");
    return;
  }

  _analysisInProgress = true;

  try {
    await rateLimiter.enqueue(async () => {
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
    }, 1); // priority 1 = medium
  } catch (err) {
    onError?.(String(err));
  } finally {
    _analysisInProgress = false;
  }
}

// =============== Streaming Summary ===============
// Priority 0 = high (user explicitly triggered post-meeting)

export async function streamSummary(
  apiKey: string,
  transcript: string,
  targetLang: string,
  onToken: (token: string) => void,
  onDone: () => void,
  onError?: (err: string) => void
): Promise<void> {
  // Cancel any pending low-priority requests (analysis) when summarizing
  rateLimiter.cancelLowPriority(1);

  try {
    await rateLimiter.enqueue(async () => {
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
    }, 0); // priority 0 = highest
  } catch (err) {
    onError?.(String(err));
  }
}
