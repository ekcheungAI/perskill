/**
 * MiniMax API client for board deliberation and text generation.
 * Uses the OpenAI-compatible endpoint.
 * Docs: https://platform.minimax.io/docs/api-reference/text-openai-api
 */

const MINIMAX_BASE_URL = "https://api.minimax.io/v1";
const MINIMAX_MODEL = "MiniMax-M2.7";

export interface KimiMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface KimiChoice {
  index: number;
  message: { role: string; content: string };
  finish_reason: string;
}

export interface KimiResponse {
  id: string;
  model: string;
  choices: KimiChoice[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

function getApiKey(): string {
  return import.meta.env.VITE_MINIMAX_API_KEY ?? "";
}

async function callApi(
  messages: KimiMessage[],
  apiKeyOverride?: string,
  modelOverride?: string
): Promise<string> {
  const key = apiKeyOverride || getApiKey();
  if (!key) {
    throw new Error(
      "MiniMax API key not configured. Add VITE_MINIMAX_API_KEY to your .env file, or set a key in Settings."
    );
  }

  const response = await fetch(`${MINIMAX_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: modelOverride || MINIMAX_MODEL,
      messages,
      temperature: 0.8,
      max_tokens: 1600,
    }),
  });

  if (!response.ok) {
    let detail = "";
    try {
      const err = await response.json();
      detail = err.error?.message || err.error?.type || "";
    } catch {
      // ignore parse errors
    }
    throw new Error(
      `MiniMax API error ${response.status}${detail ? `: ${detail}` : ""}`
    );
  }

  const data: KimiResponse = await response.json();
  const content = data.choices[0]?.message?.content?.trim();
  if (!content) {
    throw new Error("MiniMax returned an empty response.");
  }
  return content;
}

/**
 * Generate a single deliberation turn from a persona.
 */
export async function generateDeliberation(
  systemPrompt: string,
  userPrompt: string,
  apiKeyOverride?: string
): Promise<string> {
  const messages: KimiMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];
  return callApi(messages, apiKeyOverride);
}

/**
 * Generate all deliberation turns for a board session in a single API call.
 */
export async function generateFullDeliberation(params: {
  briefQuestion: string;
  briefGoal?: string;
  briefDeadline?: string;
  briefConstraints?: string;
  briefKnownFacts?: string;
  memberPrompts: Array<{
    personaName: string;
    personaTitle: string;
    aiPersonaPrompt: string;
    seatRole: string;
    seatRoleLabel: string;
  }>;
  apiKeyOverride?: string;
}): Promise<string> {
  const { briefQuestion, briefGoal, briefDeadline, briefConstraints, briefKnownFacts, memberPrompts } = params;

  if (!memberPrompts.length) return "";

  const membersBlock = memberPrompts
    .map(
      ({ personaName, personaTitle, aiPersonaPrompt, seatRoleLabel }) =>
        `## ${personaName} — ${seatRoleLabel}\n${aiPersonaPrompt}`
    )
    .join("\n\n");

  const systemPrompt = `You are facilitating a Virtual Expert Board session. Below are the board members with their roles and behavioral personas. Generate a realistic, in-character deliberation following the flow described. Each member should speak in their authentic voice based on their persona description.`;

  const userPrompt = `DECISION QUESTION: ${briefQuestion}${briefGoal ? `\nGoal: ${briefGoal}` : ""}${briefDeadline ? `\nDeadline: ${briefDeadline}` : ""}${briefConstraints ? `\nConstraints: ${briefConstraints}` : ""}${briefKnownFacts ? `\nKnown Facts: ${briefKnownFacts}` : ""}

BOARD MEMBERS:
${membersBlock}

DISCUSSION FLOW:
Follow this structure and have each board member contribute in character:
1. Initial positions — each member states their position on the question.
2. Key arguments — each member gives their strongest reasoning.
3. Challenges — the Contrarian and Risk Reviewer challenge weak assumptions.
4. Rebuttals — members respond to challenges.
5. What would change my mind — each member states conditions that would reverse their view.
6. Final recommendation — the Chair synthesizes and recommends a path forward with dissenting notes if applicable.

Speak in each persona's authentic voice. Include disagreement where natural.`;

  return generateDeliberation(systemPrompt, userPrompt, params.apiKeyOverride);
}

/**
 * Generate text using the MiniMax model — used for the Optimize feature.
 */
export async function generateText(params: {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
  apiKeyOverride?: string;
}): Promise<string> {
  const messages: KimiMessage[] = [
    { role: "system", content: params.systemPrompt },
    { role: "user", content: params.userPrompt },
  ];

  const response = await fetch(`${MINIMAX_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${params.apiKeyOverride || getApiKey()}`,
    },
    body: JSON.stringify({
      model: MINIMAX_MODEL,
      messages,
      temperature: params.temperature ?? 0.7,
      max_tokens: params.maxTokens ?? 800,
    }),
  });

  if (!response.ok) {
    let detail = "";
    try {
      const err = await response.json();
      detail = err.error?.message || err.error?.type || "";
    } catch {
      // ignore
    }
    throw new Error(`MiniMax API error ${response.status}${detail ? `: ${detail}` : ""}`);
  }

  const data: KimiResponse = await response.json();
  return data.choices[0]?.message?.content?.trim() ?? "";
}
