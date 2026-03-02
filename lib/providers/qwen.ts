import { OpenAICompatProvider } from "./openai-compat";

export class QwenProvider extends OpenAICompatProvider {
  constructor(apiKey: string) {
    super(apiKey, {
      name: "qwen",
      displayName: "Qwen (Alibaba)",
      baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
      model: "qwen-turbo",
      validateUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1/models",
      minGapMs: 2000,
    });
  }
}
