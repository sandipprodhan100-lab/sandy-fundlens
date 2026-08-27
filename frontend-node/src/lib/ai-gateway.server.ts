import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

/** Shared provider for Lovable AI Gateway. Server-only: reads the key at call time. */
export function createLovableAiGatewayProvider(apiKey: string) {
  return createOpenAICompatible({
    name: "lovable",
    baseURL: "https://ai.gateway.lovable.dev/v1",
    headers: { "Lovable-API-Key": apiKey },
  });
}

export const ANALYST_MODEL = "google/gemini-3.6-flash";
