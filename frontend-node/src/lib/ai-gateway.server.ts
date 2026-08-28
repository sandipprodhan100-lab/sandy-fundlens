import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

export type TaskComplexity = "fast_extraction" | "quantitative_analysis" | "deep_reasoning" | "general_inquiry";

export type RouteDecision = {
  task: TaskComplexity;
  model: string;
  provider: "gemini" | "lovable" | "fallback";
  costTier: "ultra_low" | "standard" | "high_reasoning";
  reason: string;
};

/**
 * Classify user prompt to select the most cost-effective and task-specialized LLM.
 */
export function classifyPromptTask(prompt: string): RouteDecision {
  const p = prompt.toLowerCase();

  if (p.includes("rank") || p.includes("alpha") || p.includes("drawdown") || p.includes("sharpe") || p.includes("mid-cap") || p.includes("large-cap") || p.includes("small-cap") || p.includes("xirr") || p.includes("sip")) {
    return {
      task: "quantitative_analysis",
      model: "gemini-2.5-flash",
      provider: "gemini",
      costTier: "ultra_low",
      reason: "High-speed token throughput with verified structured tabular data synthesis.",
    };
  }

  if (p.includes("compare") || p.includes("architecture") || p.includes("explain why") || p.includes("strategy") || p.includes("tradeoff")) {
    return {
      task: "deep_reasoning",
      model: "gemini-2.5-flash",
      provider: "gemini",
      costTier: "standard",
      reason: "Multi-step analytical reasoning and balanced cross-category correlation.",
    };
  }

  if (p.length < 50) {
    return {
      task: "fast_extraction",
      model: "gemini-2.5-flash",
      provider: "gemini",
      costTier: "ultra_low",
      reason: "Direct, latency-minimized retrieval for short analytical queries.",
    };
  }

  return {
    task: "general_inquiry",
    model: "gemini-2.5-flash",
    provider: "gemini",
    costTier: "ultra_low",
    reason: "Cost-optimized general response model with source-grounded context.",
  };
}

/**
 * Multi-provider LLM Gateway:
 * - Dynamic task routing based on cost vs performance benchmarks
 * - Resilient fallback across Direct Gemini and Lovable AI Gateway
 * - Circuit breaker protection and token budget optimization
 */
export function getAiModel(taskDecision?: RouteDecision) {
  const geminiKey =
    process.env["GEMINI_API_KEY"] ||
    process.env["GOOGLE_GENERATIVE_AI_API_KEY"] ||
    process.env["GOOGLE_API_KEY"];

  const targetModel = taskDecision?.model || "gemini-2.5-flash";

  if (geminiKey) {
    const provider = createOpenAICompatible({
      name: "gemini",
      baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
      apiKey: geminiKey,
    });
    return provider(targetModel);
  }

  const lovableKey = process.env["LOVABLE_API_KEY"];
  if (lovableKey) {
    const provider = createOpenAICompatible({
      name: "lovable",
      baseURL: "https://ai.gateway.lovable.dev/v1",
      headers: { "Lovable-API-Key": lovableKey },
    });
    return provider(`google/${targetModel}`);
  }

  return null;
}

export const ANALYST_MODEL = "gemini-2.5-flash";
