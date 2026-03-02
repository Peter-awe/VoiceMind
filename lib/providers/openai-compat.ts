// ============================================================
// openai-compat.ts — Base class for OpenAI-compatible providers
// Works for: OpenAI, DeepSeek, Kimi, Qwen
// Auth: Authorization: Bearer <key>
// SSE: data: {"choices":[{"delta":{"content":"..."}}]}
// ============================================================

import { RateLimiter } from "./rate-limiter";
import type { AIProvider, ProviderName } from "../ai-provider";
import { LANG_NAMES } from "./lang";

export interface OpenAICompatConfig {
  name: ProviderName;
  displayName: string;
  baseUrl: string;
  model: string;
  validateUrl?: string; // defaults to baseUrl + "/models"
  minGapMs?: number;
  cooldownMs?: number;
  extraHeaders?: Record<string, string>;
}

export class OpenAICompatProvider implements AIProvider {
  readonly name: ProviderName;
  readonly displayName: string;
  private rl: RateLimiter;
  private analysisInFlight = false;
  private baseUrl: string;
  private model: string;
  private validateEndpoint: string;
  private extraHeaders: Record<string, string>;

  constructor(private apiKey: string, config: OpenAICompatConfig) {
    this.name = config.name;
    this.displayName = config.displayName;
    this.baseUrl = config.baseUrl;
    this.model = config.model;
    this.validateEndpoint = config.validateUrl || `${config.baseUrl}/models`;
    this.extraHeaders = config.extraHeaders || {};
    this.rl = new RateLimiter(config.minGapMs ?? 3000, config.cooldownMs ?? 60_000);
  }

  isAnalysisInProgress() { return this.analysisInFlight; }

  async validateKey(): Promise<boolean> {
    try {
      const res = await fetch(this.validateEndpoint, {
        headers: { Authorization: `Bearer ${this.apiKey}`, ...this.extraHeaders },
      });
      return res.ok;
    } catch { return false; }
  }

  translateText(text: string, src: string, tgt: string): Promise<string> {
    if (!text.trim()) return Promise.resolve("");
    this.rl.cancelQueued("translate");

    return new Promise<string>((resolve) => {
      this.rl.enqueue("translate", async () => {
        try {
          const res = await this.chat(
            [{ role: "user", content: `Translate from ${LANG_NAMES[src]||src} to ${LANG_NAMES[tgt]||tgt}. Return ONLY the translation.\n\n${text}` }],
            false, 1024, 0.2
          );
          if (!res.ok) { resolve(""); return; }
          const d = await res.json();
          resolve(d.choices?.[0]?.message?.content?.trim() || "");
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
        const res = await this.chat(
          [{ role: "user", content: `You are a meeting assistant. Analyze this transcript. Key topics, decisions, action items. Respond in ${LANG_NAMES[tgt]||tgt}. Concise, 3-5 bullets.\n\nTranscript:\n${text}` }],
          true, 512, 0.5
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
        const res = await this.chat(
          [{ role: "user", content: `You are a meeting analyst. Generate a structured summary in ${LANG_NAMES[tgt]||tgt}.\n\nSections:\n## Key Points\n## Action Items\n## Innovations & Ideas\n## Open Questions\n## Summary\n\nTranscript:\n${transcript}` }],
          true, 2048, 0.5
        );
        if (!res.ok) { onError?.(`API error: ${res.status}`); return; }
        await this.readSSEraw(res, onToken, onDone);
      } catch (e) { onError?.(String(e)); }
    });
  }

  // --- internals ---

  private async chat(
    messages: { role: string; content: string }[],
    stream: boolean,
    maxTokens: number,
    temperature: number
  ): Promise<Response> {
    if (this.rl.isCoolingDown()) return new Response(null, { status: 429 });

    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
        ...this.extraHeaders,
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        stream,
        max_tokens: maxTokens,
        temperature,
      }),
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
        const d = l.slice(6).trim();
        if (d === "[DONE]") continue;
        try {
          const c = JSON.parse(d).choices?.[0]?.delta?.content;
          if (c) { full += c; onToken(full); }
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
        if (d === "[DONE]") continue;
        try {
          const c = JSON.parse(d).choices?.[0]?.delta?.content;
          if (c) onToken(c);
        } catch {/* */}
      }
    }
    onDone();
  }
}
