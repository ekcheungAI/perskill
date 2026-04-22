import { useState, useMemo } from "react";
import {
  type BoardSession,
  type DiscussionTurn,
  type DiscussionStage,
  type SeatRole,
  SEAT_ROLE_CONFIG,
  DISCUSSION_STAGE_CONFIG,
} from "@/lib/boards";
import type { Persona } from "@/lib/personas";
import {
  MessageSquare,
  Lightbulb,
  Swords,
  RefreshCw,
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  Gavel,
  Quote,
} from "lucide-react";

const STAGE_ICONS: Record<DiscussionStage, React.ReactNode> = {
  initial_position: <Lightbulb size={12} />,
  key_argument: <Quote size={12} />,
  challenge: <Swords size={12} />,
  rebuttal: <RefreshCw size={12} />,
  what_would_change_mind: <HelpCircle size={12} />,
  final_recommendation: <Gavel size={12} />,
};

const STAGE_COLORS: Record<DiscussionStage, string> = {
  initial_position: "#0EA5E9",
  key_argument: "#8B5CF6",
  challenge: "#EF4444",
  rebuttal: "#F59E0B",
  what_would_change_mind: "#06B6D4",
  final_recommendation: "#10B981",
};

const ROLE_COLORS: Record<SeatRole, string> = {
  chair: "#1A1A1A",
  domain_specialist: "#0EA5E9",
  operator: "#10B981",
  contrarian: "#EF4444",
  risk_reviewer: "#8B5CF6",
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function MemberAvatar({
  persona,
  role,
  size = 32,
}: {
  persona: Persona;
  role: SeatRole;
  size?: number;
}) {
  const color = persona.accentColor || "#6B7280";
  const roleColor = ROLE_COLORS[role];
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <div
        className="w-full h-full rounded-xl flex items-center justify-center text-white font-bold"
        style={{
          background: `linear-gradient(135deg, ${color}, ${color}cc)`,
          fontFamily: "Fraunces, Georgia, serif",
          fontSize: size * 0.32,
          border: `2px solid ${roleColor}`,
        }}
      >
        {getInitials(persona.name)}
      </div>
      <div
        className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-white text-[7px] font-bold"
        style={{ background: roleColor, fontFamily: "Fraunces, Georgia, serif" }}
      >
        {SEAT_ROLE_CONFIG[role].icon}
      </div>
    </div>
  );
}

