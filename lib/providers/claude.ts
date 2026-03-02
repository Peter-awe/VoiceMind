// Claude Provider — Anthropic
// Auth: x-api-key header (NOT Bearer)
// SSE format: event: content_block_delta / data: {"delta":{"text":"..."}}
// Requires: anthropic-dangerous-direct-browser-access header for CORS

import { RateLimiter } from "./rate-limiter";
import type { AIProvider } from "../ai-provider";
import { LANG_NAMES } from "./lang";

const MODEL = "claude-3-5-haiku-latest";
const BASE = "https://api.anthropic.com/v1";

export class ClaudeProvider implements AIProvider {
  readonly name = "claude" as const;
  readonly displayName = "Claude (Anthropic)";
  private rl = new RateLimiter(2000, 60_000);
  private analysisInFlight = false;

  constructor(private apiKey: string) {}

  isAnalysisInProgress() { return this.analysisInFlight; }

  async validateKey(): Promise<boolean> {
    try {
      // Use a minimal messages call to validate
      const res = await fetch(`${BASE}/messages`, {
        method: "POST",
        headers: this.headers(),
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 5,
          messages: [{ role: "user", content: "Hi" }],
        }),
      });
      // 200 = valid, 401 = invalid key, anything else = might be valid
      return res.status !== 401;
    } catch { return false; }
  }

  translateText(text: string, src: string, tgt: string): Promise<string> {
    if (!text.trim()) return Promise.resolve("");
    this.rl.cancelQueued("translate");

    return new Promise<string>((resolve) => {
      this.rl.enqueue("translate", async () => {
        try {
          const res = await this.post(
            `Translate from ${LANG_NAMES[src]||src} to ${LANG_NAMES[tgt]||tgt}. Return ONLY the translation.\n\n${text}`,
            false, 1024
          );
          if (!res.ok) { resolve(""); return; }
          const d = await res.json();
          resolve(d.content?.[0]?.text?.trim() || "");
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
        const res = await this.post(
          `You are a meeting assistant. Analyze this transcript. Key topics, decisions, action items. Respond in ${LANG_NAMES[tgt]||tgt}. Concise, 3-5 bullets.\n\nTranscript:\n${text}`,
          true, 512
        );
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
        const res = await this.post(
          `You are a meeting analyst. Generate a structured summary in ${LANG_NAMES[tgt]||tgt}.\n\nSections:\n## Key Points\n## Action Items\n## Innovations & Ideas\n## Open Questions\n## Summary\n\nTranscript:\n${transcript}`,
          true, 2048
        );
        if (!res.ok) { onError?.(`API error: ${res.status}`); return; }
        await this.readSSEraw(res, onToken, onDone);
      } catch (e) { onError?.(String(e)); }
    });
  }

  // --- internals ---

  private headers(): Record<string, string> {
    return {
      "Content-Type": "application/json",
      "x-api-key": this.apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    };
  }

  private async post(userMessage: string, stream: boolean, maxTokens: number): Promise<Response> {
    if (this.rl.isCoolingDown()) return new Response(null, { status: 429 });

    const res = await fetch(`${BASE}/messages`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({
        model: MODEL,
        max_tokens: maxTokens,
        stream,
        messages: [{ role: "user", content: userMessage }],
      }),
    });

    if (res.status === 429) this.rl.enterCooldown();
    return res;
  }

  // Claude SSE format:
  // event: content_block_delta
  // data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"..."}}
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
        const d = l.slice(6).trim();
        if (!d) continue;
        try {
          const parsed = JSON.parse(d);
          const t = parsed.delta?.text;
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
        const d = l.slice(6).trim();
        if (!d) continue;
        try {
          const t = JSON.parse(d).delta?.text;
          if (t) onToken(t);
        } catch {/* */}
      }
    }
    onDone();
  }
}
