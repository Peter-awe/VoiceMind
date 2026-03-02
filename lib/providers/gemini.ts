// Gemini Provider — Google AI
// Auth: ?key= query param
// SSE format: data: {"candidates":[{"content":{"parts":[{"text":"..."}]}}]}

import { RateLimiter } from "./rate-limiter";
import type { AIProvider } from "../ai-provider";
import { LANG_NAMES } from "./lang";

const MODEL_FAST = "gemini-2.0-flash-lite";
const MODEL_SMART = "gemini-2.0-flash";
const BASE = "https://generativelanguage.googleapis.com/v1beta";

export class GeminiProvider implements AIProvider {
  readonly name = "gemini" as const;
  readonly displayName = "Google Gemini";
  private rl = new RateLimiter(8000, 60_000);
  private analysisInFlight = false;

  constructor(private apiKey: string) {}

  isAnalysisInProgress() { return this.analysisInFlight; }

  async validateKey(): Promise<boolean> {
    try {
      const res = await fetch(`${BASE}/models?key=${this.apiKey}`);
      return res.ok;
    } catch { return false; }
  }

  translateText(text: string, src: string, tgt: string): Promise<string> {
    if (!text.trim()) return Promise.resolve("");
    this.rl.cancelQueued("translate");

    return new Promise<string>((resolve) => {
      this.rl.enqueue("translate", async () => {
        try {
          const res = await this.post(MODEL_FAST, false, {
            contents: [{ role: "user", parts: [{ text: `Translate from ${LANG_NAMES[src]||src} to ${LANG_NAMES[tgt]||tgt}. Return ONLY the translation.\n\n${text}` }] }],
            generationConfig: { temperature: 0.2, maxOutputTokens: 1024 },
          });
          if (!res.ok) { resolve(""); return; }
          const d = await res.json();
          resolve(d.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "");
        } catch { resolve(""); }
      });
    });
  }

  streamAnalysis(text: string, tgt: string, onToken: (f: string) => void, onDone: (f: string) => void, onError?: (e: string) => void) {
    if (this.analysisInFlight) return;
    this.rl.cancelQueued("analysis");
    this.analysisInFlight = true;

    this.rl.enqueue("analysis", async () => {
      try {
        const res = await this.post(MODEL_SMART, true, {
          contents: [{ role: "user", parts: [{ text: `You are a meeting assistant. Analyze this transcript. Focus on key topics, decisions, action items. Respond in ${LANG_NAMES[tgt]||tgt}. Keep concise (3-5 bullets).\n\nTranscript:\n${text}` }] }],
          generationConfig: { temperature: 0.5, maxOutputTokens: 512 },
        });
        if (!res.ok) { onError?.(`API error: ${res.status}`); return; }
        await this.readSSE(res, onToken, onDone);
      } catch (e) { onError?.(String(e)); }
      finally { this.analysisInFlight = false; }
    });
  }

  streamSummary(transcript: string, tgt: string, onToken: (c: string) => void, onDone: () => void, onError?: (e: string) => void) {
    this.rl.cancelQueued("translate");
    this.rl.cancelQueued("analysis");

    this.rl.enqueue("summary", async () => {
      try {
        const res = await this.post(MODEL_SMART, true, {
          contents: [{ role: "user", parts: [{ text: `You are a meeting analyst. Generate a structured summary in ${LANG_NAMES[tgt]||tgt}.\n\nSections:\n## Key Points\n## Action Items\n## Innovations & Ideas\n## Open Questions\n## Summary\n\nTranscript:\n${transcript}` }] }],
          generationConfig: { temperature: 0.5, maxOutputTokens: 2048 },
        });
        if (!res.ok) { onError?.(`API error: ${res.status}`); return; }
        await this.readSSEraw(res, onToken, onDone);
      } catch (e) { onError?.(String(e)); }
    });
  }

  // --- internals ---

  private async post(model: string, stream: boolean, body: object): Promise<Response> {
    if (this.rl.isCoolingDown()) {
      return new Response(null, { status: 429 });
    }
    const endpoint = stream
      ? `${BASE}/models/${model}:streamGenerateContent?key=${this.apiKey}&alt=sse`
      : `${BASE}/models/${model}:generateContent?key=${this.apiKey}`;
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.status === 429) this.rl.enterCooldown();
    return res;
  }

  private async readSSE(res: Response, onToken: (f: string) => void, onDone: (f: string) => void) {
    const reader = res.body?.getReader();
    if (!reader) return;
    const dec = new TextDecoder();
    let buf = "", full = "";
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const lines = buf.split("\n"); buf = lines.pop() || "";
      for (const l of lines) {
        if (!l.startsWith("data: ")) continue;
        try {
          const t = JSON.parse(l.slice(6).trim()).candidates?.[0]?.content?.parts?.[0]?.text;
          if (t) { full += t; onToken(full); }
        } catch {/* */}
      }
    }
    onDone(full);
  }

  private async readSSEraw(res: Response, onToken: (c: string) => void, onDone: () => void) {
    const reader = res.body?.getReader();
    if (!reader) return;
    const dec = new TextDecoder();
    let buf = "";
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const lines = buf.split("\n"); buf = lines.pop() || "";
      for (const l of lines) {
        if (!l.startsWith("data: ")) continue;
        try {
          const t = JSON.parse(l.slice(6).trim()).candidates?.[0]?.content?.parts?.[0]?.text;
          if (t) onToken(t);
        } catch {/* */}
      }
    }
    onDone();
  }
}
