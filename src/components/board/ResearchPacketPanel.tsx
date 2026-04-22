import type { ResearchPacket } from "@/lib/boards";
import { Globe, HelpCircle, BarChart3, Link, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

interface ResearchPacketPanelProps {
  packet: ResearchPacket | undefined;
  isLoading?: boolean;
}

function Section({
  title,
  icon,
  items,
  color,
}: {
  title: string;
  icon: React.ReactNode;
  items: string[];
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <div
        className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-50"
        style={{ borderTop: `3px solid ${color}` }}
      >
        {icon}
        <p className="text-[12px] font-semibold text-gray-900" style={{ fontFamily: "Inter, sans-serif" }}>
          {title}
        </p>
        <span
          className="ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
          style={{ background: `${color}15`, color, fontFamily: "Inter, sans-serif" }}
        >
          {items.length}
        </span>
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
            Not yet generated
          </p>
        )}
      </div>
    </div>
  );
}

export function ResearchPacketPanel({
  packet,
  isLoading = false,
}: ResearchPacketPanelProps) {
  const [expanded, setExpanded] = useState(true);

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
          <p className="text-[13px] text-gray-600" style={{ fontFamily: "Inter, sans-serif" }}>
            Building research packet...
          </p>
        </div>
      </div>
    );
  }

  if (!packet) {
    return (
      <div className="bg-white rounded-xl border border-dashed border-gray-200 p-6 text-center">
        <Globe size={20} className="mx-auto text-gray-300 mb-2" />
        <p className="text-[12px] text-gray-400" style={{ fontFamily: "Inter, sans-serif" }}>
          No research packet yet. Use Deep Research mode to generate one.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Summary */}
      {packet.summary && (
        <div
          className="bg-white rounded-xl border border-gray-100 p-4"
          style={{ borderTop: "3px solid #0EA5E9" }}
        >
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2" style={{ fontFamily: "Inter, sans-serif" }}>
            Research Summary
          </p>
          <p className="text-[13px] text-gray-800 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
            {packet.summary}
          </p>
        </div>
      )}

      {/* Collapsible detail sections */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-2 text-[11px] font-semibold text-gray-500 hover:text-gray-700 transition-colors"
        style={{ fontFamily: "Inter, sans-serif" }}
      >
        {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        {expanded ? "Hide" : "Show"} detailed research
      </button>

      {expanded && (
        <div className="space-y-3">
          <Section
            title="Extracted Assumptions"
            icon={<BarChart3 size={12} className="text-blue-500" />}
            items={packet.assumptions}
            color="#0EA5E9"
          />
          <Section
            title="Evidence"
            icon={<Globe size={12} className="text-green-500" />}
            items={packet.evidence}
            color="#10B981"
          />
          <Section
            title="Open Questions"
            icon={<HelpCircle size={12} className="text-amber-500" />}
            items={packet.openQuestions}
            color="#F59E0B"
          />
          {packet.sourceUrls.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div
                className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-50"
                style={{ borderTop: "3px solid #6B7280" }}
              >
                <Link size={12} className="text-gray-500" />
                <p className="text-[12px] font-semibold text-gray-900" style={{ fontFamily: "Inter, sans-serif" }}>
                  Source URLs
                </p>
              </div>
              <div className="px-4 py-3 space-y-1.5">
                {packet.sourceUrls.map((url, i) => (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-[11px] text-blue-600 hover:text-blue-800 truncate"
                    style={{ fontFamily: "Inter, sans-serif" }}
                  >
                    {url}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
