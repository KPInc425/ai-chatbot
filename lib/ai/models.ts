export const DEFAULT_CHAT_MODEL: string = "chat-model";

export type ChatModel = {
  id: string;
  name: string;
  description: string;
};

export const chatModels: ChatModel[] = [
  {
    id: "chat-model",
    name: "Grok Vision",
    description: "Advanced multimodal model with vision and text capabilities",
  },
  {
    id: "chat-model-reasoning",
    name: "Grok Reasoning",
    description:
      "Uses advanced chain-of-thought reasoning for complex problems",
  },
  {
    id: "openai-gpt-5-mini",
    name: "OpenAI GPT-5 Mini",
    description: "Lightweight version of GPT-5 optimized for fast and efficient text generation",
  },
  {
    id: "openai-gpt-5-nano",
    name: "OpenAI GPT-5 Nano",
    description: "Ultra-lightweight version of GPT-5 for minimal resource usage",
  },
];
