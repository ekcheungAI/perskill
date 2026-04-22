import { useNavigate } from "@/lib/hooks/useNavigate";
import { personas } from "@/lib/personas";
import { useBoard } from "@/contexts/BoardContext";
import {
  BOARD_STATUS_CONFIG,
  SEAT_ROLE_CONFIG,
  DEPTH_MODE_CONFIG,
  type BoardSession,
} from "@/lib/boards";
import { getInitials } from "@/lib/utils";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Copy,
  Play,
  Clock,
  Users,
  MoreHorizontal,
  BarChart3,
  Settings2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

function BoardCard({ session }: { session: BoardSession }) {
  const navigate = useNavigate();

  const { deleteSession, duplicateSession } = useBoard();
  const [menuOpen, setMenuOpen] = useState(false);

  const memberPersonas = session.members
    .map((m) => personas.find((p) => p.id === m.personaId))
    .filter(Boolean) as typeof personas;

  const dateStr = new Date(session.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const statusColor = BOARD_STATUS_CONFIG[session.status].color;

  return (
    <div
      className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md hover:border-gray-200 transition-all cursor-pointer group"
      onClick={() => navigate(`/board/${session.id}`)}
    >
      {/* Header */}
      <div
        className="px-4 pt-4 pb-3 border-b border-gray-50"
        style={{ borderTop: `3px solid ${statusColor}` }}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p
              className="text-[13px] font-semibold text-gray-900 leading-snug line-clamp-2"
              style={{ fontFamily: "Fraunces, Georgia, serif" }}
            >
              {session.title}
            </p>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                style={{
                  background: `${statusColor}15`,
                  color: statusColor,
                  fontFamily: "Inter, sans-serif",
                }}
              >
                {BOARD_STATUS_CONFIG[session.status].label}
              </span>
              <span
                className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                {DEPTH_MODE_CONFIG[session.mode].label}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="relative flex-shrink-0" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <MoreHorizontal size={14} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-8 w-44 bg-white rounded-xl border border-gray-100 shadow-lg z-10 py-1">
                <button
                  onClick={() => {
                    navigate(`/board/${session.id}`);
                    setMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-gray-700 hover:bg-gray-50 transition-colors"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  <Play size={11} />
                  Open Session
                </button>
                <button
                  onClick={() => {
                    duplicateSession(session.id);
                    toast.success("Board duplicated");
                    setMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-gray-700 hover:bg-gray-50 transition-colors"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  <Copy size={11} />
                  Duplicate
                </button>
                <div className="border-t border-gray-50 my-1" />
                <button
                  onClick={() => {
                    deleteSession(session.id);
                    toast.success("Board deleted");
                    setMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-red-600 hover:bg-red-50 transition-colors"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  <Trash2 size={11} />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        {/* Member avatars */}
        <div className="flex items-center gap-1 mb-3">
          {memberPersonas.slice(0, 5).map((p, i) => (
            <div
              key={p.id}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-[9px] border-2 border-white -ml-1 first:ml-0"
              style={{
                background: `linear-gradient(135deg, ${p.accentColor}, ${p.accentColor}cc)`,
                fontFamily: "Fraunces, Georgia, serif",
                zIndex: 5 - i,
              }}
              title={p.name}
            >
              {getInitials(p.name)}
            </div>
          ))}
          {memberPersonas.length > 5 && (
            <span className="text-[10px] text-gray-400 -ml-1" style={{ fontFamily: "Inter, sans-serif" }}>
              +{memberPersonas.length - 5}
            </span>
          )}
          <span className="ml-auto text-[10px] text-gray-400 flex items-center gap-1" style={{ fontFamily: "Inter, sans-serif" }}>
            <Users size={10} />
            {session.members.length}
          </span>
        </div>

        {/* Brief question */}
        {session.brief.question && (
          <p
            className="text-[11px] text-gray-600 line-clamp-2 leading-relaxed mb-3"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            "{session.brief.question}"
          </p>
        )}

        {/* Stats */}
        <div className="flex items-center gap-3 text-[10px] text-gray-400" style={{ fontFamily: "Inter, sans-serif" }}>
          <span className="flex items-center gap-1">
            <Clock size={10} />
            {dateStr}
          </span>
          <span className="flex items-center gap-1">
            <BarChart3 size={10} />
            {session.turns.length} turns
          </span>
          {session.outcome && (
            <span className="text-green-600 font-semibold">Complete</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BoardList() {
  const navigate = useNavigate();

  const { sessions } = useBoard();

  // Sort: in-progress first, then by date
  const sorted = [...sessions].sort((a, b) => {
    const statusOrder = ["synthesizing", "deliberating", "intake", "draft", "complete"];
    const aIdx = statusOrder.indexOf(a.status);
    const bIdx = statusOrder.indexOf(b.status);
    if (aIdx !== bIdx) return aIdx - bIdx;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  return (
    <div className="min-h-screen" style={{ background: "#F7F6F2" }}>
      {/* Top bar */}
      <div className="sticky top-0 z-40 bg-white/95 border-b border-gray-200" style={{ backdropFilter: "blur(8px)" }}>
        <div className="max-w-6xl mx-auto px-4 h-12 flex items-center justify-between">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-[12px] text-gray-600 hover:text-gray-900 transition-colors"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            <ArrowLeft size={14} />
            Back to Library
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gray-900 flex items-center justify-center">
              <Users size={12} className="text-white" />
            </div>
            <span className="text-[13px] font-semibold text-gray-900" style={{ fontFamily: "Fraunces, Georgia, serif" }}>
              Perskill
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-gray-600 text-[10px] font-semibold mb-3 border border-gray-200 bg-white/70" style={{ fontFamily: "Inter, sans-serif", letterSpacing: "0.05em" }}>
              <Users size={9} className="text-amber-500" />
              VIRTUAL EXPERT BOARD
            </div>
            <h1 className="text-[26px] font-bold text-gray-900 leading-tight mb-1" style={{ fontFamily: "Fraunces, Georgia, serif" }}>
              My Boards
            </h1>
            <p className="text-[13px] text-gray-500" style={{ fontFamily: "Inter, sans-serif" }}>
              {sessions.length} board session{sessions.length !== 1 ? "s" : ""} — past decisions and active deliberations
            </p>
          </div>
          <button
            onClick={() => navigate("/board/new")}
            className="flex items-center gap-2 text-[13px] font-semibold px-5 py-2.5 rounded-xl bg-gray-900 text-white hover:bg-gray-800 transition-colors shadow-md hover:shadow-lg flex-shrink-0"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            <Plus size={14} />
            New Board
          </button>
          <button
            onClick={() => navigate("/settings")}
            className="flex items-center gap-1.5 text-[12px] text-gray-400 hover:text-gray-700 px-2 py-2.5 rounded-lg hover:bg-gray-100 transition-colors"
            title="Settings"
          >
            <Settings2 size={13} />
          </button>
        </div>

        {/* Board grid */}
        {sorted.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Users size={24} className="text-gray-300" />
            </div>
            <h2 className="text-[18px] font-bold text-gray-900 mb-2" style={{ fontFamily: "Fraunces, Georgia, serif" }}>
              No boards yet
            </h2>
            <p className="text-[13px] text-gray-500 mb-6 max-w-sm mx-auto" style={{ fontFamily: "Inter, sans-serif" }}>
              Create your first Virtual Expert Board to get structured advice from iconic thinkers on your toughest decisions.
            </p>
            <button
              onClick={() => navigate("/board/new")}
              className="inline-flex items-center gap-2 text-[13px] font-semibold px-6 py-2.5 rounded-xl bg-gray-900 text-white hover:bg-gray-800 transition-colors"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              <Plus size={14} />
              Create Your First Board
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* New board card */}
            <button
              onClick={() => navigate("/board/new")}
              className="bg-white rounded-2xl border-2 border-dashed border-gray-200 hover:border-gray-400 transition-all p-6 flex flex-col items-center justify-center gap-3 text-center min-h-[160px] group"
            >
              <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                <Plus size={18} className="text-gray-400" />
              </div>
              <p className="text-[13px] font-semibold text-gray-700" style={{ fontFamily: "Inter, sans-serif" }}>
                Create New Board
              </p>
              <p className="text-[11px] text-gray-400" style={{ fontFamily: "Inter, sans-serif" }}>
                Frame a decision and assemble experts
              </p>
            </button>

            {sorted.map((session) => (
              <BoardCard key={session.id} session={session} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
