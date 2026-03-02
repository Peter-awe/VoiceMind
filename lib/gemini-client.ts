// ============================================================
// gemini-client.ts — Client-side Gemini REST API calls
//
// RATE LIMIT STRATEGY (definitive):
//   1. Global cooldown: on ANY 429, ALL requests pause for 60s
//   2. No retries: retries waste quota — just drop and wait
//   3. Translation uses gemini-2.0-flash-lite (30 RPM free tier)
//   4. Analysis/Summary uses gemini-2.0-flash (10 RPM free tier)
//   5. Single serial queue with 8s spacing between requests
//   6. New requests cancel stale queued ones of same type
// ============================================================

const MODEL_FAST = "gemini-2.0-flash-lite"; // 30 RPM — for translation
const MODEL_SMART = "gemini-2.0-flash";     // 10 RPM — for analysis/summary
const BASE = "https://generativelanguage.googleapis.com/v1beta";

const MIN_GAP_MS = 8000; // 8s between requests

const LANGUAGE_NAMES: Record<string, string> = {
  zh: "Chinese", en: "English", ja: "Japanese", ko: "Korean",
  fr: "French", de: "German", es: "Spanish", pt: "Portuguese",
  ru: "Russian", ar: "Arabic",
};

function langName(c: string) { return LANGUAGE_NAMES[c] || c; }
function sleep(ms: number) { return new Promise<void>(r => setTimeout(r, ms)); }

// ===================== Global 429 Cooldown =====================
// When we get a 429, ALL API calls are blocked for COOLDOWN_MS.
// This ensures the rate-limit window fully resets before we try again.

const COOLDOWN_MS = 60_000; // 60 seconds
let _cooldownUntil = 0;

function enterCooldown() {
  _cooldownUntil = Date.now() + COOLDOWN_MS;
  console.warn(`⏸ Gemini 429 — all requests paused for ${COOLDOWN_MS / 1000}s (until ${new Date(_cooldownUntil).toLocaleTimeString()})`);
  // Clear queue — no point keeping them
  _queue.length = 0;
}

function isCoolingDown(): boolean {
  return Date.now() < _cooldownUntil;
}

// ===================== Serial Queue =====================

type QueueItem = { fn: () => Promise<void>; tag: string };
let _busy = false;
const _queue: QueueItem[] = [];
let _lastReqTime = 0;

async function drain() {
  if (_busy) return;
  _busy = true;
  while (_queue.length > 0) {
    // Check cooldown before each request
    if (isCoolingDown()) {
      const wait = _cooldownUntil - Date.now();
      console.log(`⏸ Cooldown active — waiting ${Math.ceil(wait / 1000)}s`);
      await sleep(wait);
    }

    const item = _queue.shift()!;

    // Enforce minimum gap
    const gap = MIN_GAP_MS - (Date.now() - _lastReqTime);
    if (gap > 0) await sleep(gap);
    _lastReqTime = Date.now();

    try {
      await item.fn();
    } catch (e) {
      console.error(`[gemini] ${item.tag}:`, e);
    }
  }
  _busy = false;
}

function enqueue(tag: string, fn: () => Promise<void>) {
  // If cooling down and queue is empty, still enqueue — drain() will wait
  _queue.push({ fn, tag });
  drain();
}

function cancelQueued(tag: string) {
  for (let i = _queue.length - 1; i >= 0; i--) {
    if (_queue[i].tag === tag) _queue.splice(i, 1);
  }
}

// ===================== Fetch with 429 handling =====================
// NO retries. On 429 → enter cooldown and return the 429 response.

async function safeFetch(url: string, opts: RequestInit): Promise<Response> {
  // Pre-check: if cooling down, don't even try
  if (isCoolingDown()) {
    return new Response(null, { status: 429, statusText: "Cooldown active" });
  }

  const res = await fetch(url, opts);

  if (res.status === 429) {
    enterCooldown();
  }

  return res;
}

// ===================== Analysis guard =====================

let _analysisInFlight = false;
export function isAnalysisInProgress() { return _analysisInFlight; }

// ===================== Translation =====================
// Uses fast/lite model (30 RPM). Cancels stale queued translations.

