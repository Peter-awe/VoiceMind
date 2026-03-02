// ============================================================
// ai-provider.ts — Multi-provider abstraction for KiwiPenNotes
// Supports: Gemini, DeepSeek, Kimi, OpenAI, Claude, Qwen
// ============================================================

export type ProviderName = "gemini" | "deepseek" | "kimi" | "openai" | "claude" | "qwen";

export interface AIProvider {
  readonly name: ProviderName;
  readonly displayName: string;

  translateText(
    text: string,
    sourceLang: string,
    targetLang: string
  ): Promise<string>;

  streamAnalysis(
    text: string,
    targetLang: string,
    onToken: (fullText: string) => void,
    onDone: (fullText: string) => void,
    onError?: (err: string) => void
  ): void;

  streamSummary(
    transcript: string,
    targetLang: string,
    onToken: (chunk: string) => void,
    onDone: () => void,
    onError?: (err: string) => void
  ): void;

  isAnalysisInProgress(): boolean;

  validateKey(): Promise<boolean>;
}

// Provider metadata for UI
export interface ProviderInfo {
  name: ProviderName;
  displayName: string;
  description: string;
  keyUrl: string;
  keyUrlLabel: string;
  keyPlaceholder: string;
  freeInfo: string;
}

export const PROVIDERS: ProviderInfo[] = [
  {
    name: "gemini",
    displayName: "Google Gemini",
    description: "Google's AI model. Best free tier with 30 RPM.",
    keyUrl: "https://aistudio.google.com",
    keyUrlLabel: "aistudio.google.com",
    keyPlaceholder: "AIza...",
    freeInfo: "Free: 30 RPM (lite) / 10 RPM (flash)",
  },
  {
    name: "deepseek",
    displayName: "DeepSeek",
    description: "High quality, very affordable. Popular in China.",
    keyUrl: "https://platform.deepseek.com/api_keys",
    keyUrlLabel: "platform.deepseek.com",
    keyPlaceholder: "sk-...",
    freeInfo: "Pay-as-you-go: ~$0.14/M input tokens",
  },
  {
    name: "kimi",
    displayName: "Kimi (Moonshot)",
    description: "Moonshot AI. Works well in China.",
    keyUrl: "https://platform.moonshot.cn/console/api-keys",
    keyUrlLabel: "platform.moonshot.cn",
    keyPlaceholder: "sk-...",
    freeInfo: "Free trial tokens available",
  },
  {
    name: "openai",
    displayName: "OpenAI (GPT)",
    description: "GPT-4o-mini. Reliable and fast.",
    keyUrl: "https://platform.openai.com/api-keys",
    keyUrlLabel: "platform.openai.com",
    keyPlaceholder: "sk-...",
    freeInfo: "Pay-as-you-go: ~$0.15/M input tokens",
  },
  {
    name: "claude",
    displayName: "Claude (Anthropic)",
    description: "Anthropic's Claude. Strong reasoning.",
    keyUrl: "https://console.anthropic.com/settings/keys",
    keyUrlLabel: "console.anthropic.com",
    keyPlaceholder: "sk-ant-...",
    freeInfo: "Pay-as-you-go: ~$0.25/M input tokens",
  },
  {
    name: "qwen",
    displayName: "Qwen (Alibaba)",
    description: "Alibaba's Tongyi Qianwen. Great Chinese support.",
    keyUrl: "https://dashscope.console.aliyun.com/apiKey",
    keyUrlLabel: "dashscope.console.aliyun.com",
    keyPlaceholder: "sk-...",
    freeInfo: "Free tier available",
  },
];

export function getProviderInfo(name: ProviderName): ProviderInfo {
  return PROVIDERS.find((p) => p.name === name) || PROVIDERS[0];
}

// Factory — dynamically import to keep bundle small
let _cachedProvider: { name: string; key: string; instance: AIProvider } | null = null;

export async function getProvider(
  name: ProviderName,
  apiKey: string
): Promise<AIProvider> {
  // Return cached if same provider + key
  if (_cachedProvider && _cachedProvider.name === name && _cachedProvider.key === apiKey) {
    return _cachedProvider.instance;
  }

  let instance: AIProvider;

  switch (name) {
    case "gemini": {
      const { GeminiProvider } = await import("./providers/gemini");
      instance = new GeminiProvider(apiKey);
      break;
    }
    case "deepseek": {
      const { DeepSeekProvider } = await import("./providers/deepseek");
      instance = new DeepSeekProvider(apiKey);
      break;
    }
    case "kimi": {
      const { KimiProvider } = await import("./providers/kimi");
      instance = new KimiProvider(apiKey);
      break;
    }
    case "openai": {
      const { OpenAIProvider } = await import("./providers/openai");
      instance = new OpenAIProvider(apiKey);
      break;
    }
    case "claude": {
      const { ClaudeProvider } = await import("./providers/claude");
      instance = new ClaudeProvider(apiKey);
      break;
    }
    case "qwen": {
      const { QwenProvider } = await import("./providers/qwen");
      instance = new QwenProvider(apiKey);
      break;
    }
  }

  _cachedProvider = { name, key: apiKey, instance };
  return instance;
}
