import type { Persona } from "./personas";

// ─── Seat Roles ─────────────────────────────────────────────────────────────────

export type SeatRole =
  | "chair"
  | "domain_specialist"
  | "operator"
  | "contrarian"
  | "risk_reviewer";

export const SEAT_ROLE_CONFIG: Record<
  SeatRole,
  { label: string; description: string; icon: string }
> = {
  chair: {
    label: "Chair",
    description: "Synthesizes tradeoffs and makes the final recommendation",
    icon: "C",
  },
  domain_specialist: {
    label: "Domain Specialist",
    description: "Supplies category-specific expertise and opportunity view",
    icon: "D",
  },
  operator: {
    label: "Operator",
    description: "Focuses on execution feasibility, resourcing, and constraints",
    icon: "O",
  },
  contrarian: {
    label: "Contrarian",
    description: "Challenges consensus and tests weak assumptions",
    icon: "X",
  },
  risk_reviewer: {
    label: "Risk Reviewer",
    description: "Surfaces downside, failure paths, and mitigation actions",
    icon: "R",
  },
};

// ─── Board Status ───────────────────────────────────────────────────────────────

export type BoardStatus =
  | "draft"
  | "intake"
  | "deliberating"
  | "synthesizing"
  | "complete";

export const BOARD_STATUS_CONFIG: Record<
  BoardStatus,
  { label: string; color: string }
> = {
  draft: { label: "Draft", color: "#9CA3AF" },
  intake: { label: "Intake", color: "#6366F1" },
  deliberating: { label: "In Session", color: "#F59E0B" },
  synthesizing: { label: "Synthesizing", color: "#8B5CF6" },
  complete: { label: "Complete", color: "#10B981" },
};

// ─── Depth Mode ─────────────────────────────────────────────────────────────────

export type DepthMode = "quick" | "standard" | "deep_research";

export const DEPTH_MODE_CONFIG: Record<
  DepthMode,
  { label: string; description: string }
> = {
  quick: {
    label: "Quick",
    description: "Fast round — initial positions + final recommendation",
  },
  standard: {
    label: "Standard",
    description: "Full round with challenges and rebuttals",
  },
  deep_research: {
    label: "Deep Research",
    description: "Research packet + structured debate + dissent memo",
  },
};

// ─── Discussion Turn Types ──────────────────────────────────────────────────────

export type DiscussionStage =
  | "initial_position"
  | "key_argument"
  | "challenge"
  | "rebuttal"
  | "what_would_change_mind"
  | "final_recommendation";

export const DISCUSSION_STAGE_CONFIG: Record<
  DiscussionStage,
  { label: string; description: string }
> = {
  initial_position: {
    label: "Initial Position",
    description: "Each member's opening stance on the decision",
  },
  key_argument: {
    label: "Key Argument",
    description: "The strongest reasoning behind their position",
  },
  challenge: {
    label: "Challenge",
    description: "Contrarian / risk reviewer tests weak assumptions",
  },
  rebuttal: {
    label: "Rebuttal",
    description: "Members respond to challenges",
  },
  what_would_change_mind: {
    label: "What Would Change My Mind",
    description: "Conditions that would flip their recommendation",
  },
  final_recommendation: {
    label: "Final Recommendation",
    description: "Chair's synthesis with majority and dissent view",
  },
};

// ─── Core Objects ───────────────────────────────────────────────────────────────

export type AttachmentType = "url" | "text";

export interface BriefAttachment {
  type: AttachmentType;
  name: string;
  content: string; // URL for type=url, raw text for type=text
}

export interface BoardBrief {
  question: string;
  goal?: string;
  deadline?: string;
  successCriteria?: string;
  constraints?: string;
  knownFacts?: string;
  openQuestions?: string;
  attachments?: BriefAttachment[]; // text files + URLs
}

export interface BoardMember {
  id: string; // unique within session
  personaId: string; // links to personas.ts
  role: SeatRole;
  inclusionReason?: string;
  confidenceNote?: string;
}

