import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

/**
 * AI Provider for MF Lens Analyst:
 * Connects directly to Google Gemini via its OpenAI-compatible endpoint,
 * or Lovable AI Gateway if configured.
 */
export function getAiModel() {
  const geminiKey =
    process.env["GEMINI_API_KEY"] ||
    process.env["GOOGLE_GENERATIVE_AI_API_KEY"] ||
    process.env["GOOGLE_API_KEY"];

  if (geminiKey) {
    const provider = createOpenAICompatible({
      name: "gemini",
      baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
      apiKey: geminiKey,
    });
    return provider("gemini-2.5-flash");
  }

  const lovableKey = process.env["LOVABLE_API_KEY"];
  if (lovableKey) {
    const provider = createOpenAICompatible({
      name: "lovable",
      baseURL: "https://ai.gateway.lovable.dev/v1",
      headers: { "Lovable-API-Key": lovableKey },
    });
    return provider("google/gemini-2.5-flash");
  }

  return null;
}

export const ANALYST_MODEL = "gemini-2.5-flash";
