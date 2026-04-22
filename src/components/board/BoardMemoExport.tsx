import { useState } from "react";
import {
  type BoardSession,
  type DecisionOutcome,
  generateBoardMemoMarkdown,
  DEPTH_MODE_CONFIG,
  BOARD_STATUS_CONFIG,
} from "@/lib/boards";
import type { Persona } from "@/lib/personas";
import {
  Copy,
  CheckCircle2,
  Download,
  FileText,
  MessageSquare,
  Layers,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import { toast } from "sonner";

interface BoardMemoExportProps {
  session: BoardSession;
  personas: Persona[];
  compositePrompt?: string;
}

function downloadMarkdown(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function OutcomeCard({
  label,
  items,
  color = "#1A1A1A",
  icon,
}: {
  label: string;
  items: string[];
  color?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <div
        className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-50"
        style={{ borderTop: `3px solid ${color}` }}
      >
        {icon}
        <p className="text-[12px] font-semibold text-gray-900" style={{ fontFamily: "Inter, sans-serif" }}>
          {label}
        </p>
      </div>
      <div className="px-4 py-3">
        {items.length > 0 ? (
          <ul className="space-y-1.5">
            {items.map((item, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-[12px] text-gray-700 leading-relaxed"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                <span className="mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color }} />
                {item}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[11px] text-gray-400 italic" style={{ fontFamily: "Inter, sans-serif" }}>
            Not yet recorded
          </p>
        )}
      </div>
    </div>
  );
}

export function BoardMemoExport({
  session,
  personas,
  compositePrompt,
}: BoardMemoExportProps) {
  const [copied, setCopied] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"memo" | "transcript" | "prompt">("memo");

  const outcome = session.outcome;

  const handleCopy = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(null), 2000);
  };

  const memoMarkdown = generateBoardMemoMarkdown(session, personas);
  const filename = `board-memo-${session.title.replace(/\s+/g, "-").toLowerCase()}-${new Date().toISOString().slice(0, 10)}.md`;

  const confidenceColor =
    outcome?.confidence === "high"
      ? "#10B981"
      : outcome?.confidence === "medium"
      ? "#F59E0B"
      : "#EF4444";

  return (
    <div className="space-y-4">
      {/* Status + mode */}
      <div className="flex items-center gap-3 flex-wrap">
        <span
          className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
          style={{
            background: `${BOARD_STATUS_CONFIG[session.status].color}15`,
            color: BOARD_STATUS_CONFIG[session.status].color,
            fontFamily: "Inter, sans-serif",
          }}
        >
          {BOARD_STATUS_CONFIG[session.status].label}
        </span>
        <span
          className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-600"
          style={{ fontFamily: "Inter, sans-serif" }}
        >
          {DEPTH_MODE_CONFIG[session.mode].label}
        </span>
        <span className="text-[11px] text-gray-400" style={{ fontFamily: "Inter, sans-serif" }}>
          {session.members.length} members · {session.turns.length} turns
        </span>
      </div>

      {/* Output tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        {[
          { key: "memo" as const, icon: <FileText size={11} />, label: "Board Memo" },
          { key: "transcript" as const, icon: <MessageSquare size={11} />, label: "Transcript" },
          { key: "prompt" as const, icon: <Layers size={11} />, label: "Composite Prompt" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-all flex-1 justify-center ${
              activeTab === tab.key ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"
            }`}
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {activeTab === "memo" && (
          <div className="space-y-4">
            {/* Recommendation highlight */}
            {outcome ? (
              <div
                className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-100"
                style={{ borderTop: `3px solid ${confidenceColor}` }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp size={14} style={{ color: confidenceColor }} />
                  <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: confidenceColor, fontFamily: "Inter, sans-serif" }}>
                    {outcome.confidence.toUpperCase()} CONFIDENCE
                  </span>
                  {outcome.confidenceReason && (
                    <span className="text-[11px] text-gray-500" style={{ fontFamily: "Inter, sans-serif" }}>
                      — {outcome.confidenceReason}
                    </span>
                  )}
                </div>
                <p className="text-[14px] font-semibold text-gray-900 leading-relaxed" style={{ fontFamily: "Fraunces, Georgia, serif" }}>
                  {outcome.recommendation}
                </p>
              </div>
            ) : (
              <div className="p-4 bg-amber-50 border-b border-amber-100">
                <p className="text-[12px] text-amber-700" style={{ fontFamily: "Inter, sans-serif" }}>
                  No recommendation yet. Complete the deliberation to generate the memo.
                </p>
              </div>
            )}

            {/* Outcome cards */}
            {outcome && (
              <div className="px-4 pb-4 space-y-3">
                <OutcomeCard
                  label="Key Reasons"
                  items={outcome.keyReasons}
                  color="#0EA5E9"
                  icon={<BarChart3 size={12} className="text-blue-500" />}
                />
                <OutcomeCard
                  label="Major Disagreements"
                  items={outcome.majorDisagreements}
                  color="#EF4444"
                  icon={<TrendingUp size={12} className="text-red-500" />}
                />
                <OutcomeCard
                  label="Primary Risks"
                  items={outcome.primaryRisks}
                  color="#F59E0B"
                  icon={<BarChart3 size={12} className="text-amber-500" />}
                />
                <OutcomeCard
                  label="Next Actions"
                  items={outcome.nextActions}
                  color="#10B981"
                  icon={<TrendingUp size={12} className="text-green-500" />}
                />
                {outcome.dissentMemo && (
                  <div className="bg-red-50 rounded-xl border border-red-100 p-4">
                    <p className="text-[11px] font-bold text-red-700 uppercase tracking-wider mb-2" style={{ fontFamily: "Inter, sans-serif" }}>
                      Dissent Memo
                    </p>
                    <p className="text-[12px] text-red-700 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
                      {outcome.dissentMemo}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 px-4 pb-4 border-t border-gray-50 pt-3">
              <button
                onClick={() => handleCopy(memoMarkdown, "memo")}
                className={`flex items-center gap-1.5 text-[12px] font-semibold px-4 py-2 rounded-lg border transition-all flex-1 justify-center ${
                  copied === "memo"
                    ? "bg-green-50 border-green-200 text-green-700"
                    : "border-gray-200 hover:border-gray-300 text-gray-700"
                }`}
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                {copied === "memo" ? <CheckCircle2 size={12} /> : <Copy size={12} />}
                {copied === "memo" ? "Copied!" : "Copy Memo"}
              </button>
              <button
                onClick={() => downloadMarkdown(memoMarkdown, filename)}
                className="flex items-center gap-1.5 text-[12px] font-semibold px-4 py-2 rounded-lg border border-gray-200 hover:border-gray-300 text-gray-700 transition-all"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                <Download size={12} />
                Export .md
              </button>
            </div>
          </div>
        )}

        {activeTab === "transcript" && (
          <div>
            <div className="p-4">
              <p className="text-[12px] text-gray-500 mb-3" style={{ fontFamily: "Inter, sans-serif" }}>
                {session.turns.length === 0
                  ? "No discussion turns recorded yet."
                  : `${session.turns.length} discussion turns from ${session.members.length} board members.`}
              </p>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {session.turns.map((turn) => {
                  const member = session.members.find((m) => m.id === turn.memberId);
                  const persona = member ? personas.find((p) => p.id === member.personaId) : null;
                  return (
                    <div key={turn.id} className="flex items-start gap-2 p-2.5 bg-gray-50 rounded-lg">
                      <span className="text-[9px] font-mono font-bold text-gray-400 mt-0.5 flex-shrink-0">
                        {turn.stage.replace("_", " ").slice(0, 12)}
                      </span>
                      <p className="text-[11px] text-gray-700 leading-relaxed flex-1" style={{ fontFamily: "Inter, sans-serif" }}>
                        <span className="font-semibold text-gray-900">{persona?.name ?? "Member"}:</span>{" "}
                        {turn.content.slice(0, 200)}{turn.content.length > 200 ? "..." : ""}
                      </p>
                    </div>
                  );
                })}
                {session.turns.length === 0 && (
                  <p className="text-[11px] text-gray-400 text-center py-4 italic" style={{ fontFamily: "Inter, sans-serif" }}>
                    Start the board session to generate a transcript
                  </p>
                )}
              </div>
            </div>
            <div className="border-t border-gray-100 px-4 pb-4 pt-3">
              <button
                onClick={() =>
                  handleCopy(
                    session.turns
                      .map((t) => {
                        const m = session.members.find((x) => x.id === t.memberId);
                        const p = m ? personas.find((x) => x.id === m.personaId) : null;
                        return `[${t.stage}] ${p?.name}: ${t.content}`;
                      })
                      .join("\n\n"),
                    "transcript"
                  )
                }
                className="flex items-center gap-1.5 text-[12px] font-semibold px-4 py-2 rounded-lg border border-gray-200 hover:border-gray-300 text-gray-700 transition-all"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                <Copy size={12} />
                Copy Transcript
              </button>
            </div>
          </div>
        )}

        {activeTab === "prompt" && (
          <div>
            <div className="p-4">
              <p className="text-[11px] font-semibold text-gray-600 mb-2" style={{ fontFamily: "Inter, sans-serif" }}>
                Composite Board Prompt
              </p>
              <div className="bg-gray-50 rounded-lg p-3 max-h-64 overflow-y-auto">
                <pre
                  className="text-[10.5px] font-mono text-gray-700 leading-relaxed whitespace-pre-wrap"
                  style={{ fontFamily: "JetBrains Mono, monospace" }}
                >
                  {compositePrompt ?? "Start the board to generate a composite prompt."}
                </pre>
              </div>
            </div>
            {compositePrompt && (
              <div className="border-t border-gray-100 px-4 pb-4 pt-3">
                <button
                  onClick={() => handleCopy(compositePrompt, "prompt")}
                  className={`flex items-center gap-1.5 text-[12px] font-semibold px-4 py-2 rounded-lg border transition-all ${
                    copied === "prompt"
                      ? "bg-green-50 border-green-200 text-green-700"
                      : "border-gray-200 hover:border-gray-300 text-gray-700"
                  }`}
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  {copied === "prompt" ? <CheckCircle2 size={12} /> : <Copy size={12} />}
                  {copied === "prompt" ? "Copied!" : "Copy Prompt"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
