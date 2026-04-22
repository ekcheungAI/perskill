/**
 * Unified text optimization client.
 * Routes to the active provider based on the context.
 */

import { generateText as kimiGenerateText } from "./kimi";
import { generateText as minimaxGenerateText } from "./minimax";

export type OptimizeMode = "enhance" | "condense";

const SYSTEM_PROMPT_ENHANCE = `You are an expert writing coach and editor. Improve the provided text to make it clearer, more compelling, and better structured. Keep the original intent and meaning intact. Remove filler, tighten prose, and sharpen key points. Return only the improved text — no preamble, no explanation.`;

const SYSTEM_PROMPT_CONDENSE = `You are an expert summarizer. Condense the provided text into a shorter, punchier version that preserves the core message and key points. Use direct language. Remove redundancy. Return only the condensed text — no preamble, no explanation.`;

export async function optimizeText(
  text: string,
  mode: OptimizeMode,
  apiKeyOverride?: string
): Promise<string> {
  if (!text.trim()) return "";

  const systemPrompt = mode === "enhance" ? SYSTEM_PROMPT_ENHANCE : SYSTEM_PROMPT_CONDENSE;

  const userPrompt = `TEXT TO ${mode === "enhance" ? "IMPROVE" : "CONDENSE"}:\n\n${text}`;

  try {
    // Try kimi first
    return await kimiGenerateText({
      systemPrompt,
      userPrompt,
      temperature: 0.6,
      maxTokens: 600,
      apiKeyOverride,
    });
  } catch {
    // Fall back to minimax
    return minimaxGenerateText({
      systemPrompt,
      userPrompt,
      temperature: 0.6,
      maxTokens: 600,
      apiKeyOverride,
    });
  }
}
