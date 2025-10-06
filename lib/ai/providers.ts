import { gateway } from "@ai-sdk/gateway";
import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from "ai";
import { isTestEnvironment } from "../constants";

/**
 * Provider selection
 *
 * Set AI_PROVIDER to one of:
 * - gateway (default): use @ai-sdk/gateway (current behavior)
 * - ollama: use the example Ollama adapter in `lib/ai/providers.ollama.ts`
 *
 * The Ollama adapter is provided as a template — it is only loaded when
 * AI_PROVIDER=ollama so the default behaviour is unchanged.
 */
const providerName = process.env.AI_PROVIDER || "gateway";

// default/test provider behavior preserved
const defaultProvider = isTestEnvironment
  ? (() => {
      const {
        artifactModel,
        chatModel,
        reasoningModel,
        titleModel,
      } = require("./models.mock");
      return customProvider({
        languageModels: {
          "chat-model": chatModel,
          "chat-model-reasoning": reasoningModel,
          "title-model": titleModel,
          "artifact-model": artifactModel,
        },
      });
    })()
  : customProvider({
      languageModels: {
        "chat-model": gateway.languageModel("xai/grok-2-vision-1212"),
        "chat-model-reasoning": wrapLanguageModel({
          model: gateway.languageModel("xai/grok-3-mini"),
          middleware: extractReasoningMiddleware({ tagName: "think" }),
        }),
        "title-model": gateway.languageModel("xai/grok-2-1212"),
        "artifact-model": gateway.languageModel("xai/grok-2-1212"),
        // example manual mapping for an OpenAI model
        "openai-gpt-5-mini": gateway.languageModel("openai/gpt-5-mini"),
        "openai-gpt-5-nano": gateway.languageModel("openai/gpt-5-nano"),
      },
    });

// If a custom provider is requested, try to load its module. Keep this
// optional so the repo remains runnable out-of-the-box.
let customSelectedProvider: ReturnType<typeof customProvider> | null = null;
if (providerName === "ollama") {
  try {
    // providers.ollama.ts exports `createOllamaProvider()` which returns a
    // compatible provider created with `customProvider({ languageModels })`.
    // This file is an example adapter and will only be required when
    // AI_PROVIDER=ollama.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { createOllamaProvider } = require("./providers.ollama");
    customSelectedProvider = createOllamaProvider({ wrapLanguageModel, extractReasoningMiddleware });
  } catch (err) {
    console.warn("Failed to load Ollama provider adapter:", err);
    customSelectedProvider = null;
  }
}

export const myProvider = customSelectedProvider ?? defaultProvider;
