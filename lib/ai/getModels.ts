import { chatModels as staticChatModels } from "./models";

type ModelSummary = { id: string; name: string; description?: string };

export async function getAvailableModels(): Promise<{ dynamic: boolean; models: ModelSummary[] }> {
  const provider = process.env.AI_PROVIDER || "gateway";

  if (provider === "ollama") {
    const base = process.env.OLLAMA_URL || "http://localhost:11434";
    try {
      const res = await fetch(`${base}/api/models`);
      if (!res.ok) {
        throw new Error(`Ollama models fetch failed: ${res.status}`);
      }
      const json = await res.json();
      // Ollama's /api/models returns an array of { name, ... }
      const models = (json || []).map((m: any) => ({
        id: m.name || m.id,
        name: m.name || m.id,
        description: m.description || "",
      }));

      return { dynamic: true, models };
    } catch (err) {
      console.warn("Failed to query Ollama for models:", err);
      // fall back to static models
      return { dynamic: false, models: staticChatModels };
    }
  }

  // default: return static models
  return { dynamic: false, models: staticChatModels };
}

export type ModelSummaryType = ModelSummary;
