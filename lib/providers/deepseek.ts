import { OpenAICompatProvider } from "./openai-compat";

export class DeepSeekProvider extends OpenAICompatProvider {
  constructor(apiKey: string) {
    super(apiKey, {
      name: "deepseek",
      displayName: "DeepSeek",
      baseUrl: "https://api.deepseek.com/v1",
      model: "deepseek-chat",
      validateUrl: "https://api.deepseek.com/v1/models",
      minGapMs: 2000,
    });
  }
}
