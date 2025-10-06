
import { customProvider } from "ai";

type CreateOpts = {
  wrapLanguageModel: any;
  extractReasoningMiddleware: any;
};

/**
 * Ollama adapter implementing a LanguageModelV2-like interface.
 *
 * This implementation aims to be compatible with the `ai` SDK's expectations
 * (doGenerate / doStream). For streaming providers you should replace the
 * simple non-streaming implementation in `doStream` with proper streaming
 * handling based on your Ollama server version.
 */
export function createOllamaProvider({ wrapLanguageModel, extractReasoningMiddleware }: CreateOpts) {
  const base = process.env.OLLAMA_URL || "http://localhost:11434";
  // Fetch models from the Ollama server and build language model wrappers.
  async function buildLanguageModels() {
    const languageModels: Record<string, any> = {};

    // try to discover models from /api/models
    try {
      const res = await fetch(`${base}/api/models`);
      if (!res.ok) throw new Error(`Failed to fetch models: ${res.status}`);
      const json = await res.json();

      // json is expected to be an array of models { name, description }
      for (const m of json || []) {
        const name = m.name || m.id;
        languageModels[name] = makeOllamaModel(name, base);
      }
    } catch (err) {
      console.warn("Ollama: could not fetch model list, falling back to defaults", err);
      // Fallback static names that may exist on a default Ollama install
      const fallback = ["ollama-chat", "ollama-reasoning", "ollama-title", "ollama-artifact"];
      for (const n of fallback) languageModels[n] = makeOllamaModel(n, base);
    }

    // Provide some friendly aliases so UI ids like `chat-model` map to a default
    // discovered Ollama model if present.
    const discovered = Object.keys(languageModels);
    if (discovered.length > 0) {
      languageModels["chat-model"] = languageModels[discovered[0]];
      if (discovered.length > 1) languageModels["chat-model-reasoning"] = languageModels[discovered[1]];
    }

    return languageModels;
  }

  function makeOllamaModel(name: string, baseUrl: string) {
    const model: any = {
      specificationVersion: "2.0",
      provider: "ollama",
      supportedUrls: [baseUrl],
      modelId: name,

      async doGenerate({ input }: { input: string }) {
        const url = `${baseUrl}/api/models/${encodeURIComponent(name)}/infer`;
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: input }),
        });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Ollama request failed: ${res.status} ${text}`);
        }

        const data = await res.json();
        const out = data.output ?? data["output"] ?? JSON.stringify(data);
        return { output: typeof out === "string" ? out : JSON.stringify(out) };
      },

      async *doStream({ input }: { input: string }) {
        const url = `${baseUrl}/api/models/${encodeURIComponent(name)}/infer`;
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: input, stream: true }),
        });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Ollama stream failed: ${res.status} ${text}`);
        }

        // Read streamed chunks from the response body (generic approach)
        const reader = (res as any).body?.getReader?.();
        if (!reader) {
          // fallback: non-streaming
          const data = await res.json();
          const out = data.output ?? data["output"] ?? JSON.stringify(data);
          yield { type: "message", text: typeof out === "string" ? out : JSON.stringify(out) };
          return;
        }

        const textDecoder = new TextDecoder();
        let done = false;
        while (!done) {
          const { value, done: d } = await reader.read();
          done = d;
          if (value) {
            const chunk = textDecoder.decode(value);
            // Emit raw chunk; callers may need to handle partial JSON lines
            yield { type: "message", text: chunk };
          }
        }
      },
    };

    return model;
  }

  // Build language model map at initialization and return a provider
  const languageModelsPromise = buildLanguageModels();

  return customProvider({
    languageModels: new Proxy({}, {
      get: (_target: any, prop: string) => {
        // Return a promise-aware wrapper that resolves languageModelsPromise
        // and returns the model by name. The `ai` SDK calls languageModel(id)
        // synchronously, but customProvider typically accepts either model
        // objects or factories; to be safe we return a small wrapper that
        // defers to the discovered model.
        let resolvedModel: any = null;
        const ensure = async () => {
          if (resolvedModel) return resolvedModel;
          const map = await languageModelsPromise;
          resolvedModel = map[prop];
          return resolvedModel;
        };

        // Return an object that proxies doGenerate/doStream to the resolved model
        return {
          modelId: prop,
          async doGenerate(args: any) {
            const m = await ensure();
            if (!m) throw new Error(`model not found: ${String(prop)}`);
            return m.doGenerate(args);
          },
          async *doStream(args: any) {
            const m = await ensure();
            if (!m) throw new Error(`model not found: ${String(prop)}`);
            for await (const chunk of m.doStream(args)) {
              yield chunk;
            }
          },
        };
      },
    } as any),
  });
}