export function translateText(
  apiKey: string,
  text: string,
  sourceLang: string,
  targetLang: string
): Promise<string> {
  if (!text.trim()) return Promise.resolve("");

  cancelQueued("translate");

  return new Promise<string>((resolve) => {
    enqueue("translate", async () => {
      try {
        const res = await safeFetch(
          `${BASE}/models/${MODEL_FAST}:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{
                role: "user",
                parts: [{
                  text: `Translate from ${langName(sourceLang)} to ${langName(targetLang)}. Return ONLY the translation, nothing else.\n\n${text}`,
                }],
              }],
              generationConfig: { temperature: 0.2, maxOutputTokens: 1024 },
            }),
          }
        );

        if (!res.ok) { resolve(""); return; }

        const data = await res.json();
        resolve(data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "");
      } catch {
        resolve("");
      }
    });
  });
}

// ===================== Streaming Analysis =====================
// Uses smart model. One at a time.

export function streamAnalysis(
  apiKey: string,
  text: string,
  targetLang: string,
  onToken: (fullText: string) => void,
  onDone: (fullText: string) => void,
  onError?: (err: string) => void
): void {
  if (_analysisInFlight) return;
  cancelQueued("analysis");
  _analysisInFlight = true;

  enqueue("analysis", async () => {
    try {
      const res = await safeFetch(
        `${BASE}/models/${MODEL_SMART}:streamGenerateContent?key=${apiKey}&alt=sse`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{
              role: "user",
              parts: [{
                text: `You are an intelligent meeting assistant. Analyze the following transcript and provide brief insights. Focus on: key topics, decisions, action items. Respond in ${langName(targetLang)}. Keep it concise (3-5 bullet points max).\n\nTranscript:\n${text}`,
              }],
            }],
            generationConfig: { temperature: 0.5, maxOutputTokens: 512 },
          }),
        }
      );

      if (!res.ok) { onError?.(`API error: ${res.status}`); return; }
      await readSSE(res, onToken, onDone);
    } catch (err) {
      onError?.(String(err));
    } finally {
      _analysisInFlight = false;
    }
  });
}

// ===================== Streaming Summary =====================

export function streamSummary(
  apiKey: string,
  transcript: string,
  targetLang: string,
  onToken: (chunk: string) => void,
  onDone: () => void,
  onError?: (err: string) => void
): void {
  cancelQueued("translate");
  cancelQueued("analysis");

  enqueue("summary", async () => {
    try {
      const res = await safeFetch(
        `${BASE}/models/${MODEL_SMART}:streamGenerateContent?key=${apiKey}&alt=sse`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{
              role: "user",
              parts: [{
                text: `You are a professional meeting analyst. Generate a structured summary. Respond in ${langName(targetLang)}.

Use these sections:
## Key Points
## Action Items
## Innovations & Ideas
## Open Questions
## Summary

Transcript:\n${transcript}`,
              }],
            }],
            generationConfig: { temperature: 0.5, maxOutputTokens: 2048 },
          }),
        }
      );

      if (!res.ok) { onError?.(`API error: ${res.status}`); return; }
      await readSSEraw(res, onToken, onDone);
    } catch (err) {
      onError?.(String(err));
    }
  });
}

// ===================== SSE Readers =====================

async function readSSE(
  res: Response,
  onToken: (fullText: string) => void,
  onDone: (fullText: string) => void
) {
  const reader = res.body?.getReader();
  if (!reader) return;
  const dec = new TextDecoder();
  let buf = "", full = "";

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() || "";
    for (const l of lines) {
      if (!l.startsWith("data: ")) continue;
      const j = l.slice(6).trim();
      if (!j) continue;
      try {
        const t = JSON.parse(j).candidates?.[0]?.content?.parts?.[0]?.text;
        if (t) { full += t; onToken(full); }
      } catch { /* skip */ }
    }
  }
  onDone(full);
}

async function readSSEraw(
  res: Response,
  onToken: (chunk: string) => void,
  onDone: () => void
) {
  const reader = res.body?.getReader();
  if (!reader) return;
  const dec = new TextDecoder();
  let buf = "";

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() || "";
    for (const l of lines) {
      if (!l.startsWith("data: ")) continue;
      const j = l.slice(6).trim();
      if (!j) continue;
      try {
        const t = JSON.parse(j).candidates?.[0]?.content?.parts?.[0]?.text;
        if (t) onToken(t);
      } catch { /* skip */ }
    }
  }
  onDone();
}