function TurnCard({
  turn,
  member,
  persona,
}: {
  turn: DiscussionTurn;
  member: BoardSession["members"][number];
  persona: Persona;
}) {
  const stageConfig = DISCUSSION_STAGE_CONFIG[turn.stage];
  const stageColor = STAGE_COLORS[turn.stage];
  const roleColor = ROLE_COLORS[member.role];
  return (
    <div
      className="rounded-xl border bg-white overflow-hidden"
      style={{ borderLeft: `3px solid ${roleColor}` }}
    >
      <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border-b border-gray-100">
        <MemberAvatar persona={persona} role={member.role} size={24} />
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-semibold text-gray-900 truncate" style={{ fontFamily: "Inter, sans-serif" }}>
            {persona.name}
          </p>
          <p className="text-[10px] text-gray-400" style={{ fontFamily: "Inter, sans-serif" }}>
            {SEAT_ROLE_CONFIG[member.role].label}
          </p>
        </div>
        <span
          className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
          style={{
            background: `${stageColor}15`,
            color: stageColor,
            fontFamily: "Inter, sans-serif",
          }}
        >
          {STAGE_ICONS[turn.stage]}
          {stageConfig.label}
        </span>
      </div>
      <div className="px-4 py-3">
        <p
          className="text-[13px] text-gray-800 leading-relaxed whitespace-pre-wrap"
          style={{ fontFamily: "Inter, sans-serif" }}
        >
          {turn.content}
        </p>
        {turn.stance && (
          <div className="mt-2 flex items-center gap-1.5">
            {turn.stance === "agree" && (
              <span className="text-[10px] font-semibold text-green-600 flex items-center gap-0.5" style={{ fontFamily: "Inter, sans-serif" }}>
                <CheckCircle2 size={10} /> Agrees
              </span>
            )}
            {turn.stance === "disagree" && (
              <span className="text-[10px] font-semibold text-red-600 flex items-center gap-0.5" style={{ fontFamily: "Inter, sans-serif" }}>
                <AlertTriangle size={10} /> Disagrees
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface DeliberationPanelProps {
  session: BoardSession;
  personas: Persona[];
  isGenerating?: boolean;
}

export function DeliberationPanel({
  session,
  personas,
  isGenerating = false,
}: DeliberationPanelProps) {
  const [activeStage, setActiveStage] = useState<DiscussionStage | "all">("all");

  const grouped = useMemo(() => {
    const groups: Partial<Record<DiscussionStage, DiscussionTurn[]>> = {};
    session.turns.forEach((turn) => {
      if (!groups[turn.stage]) groups[turn.stage] = [];
      groups[turn.stage]!.push(turn);
    });
    return groups;
  }, [session.turns]);

  const filteredTurns =
    activeStage === "all"
      ? session.turns
      : (grouped[activeStage as DiscussionStage] ?? []);

  const stages: DiscussionStage[] = [
    "initial_position",
    "key_argument",
    "challenge",
    "rebuttal",
    "what_would_change_mind",
    "final_recommendation",
  ];

  const personaMap = useMemo(
    () => new Map(personas.map((p) =>[p.id, p])),
    [personas]
  );

  const memberMap = useMemo(
    () => new Map(session.members.map((m) => [m.id, m])),
    [session.members]
  );

  return (
    <div className="space-y-4">
      {/* Stage filter pills */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveStage("all")}
          className={`text-[11px] font-semibold px-3 py-1.5 rounded-full transition-all ${
            activeStage === "all"
              ? "bg-gray-900 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
          style={{ fontFamily: "Inter, sans-serif" }}
        >
          All ({session.turns.length})
        </button>
        {stages.map((stage) => {
          const count = grouped[stage]?.length ?? 0;
          if (count === 0 && activeStage !== stage) return null;
          return (
            <button
              key={stage}
              onClick={() => setActiveStage(stage)}
              className={`text-[11px] font-semibold px-3 py-1.5 rounded-full transition-all flex items-center gap-1 ${
                activeStage === stage
                  ? "text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
              style={{
                fontFamily: "Inter, sans-serif",
                background: activeStage === stage ? STAGE_COLORS[stage] : undefined,
              }}
            >
              {STAGE_ICONS[stage]}
              {DISCUSSION_STAGE_CONFIG[stage].label}
              {count > 0 && <span className="opacity-60">({count})</span>}
            </button>
          );
        })}
      </div>

      {/* Generating indicator */}
      {isGenerating && (
        <div className="flex items-center gap-2 px-4 py-3 bg-blue-50 rounded-xl border border-blue-100">
          <div className="w-4 h-4 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
          <p className="text-[12px] text-blue-700" style={{ fontFamily: "Inter, sans-serif" }}>
            Board is deliberating...
          </p>
        </div>
      )}

      {/* Turn cards */}
      {filteredTurns.length === 0 && !isGenerating ? (
        <div className="text-center py-12">
          <MessageSquare size={24} className="mx-auto text-gray-300 mb-2" />
          <p className="text-[13px] text-gray-400" style={{ fontFamily: "Inter, sans-serif" }}>
            No discussion yet. Launch the board to begin deliberation.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTurns.map((turn) => {
            const member = memberMap.get(turn.memberId);
            const persona = member ? personaMap.get(member.personaId) : undefined;
            if (!member || !persona) return null;
            return (
              <TurnCard
                key={turn.id}
                turn={turn}
                member={member}
                persona={persona}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