export interface ResearchPacket {
  summary: string;
  assumptions: string[];
  evidence: string[];
  openQuestions: string[];
  sourceUrls: string[];
}

export interface DiscussionTurn {
  id: string;
  memberId: string; // BoardMember.id
  stage: DiscussionStage;
  content: string;
  references?: string[]; // persona field references
  stance?: "agree" | "disagree" | "neutral";
  createdAt: string;
}

export interface DecisionOutcome {
  recommendation: string;
  confidence: "low" | "medium" | "high";
  confidenceReason?: string;
  keyReasons: string[];
  majorDisagreements: string[];
  primaryRisks: string[];
  mitigationSteps: string[];
  nextActions: string[];
  dissentMemo?: string;
}

export interface BoardSession {
  id: string;
  title: string;
  brief: BoardBrief;
  mode: DepthMode;
  status: BoardStatus;
  members: BoardMember[];
  researchPacket?: ResearchPacket;
  turns: DiscussionTurn[];
  outcome?: DecisionOutcome;
  createdAt: string;
  updatedAt: string;
}

// ─── Factory Helpers ────────────────────────────────────────────────────────────

export function createBoardSession(overrides?: Partial<BoardSession>): BoardSession {
  const now = new Date().toISOString();
  return {
    id: generateId(),
    title: "Untitled Board Session",
    brief: {
      question: "",
    },
    mode: "standard",
    status: "draft",
    members: [],
    turns: [],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

export function createBoardMember(
  personaId: string,
  role: SeatRole = "domain_specialist",
  overrides?: Partial<BoardMember>
): BoardMember {
  return {
    id: generateId(),
    personaId,
    role,
    ...overrides,
  };
}

export function createDiscussionTurn(
  memberId: string,
  stage: DiscussionStage,
  content: string,
  overrides?: Partial<DiscussionTurn>
): DiscussionTurn {
  return {
    id: generateId(),
    memberId,
    stage,
    content,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

export function generateId(): string {
  return crypto.randomUUID();
}

// ─── Prompt Generation ──────────────────────────────────────────────────────────

export function generateBoardPrompt(
  session: BoardSession,
  personas: Persona[]
): string {
  const memberPersonas = session.members
    .map((m) => personas.find((p) => p.id === m.personaId))
    .filter(Boolean) as Persona[];

  if (memberPersonas.length === 0) return "";

  const brief = session.brief;
  const question = brief.question || "What is your recommendation?";

  const memberBlocks = memberPersonas
    .map((p) => {
      const role = session.members.find((m) => m.personaId === p.id)?.role ?? "domain_specialist";
      const roleLabel = SEAT_ROLE_CONFIG[role].label.toUpperCase();
      return "## " + p.name + " [" + roleLabel + "]\n" + p.aiPersonaPrompt;
    })
    .join("\n\n");

  const goal = brief.goal ? "\nGoal: " + brief.goal : "";
  const deadline = brief.deadline ? "\nDeadline: " + brief.deadline : "";
  const constraints = brief.constraints ? "\nConstraints: " + brief.constraints : "";
  const knownFacts = brief.knownFacts ? "\nKnown Facts: " + brief.knownFacts : "";

  return [
    "You are facilitating a virtual expert board session.",
    "",
    "═══════════════════════════════════════════════════════",
    "DECISION BRIEF",
    "═══════════════════════════════════════════════════════",
    "Question: " + question + goal + deadline + constraints + knownFacts,
    "",
    "═══════════════════════════════════════════════════════",
    "BOARD MEMBERS",
    "═══════════════════════════════════════════════════════",
    memberBlocks,
    "",
    "═══════════════════════════════════════════════════════",
    "DISCUSSION FLOW (follow in order)",
    "═══════════════════════════════════════════════════════",
    "1. Each member states their INITIAL POSITION on the question.",
    "2. Each member shares their KEY ARGUMENT — their strongest reasoning.",
    "3. Contrarian / Risk Reviewer issues CHALLENGES to weak assumptions.",
    "4. All members offer REBUTTALS to the challenges.",
    "5. Each member answers: WHAT WOULD CHANGE MY MIND?",
    "6. The CHAIR synthesizes a FINAL RECOMMENDATION with majority and dissent.",
    "",
    "═══════════════════════════════════════════════════════",
    "SYNTHESIS RULES",
    "═══════════════════════════════════════════════════════",
    "- Blend each person's vocabulary patterns and speech rhythm",
    "- Apply their decision-making frameworks to the specific question",
    "- When perspectives conflict, surface the tension explicitly",
    "- Chair should produce a clear, actionable recommendation",
    "- Include dissenting views alongside the majority recommendation",
  ].join("\n");
}

export function generateBoardMemoMarkdown(
  session: BoardSession,
  personas: Persona[]
): string {
  const memberPersonas = session.members
    .map((m) => personas.find((p) => p.id === m.personaId))
    .filter(Boolean) as Persona[];

  const brief = session.brief;
  const outcome = session.outcome;
  const now = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const memberList = session.members
    .map((m) => {
      const p = personas.find((x) => x.id === m.personaId);
      const name = p ? p.name : m.personaId;
      const role = SEAT_ROLE_CONFIG[m.role].label;
      return "- **" + name + "** — " + role;
    })
    .join("\n");

  const turnBlocks = session.turns
    .map((t) => {
      const member = session.members.find((m) => m.id === t.memberId);
      const p = member ? personas.find((x) => x.id === member.personaId) : null;
      const name = p ? p.name : "Member";
      const stageLabel = DISCUSSION_STAGE_CONFIG[t.stage].label;
      return "### " + name + " [" + stageLabel + "]\n\n" + t.content;
    })
    .join("\n\n");

  function buildRecommendation(o: DecisionOutcome | undefined): string {
    if (!o) return "_Recommendation not yet generated._";
    const dissent = o.dissentMemo ? "\n### Dissent Memo\n" + o.dissentMemo : "";
    const lines: string[] = [
      "## Recommendation",
      "",
      "**Confidence:** " + o.confidence.toUpperCase() + " — " + (o.confidenceReason ?? ""),
      "",
      "### Recommended Path",
      o.recommendation,
      "",
      "### Key Reasons",
      ...o.keyReasons.map((r) => "- " + r),
      "",
      "### Major Disagreements",
      ...(o.majorDisagreements.length > 0
        ? o.majorDisagreements.map((d) => "- " + d)
        : ["_No major disagreements._"]),
      "",
      "### Primary Risks",
      ...o.primaryRisks.map((r) => "- " + r),
      "",
      "### Mitigation Steps",
      ...o.mitigationSteps.map((m) => "- " + m),
      "",
      "### Next Actions",
      ...o.nextActions.map((n) => "- " + n),
      dissent,
    ];
    return lines.join("\n");
  }

  const lines: string[] = [
    "# Board Memo — " + session.title,
    "",
    "**Date:** " + now,
    "**Mode:** " + DEPTH_MODE_CONFIG[session.mode].label,
    "**Status:** " + BOARD_STATUS_CONFIG[session.status].label,
    "",
    "---",
    "",
    "## Decision Brief",
    "",
    "**Question:** " + brief.question,
    brief.goal ? "**Goal:** " + brief.goal : "",
    brief.deadline ? "**Deadline:** " + brief.deadline : "",
    brief.constraints ? "**Constraints:** " + brief.constraints : "",
    brief.knownFacts ? "**Known Facts:** " + brief.knownFacts : "",
    brief.openQuestions ? "**Open Questions:** " + brief.openQuestions : "",
    "",
    "---",
    "",
    "## Board Composition",
    "",
    memberList,
    "",
    "---",
    "",
    "## Discussion Transcript",
    "",
    turnBlocks || "_No discussion recorded._",
    "",
    "---",
    "",
    buildRecommendation(outcome),
  ];

  return lines.filter(Boolean).join("\n");
}

