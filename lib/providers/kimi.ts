import { OpenAICompatProvider } from "./openai-compat";

export class KimiProvider extends OpenAICompatProvider {
  constructor(apiKey: string) {
    super(apiKey, {
      name: "kimi",
      displayName: "Kimi (Moonshot)",
      baseUrl: "https://api.moonshot.cn/v1",
      model: "moonshot-v1-8k",
      validateUrl: "https://api.moonshot.cn/v1/models",
      minGapMs: 2000,
    });
  }
}
