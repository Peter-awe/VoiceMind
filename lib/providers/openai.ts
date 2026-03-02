import { OpenAICompatProvider } from "./openai-compat";

export class OpenAIProvider extends OpenAICompatProvider {
  constructor(apiKey: string) {
    super(apiKey, {
      name: "openai",
      displayName: "OpenAI (GPT)",
      baseUrl: "https://api.openai.com/v1",
      model: "gpt-4o-mini",
      validateUrl: "https://api.openai.com/v1/models",
      minGapMs: 2000,
    });
  }
}
