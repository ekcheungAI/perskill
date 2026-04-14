#!/usr/bin/env node
/**
 * export-personas.ts
 *
 * Reads personas.ts and exports each persona as a standalone GitHub-installable skill.
 * Output: skills/{personaId}/
 *   ├── SKILL.md           — Claude/Cursor auto-recognised skill file
 *   ├── PROFILE.md         — Human-readable summary
 *   ├── SYSTEM_PROMPT.md   — Full aiPersonaPrompt
 *   └── USE_CASE_PROMPTS.md — All use-case prompts
 *
 * Run:  npx tsx scripts/export-personas.ts
 * Or:   node scripts/export-personas.ts   (after building)
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "skills");

// ─── Helpers ────────────────────────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function escapeYaml(str: string): string {
  // Wrap in double-quotes if contains special chars
  if (/[:\[\]{}|!>&*?%@`#]/.test(str)) {
    return `"${str.replace(/"/g, '\\"')}"`;
  }
  return str;
}

function mdHeading(text: string, level = 2): string {
  return `${"#".repeat(level)} ${text}\n`;
}

function mdBold(text: string): string {
  return `**${text}**`;
}

function mdList(items: string[]): string {
  return items.map((i) => `- ${i}`).join("\n") + "\n";
}

function mdCode(text: string): string {
  return `\`\`\`\n${text}\n\`\`\`\n`;
}

function rarityLabel(key: string): string {
  const map: Record<string, string> = {
    C: "Common",
    CC: "Uncommon",
    R: "Rare",
    RR: "Double Rare",
    RRR: "Ultra Rare",
  };
  return map[key] ?? key;
}

function freshnessLabel(s: string): string {
  const map: Record<string, string> = {
    LIVE: "Live — updated within 7 days",
    RECENT: "Recent — updated within 30 days",
    STALE: "Stale — last updated 30–90 days ago",
    OUTDATED: "Outdated — data may be inaccurate",
  };
  return map[s] ?? s;
}

// ─── Research integration helper ───────────────────────────────────────────────

function readResearchFile(p: PersonaRecord, filename: string): string {
  const researchDir = path.join(ROOT, "skills", p.id, "research");
  const filePath = path.join(researchDir, filename);
  try {
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, "utf-8");
    }
  } catch { /* ignore */ }
  return "";
}

/** Extract content between two markdown headings (inclusive) */
function extractSection(content: string, heading: string): string[] {
  const lines = content.split("\n");
  const result: string[] = [];
  let inSection = false;

  for (const line of lines) {
    if (line.startsWith(`## ${heading}`) || line.startsWith(`### ${heading}`)) {
      inSection = true;
      result.push(line);
    } else if (inSection) {
      if (line.startsWith("# ")) break;
      result.push(line);
    }
  }
  return result;
}

// ─── SKILL.md generator ─────────────────────────────────────────────────────

function buildSkillMd(p: PersonaRecord): string {
  const trigger = [
    p.name,
    p.nativeName,
    ...p.categories,
    ...p.personalityTraits.slice(0, 3),
  ]
    .filter(Boolean)
    .join(", ");

  const triggerKeywords = [
    p.name,
    ...(p.nativeName ? [p.nativeName] : []),
    ...p.categories,
    ...p.personalityTraits.slice(0, 2),
  ].join(", ");

  // ── Try to load distillation content from research/ directory
  const hasResearch = fs.existsSync(path.join(ROOT, "skills", p.id, "research"));
  const tvLog = hasResearch ? readResearchFile(p, "triple-verify-log.md") : "";
  const researchReadme = hasResearch ? readResearchFile(p, "README.md") : "";

  const yaml = [
    "---",
    `name: ${slugify(p.id)}`,
    `description: >-`,
    `  ${p.name}${p.nativeName ? ` (${p.nativeName})` : ""} — ${p.shortBio} Installs thinking style,`,
    `  decision-making patterns, communication style, and AI prompts. Use when`,
    `  working with ${p.categories.join(", ")} problems. Triggers on: ${triggerKeywords}.`,
    `version: "${p.promptVersion || "1.0"}"`,
    `source: https://github.com/ekcheungAI/perskill`,
    `persona_id: ${p.id}`,
    `rarity: ${rarityLabel(p.rarityOverride ?? "R")}`,
    `categories: [${p.categories.join(", ")}]`,
    `tags: [${[...p.personalityTraits.slice(0, 4), ...p.categories].join(", ")}]`,
    ...(hasResearch ? [`research_depth: DISTILLED`, `research_sources: skills/${p.id}/research/`] : []),
    "---",
  ].join("\n");

  const sections: string[] = [];

  sections.push(`# ${p.name}${p.nativeName ? ` ${p.nativeName}` : ""}`);

  sections.push(
    mdHeading("Quick Identity", 2),
    mdBold("Title:") + ` ${p.title}\n`,
    mdBold("Born:") + ` ${p.born}\n`,
    mdBold("Nationality:") + ` ${p.nationality}\n`,
    mdBold("Rarity:") + ` ${rarityLabel(p.rarityOverride ?? "R")}\n`,
    mdBold("Data Freshness:") + ` ${freshnessLabel(p.freshnessStatus ?? "STALE")} (last updated ${p.lastUpdated})\n`,
    "",
    mdBold("Categories:") + ` ${p.categories.join(", ")}\n`,
    mdBold("Personality Traits:") + ` ${p.personalityTraits.join(", ")}\n`,
    "",
  );

  // ── If research exists, add distilled sections first
  if (hasResearch) {
    sections.push(
      "\n---\n",
      mdHeading("Distilled Mental Models (Research-Verified)", 2),
      "\`Research depth: DISTILLED · See \`skills/" + p.id + "/research/\` for full evidence.\`\n",
    );

    // Extract promotion ledger from triple-verify log
    const ledgerMatch = tvLog.match(/## Promotion Ledger\n([\s\S]*?)(?=\n##|\n---\n|$)/);
    if (ledgerMatch) {
      sections.push(
        "Verified models (passed 3/3 triple verification):\n",
        ledgerMatch[1].trim() + "\n",
      );
    }

    // Extract contradiction rows if present
    const tvContradictions = extractSection(tvLog, "Contradictions");
    if (tvContradictions.length > 1) {
      sections.push(
        "\n---\n",
        mdHeading("Documented Contradictions (Research-Verified)", 2),
        "Where stated values diverge from observed behavior:\n",
        ...tvContradictions.slice(1),
        "\n",
      );
    }

    // If we have research summary from README, add key findings
    const summaryMatch = researchReadme.match(/## Research Summary\n([\s\S]*?)(?=\n##|\n---)/);
    if (summaryMatch) {
      sections.push(
        "\n---\n",
        mdHeading("Key Research Findings", 2),
        summaryMatch[1].trim() + "\n",
      );
    }

    sections.push(
      "\n---\n",
      mdHeading("Core Thinking Style", 2),
      `${p.problemSolvingApproach}\n`,
    );
  } else {
    sections.push(
      mdHeading("Core Thinking Style", 2),
      `${p.problemSolvingApproach}\n`,
    );
  }

  sections.push(
    mdHeading("Decision-Making", 2),
    `${p.decisionMakingStyle}\n`,
  );

  sections.push(
    mdHeading("Communication Style", 2),
    `${p.communicationStyle}\n`,
  );

  sections.push(
    mdHeading("Leadership Style", 2),
    `${p.leadershipStyle}\n`,
  );

  sections.push(
    mdHeading("Famous Quotes", 2),
    p.famousQuotes
      .slice(0, 5)
      .map((q) => `> "${q}"`)
      .join("\n") + "\n",
  );

  sections.push(
    mdHeading("Key Thinking Frameworks", 2),
    p.thinkingFrameworks
      .map(
        (f) =>
          `### ${f.name}\n` +
          `${f.description}\n` +
          mdBold("How to apply:") + ` ${f.howToApply}\n`,
      )
      .join("\n"),
  );

  sections.push(
    mdHeading("Vocabulary Patterns", 2),
    "These phrases signal how this persona thinks and communicates:\n",
    p.vocabularyPatterns
      .map(
        (v) =>
          `- **"${v.phrase}"** — ${v.context} *(${v.frequency})*`,
      )
      .join("\n") + "\n",
  );

  sections.push(
    mdHeading("AI System Prompt", 2),
    "The full behavioural system prompt:\n",
    mdCode(p.aiPersonaPrompt),
  );

  sections.push(
    mdHeading("Short Prompt", 2),
    mdCode(p.aiPersonaPromptShort),
  );

  sections.push(
    mdHeading("Use-Case Prompts", 2),
    "Copy any of these into your LLM to activate this persona:\n",
    (p.useCasePrompts || [])
      .map(
        (u) =>
          `### ${u.title} ${u.icon}\n` +
          `${u.description}\n` +
          mdCode(u.prompt),
      )
      .join("\n"),
  );

  sections.push(
    mdHeading("Weaknesses", 2),
    `${p.weaknesses}\n`,
  );

  sections.push(
    mdHeading("Blind Spots", 2),
    mdList(p.blindSpots),
  );

  sections.push(
    mdHeading("Install This Persona", 2),
    "Copy the contents of `SYSTEM_PROMPT.md` or `SKILL.md` into your AI agent's system prompt.\n",
    "For Claude Code / Cursor: place this folder in your `~/.claude/skills/` or `~/.cursor/skills/` directory.\n",
    "\n",
    mdBold("GitHub Source:") + ` https://github.com/ekcheungAI/perskill/tree/main/skills/${p.id}\n`,
    hasResearch
      ? mdBold("Research Archive:") + ` https://github.com/ekcheungAI/perskill/tree/main/skills/${p.id}/research\n`
      : "",
  );

  return [yaml, ...sections].join("\n");
}

// ─── PROFILE.md generator ──────────────────────────────────────────────────

function buildProfileMd(p: PersonaRecord): string {
  const sections: string[] = [];

  sections.push(
    `# ${p.name}${p.nativeName ? ` ${p.nativeName}` : ""} — Full Profile\n`,
    `---\n`,
    `**ID:** ${p.id}\n`,
    `**Title:** ${p.title}\n`,
    `**Born:** ${p.born}\n`,
    `**Nationality:** ${p.nationality}\n`,
    `**Categories:** ${p.categories.join(", ")}\n`,
    `**Rarity:** ${rarityLabel(p.rarityOverride ?? "R")}\n`,
    `**Freshness:** ${freshnessLabel(p.freshnessStatus)} (updated ${p.lastUpdated})\n`,
    `**Data Sources:** ${p.dataSourceCount} sources\n`,
    `**Accent Color:** ${p.accentColor}\n`,
    `---\n`,
  );

  sections.push(mdHeading("Short Bio", 2), `${p.shortBio}\n`);

  sections.push(mdHeading("Full Biography", 2), `${p.fullBio}\n`);

  sections.push(
    mdHeading("Personality Dimensions", 2),
    "| Dimension | Score | Description |\n",
    "|---|---|---|\n",
    p.personalityDimensions
      .map(
        (d) =>
          `| ${d.label} | ${d.value}/100 | ${d.description} |`,
      )
      .join("\n") + "\n",
  );

  sections.push(mdHeading("MBTI"), `${p.mbtiType ?? "N/A"}\n`);

  sections.push(
    mdHeading("Key Skills", 2),
    "| Skill | Level | Category | Description |\n",
    "|---|---|---|---|\n",
    p.keySkills
      .map(
        (s) =>
          `| ${s.name} | ${s.level}/100 | ${s.category} | ${s.description} |`,
      )
      .join("\n") + "\n",
  );

  sections.push(
    mdHeading("Thinking Frameworks", 2),
    p.thinkingFrameworks
      .map(
        (f) =>
          `### ${f.name}\n` +
          `${f.description}\n\n` +
          mdBold("How to apply:") + ` ${f.howToApply}\n\n` +
          mdBold("Example:") + ` ${f.example}\n`,
      )
      .join("\n---\n"),
  );

  sections.push(
    mdHeading("Accomplishments", 2),
    "| Year | Title | Impact | Description |\n",
    "|---|---|---|---|\n",
    (p.acplishments || [])
      .map(
        (a) =>
          `| ${a.year} | ${a.title} | ${a.impact} | ${a.description} |`,
      )
      .join("\n") + "\n",
  );

  sections.push(
    mdHeading("Relationships", 2),
    "| Person | Type | Strength | Since | Status |\n",
    "|---|---|---|---|---|\n",
    (p.relationships || [])
      .map(
        (r) =>
          `| ${r.personaId} | ${r.type} | ${r.strength}/100 | ${r.since} | ${r.status} |`,
      )
      .join("\n") + "\n",
  );

  sections.push(
    mdHeading("Recent News", 2),
    p.recentNews
      .map(
        (n) =>
          `- **${n.date}** [${n.headline}](${n.sourceUrl}) (${n.source}) — *${n.sentiment}*`,
      )
      .join("\n") + "\n",
  );

  sections.push(
    mdHeading("Recommended Resources", 2),
    p.recommendedResources
      .map((r) => `- **${r.title}** by ${r.author} (${r.type}) — ${r.relevance}`)
      .join("\n") + "\n",
  );

  sections.push(
    mdHeading("Failure Cases", 2),
    (p.failureCases ?? []).length
      ? p.failureCases
          .map(
            (f) =>
              `### ${f.year}: ${f.whatFailed}\n` +
              `${f.whyItFailed}\n` +
              mdBold("Learned:") + ` ${f.whatTheyLearned}\n`,
          )
          .join("\n---\n")
      : "*No documented failure cases.*\n",
  );

  sections.push(
    mdHeading("Competitive Worldview", 2),
    (p.competitiveWorldview?.marketFrame ?? "")
      ? `${p.competitiveWorldview?.marketFrame}\n`
      : "*No competitive intelligence on file.*\n",
  );

  sections.push(
    mdHeading("Install Info", 2),
    mdBold("Source:") + ` https://github.com/ekcheungAI/perskill/tree/main/skills/${p.id}\n`,
    mdBold("Version:") + ` ${p.promptVersion}\n`,
    mdBold("Last Updated:") + ` ${p.lastUpdated}\n`,
    mdBold("Next Update Due:") + ` ${p.nextUpdateDue}\n`,
  );

  return sections.join("\n");
}

// ─── SYSTEM_PROMPT.md generator ────────────────────────────────────────────

function buildSystemPromptMd(p: PersonaRecord): string {
  const lines: string[] = [];

  lines.push(
    `# ${p.name}${p.nativeName ? ` (${p.nativeName})` : ""} — AI System Prompt\n`,
    `---\n`,
    `**Version:** ${p.promptVersion}\n`,
    `**Installed from:** https://github.com/ekcheungAI/perskill\n`,
    `**Persona ID:** ${p.id}\n`,
    `---\n`,
    `## Short Prompt (copy-paste)\n`,
    mdCode(p.aiPersonaPromptShort),
    `## Full System Prompt\n`,
    mdCode(p.aiPersonaPrompt),
  );

  if (p.promptChangelog?.length) {
    lines.push(
      `## Prompt Version History\n`,
      "| Version | Date | Changes |\n",
      "|---|---|---|\n",
      p.promptChangelog
        .map((c) => `| ${c.version} | ${c.date} | ${c.changes} |`)
        .join("\n") + "\n",
    );
  }

  return lines.join("\n");
}

// ─── USE_CASE_PROMPTS.md generator ────────────────────────────────────────

function buildUseCasePromptsMd(p: PersonaRecord): string {
  const lines: string[] = [];

  lines.push(
    `# ${p.name}${p.nativeName ? ` (${p.nativeName})` : ""} — Use-Case Prompts\n`,
    `---\n`,
    `**${(p.useCasePrompts || []).length} prompts available.**\n`,
    `---\n`,
  );

  lines.push(
    "## How to Use\n",
    "Copy any prompt below and paste it into your LLM (ChatGPT, Claude, etc.) to activate this persona.\n",
    "For best results, paste the **Full System Prompt** from `SYSTEM_PROMPT.md` into your model's system prompt field.\n",
    "---\n",
  );

  lines.push(
    "## Quick-Use Prompts\n",
    ...p.useCasePrompts.map(
      (u, i) =>
        [
          `### ${i + 1}. ${u.title} ${u.icon}`,
          `${u.description}\n`,
          mdBold("Tags:") + ` ${(u.tags || []).join(", ")}\n`,
          mdBold("Prompt:") + "\n",
          mdCode(u.prompt),
        ].join("\n"),
    ),
  );

  return lines.join("\n");
}

// ─── README.md generator ───────────────────────────────────────────────────

function buildReadmeMd(p: PersonaRecord): string {
  return [
    `# ${p.name}${p.nativeName ? "\ (" + p.nativeName + ")" : ""}\n`,
    mdBold("AI Persona —") + ` ${p.shortBio}\n`,
    "\n",
    `| | |\n`,
    `|---|---|\n`,
    `| **Title** | ${p.title} |\n`,
    `| **Born** | ${p.born} |\n`,
    `| **Nationality** | ${p.nationality} |\n`,
    `| **Categories** | ${p.categories.join(", ")} |\n`,
    `| **Rarity** | ${rarityLabel(p.rarityOverride ?? "R")} |\n`,
    `| **Source** | [skillest/ekcheungAI](https://github.com/ekcheungAI/perskill) |\n`,
    "\n",
    "## Install\n",
    "### Claude Code / Cursor\n",
    "```bash\n",
    "# Copy this folder to your skills directory:\n",
    `cp -r skills/${p.id}/ ~/.claude/skills/\n`,
    "```\n",
    "\n",
    "### Copy System Prompt\n",
    "1. Open `SYSTEM_PROMPT.md`\n",
    "2. Copy the full prompt or the short prompt\n",
    "3. Paste into your LLM's system prompt\n",
    "\n",
    "## Files Included\n",
    "| File | Description |\n",
    "|---|---|\n",
    "| `SKILL.md` | Claude/Cursor skill file (auto-loaded) |\n",
    "| `PROFILE.md` | Full Wikipedia-depth profile |\n",
    "| `SYSTEM_PROMPT.md` | Ready-to-use AI behaviour prompt |\n",
    "| `USE_CASE_PROMPTS.md` | Copy-paste prompt templates |\n",
    "| \`README.md\` | This file |" + "\n",
    "\n",
    `**Last updated:** ${p.lastUpdated}  \n`,
    `**Version:** ${p.promptVersion}\n`,
  ].join("");
}

// ─── Main ──────────────────────────────────────────────────────────────────

interface PersonalityDimension {
  label: string;
  value: number;
  description: string;
}

interface Skill {
  name: string;
  level: number;
  description: string;
  category: string;
}

interface ThinkingFramework {
  name: string;
  description: string;
  howToApply: string;
  example: string;
}

interface VocabularyPattern {
  phrase: string;
  context: string;
  frequency: string;
}

interface Accomplishment {
  year: string;
  title: string;
  description: string;
  impact: string;
  tags: string[];
}

interface NewsItem {
  date: string;
  headline: string;
  summary: string;
  source: string;
  sourceUrl: string;
  sentiment: string;
  tags: string[];
}

interface Relationship {
  personaId: string;
  type: string;
  description: string;
  strength: number;
  since: string;
  status: string;
}

interface BookOrResource {
  title: string;
  author: string;
  type: string;
  relevance: string;
}

interface FailureCase {
  year: string;
  whatFailed: string;
  whyItFailed: string;
  whatTheyLearned: string;
  publicNarrative?: string;
  privateReality?: string;
}

interface CompetitiveWorldview {
  marketFrame?: string;
  threatRanking?: { name: string; threatLevel: string; reason: string }[];
  strategicFears?: string[];
  strategicConfidence?: string[];
  contrarianBeliefs?: string[];
}

interface UseCasePrompt {
  title: string;
  icon: string;
  description: string;
  prompt: string;
  tags: string[];
}

interface PromptVersion {
  version: string;
  date: string;
  changes: string;
}

interface PersonaRecord {
  id: string;
  name: string;
  nativeName?: string;
  title: string;
  shortBio: string;
  fullBio: string;
  born: string;
  nationality: string;
  categories: string[];
  accentColor: string;
  image: string;
  rarityOverride?: string;
  freshnessStatus?: string;
  lastUpdated: string;
  nextUpdateDue: string;
  dataSourceCount?: number;
  personalityTraits: string[];
  personalityDimensions: PersonalityDimension[];
  mbtiType?: string;
  keySkills: Skill[];
  thinkingFrameworks: ThinkingFramework[];
  decisionMakingStyle: string;
  problemSolvingApproach: string;
  communicationStyle: string;
  vocabularyPatterns: VocabularyPattern[];
  famousQuotes: string[];
  workingStyle: string;
  leadershipStyle: string;
  accomplishments: Accomplishment[];
  recentNews: NewsItem[];
  relationships: Relationship[];
  recommendedResources: BookOrResource[];
  weaknesses: string;
  blindSpots: string[];
  aiPersonaPrompt: string;
  aiPersonaPromptShort: string;
  promptVersion: string;
  promptChangelog?: PromptVersion[];
  useCasePrompts: UseCasePrompt[];
  failureCases?: FailureCase[];
  competitiveWorldview?: CompetitiveWorldview;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

function main() {
  const srcPath = path.join(ROOT, "src", "lib", "personas.ts");
  console.log(`Reading personas from: ${srcPath}`);

  // We can't import TS directly from a JS script, so we use a regex-based extractor
  const src = fs.readFileSync(srcPath, "utf-8");

  // Find the start of the personas array
  const arrayStart = src.indexOf("export const personas: Persona[] = [");
  if (arrayStart === -1) {
    console.error("ERROR: Could not find 'export const personas: Persona[] = ['");
    process.exit(1);
  }

  // Extract all top-level objects (id: "xxx", name: "xxx")
  // We use a simple approach: find each { id: "...", name: "..." }
  // by scanning for the pattern.
  const idPattern = /id:\s*"([^"]+)"/g;
  const namePattern = /name:\s*"([^"]+)"/g;

  // We need to find each persona's id + name + boundaries
  // Strategy: split by "  {" at the top level, then parse each
  const raw = src.slice(arrayStart);

  // Find the opening bracket of the array
  const arrayOpenIdx = raw.indexOf("[");
  const personasContent = raw.slice(arrayOpenIdx + 1);

  // Split by top-level object boundaries
  // Each persona starts at "  {" and ends at "  },\n\n" or "  }\n\n"
  const chunks: string[] = [];
  let depth = 0;
  let start = 0;
  let inString = false;
  let escapeNext = false;

  for (let i = 0; i < personasContent.length; i++) {
    const ch = personasContent[i];

    if (escapeNext) {
      escapeNext = false;
      continue;
    }

    if (ch === "\\") {
      escapeNext = true;
      continue;
    }

    if (ch === '"' && !escapeNext) {
      inString = !inString;
      continue;
    }

    if (inString) continue;

    if (ch === "{") {
      if (depth === 0) start = i;
      depth++;
    } else if (ch === "}") {
      depth--;
      if (depth === 0) {
        chunks.push(personasContent.slice(start, i + 1));
      }
    }
  }

  console.log(`Found ${chunks.length} persona chunks`);

  // Parse each chunk into a PersonaRecord
  const personas: PersonaRecord[] = chunks
    .map((chunk) => {
      try {
        // Extract key fields with regex
        const get = (field: string): string => {
          // Match field: "value" (handles multi-line)
          const re = new RegExp(`${field}:\\s*"([^"]*)"`, "m");
          const m = chunk.match(re);
          return m ? m[1] : "";
        };
        const getMulti = (field: string, maxLines = 3): string => {
          const re = new RegExp(`${field}:\\s*\`([\\s\\S]*?)\``, "m");
          const m = chunk.match(re);
          return m ? m[1].trim() : "";
        };
        const getNum = (field: string): number => {
          const re = new RegExp(`${field}:\\s*(\\d+)`, "m");
          const m = chunk.match(re);
          return m ? parseInt(m[1]) : 0;
        };

        // Extract arrays by finding the bracket boundaries
        function extractArray<T>(field: string, parser: (chunk: string) => T): T[] {
          // Find the field and its opening [
          const re = new RegExp(`${field}:\\s*\\[([\\s\\S]*?)\\]\\s*,?\\s*(?:\\/\\/|\\w|\\s|$)`, "m");
          const m = chunk.match(re);
          if (!m) return [];
          const inner = m[1];
          // Count top-level objects/brackets
          const items: string[] = [];
          let item = "";
          let d = 0;
          let inStr = false;
          let esc = false;
          for (const c of inner) {
            if (esc) { esc = false; item += c; continue; }
            if (c === "\\") { esc = true; item += c; continue; }
            if (c === '"') { inStr = !inStr; item += c; continue; }
            if (inStr) { item += c; continue; }
            if (c === "{") { d++; item += c; }
            else if (c === "}") { d--; item += c; }
            else if (c === "[" || c === "]") item += c;
            else if (c === "," && d === 0) {
              if (item.trim()) items.push(item.trim());
              item = "";
            } else {
              item += c;
            }
          }
          if (item.trim()) items.push(item.trim());
          return items.map(parser).filter(Boolean);
        }

        function parseObj<T>(s: string): T {
          const result: Record<string, unknown> = {};
          // Simple key-value extraction
          const kvRe = /(\w+):\s*(?:"([^"]*)"|`([\s\S]*?)`|(\d+))/g;
          let m;
          while ((m = kvRe.exec(s)) !== null) {
            const [, key, strVal, tmplVal, numVal] = m;
            result[key] = strVal ?? tmplVal ?? (numVal ? parseInt(numVal) : "");
          }
          return result as T;
        }

        const id = get("id");
        const name = get("name");

        if (!id || !name) return null;

        // Extract simple fields
        const persona: PersonaRecord = {
          id,
          name,
          nativeName: get("nativeName"),
          title: get("title"),
          shortBio: get("shortBio"),
          fullBio: get("fullBio"),
          born: get("born"),
          nationality: get("nationality"),
          accentColor: get("accentColor"),
          image: get("image"),
          rarityOverride: get("rarityOverride"),
          mbtiType: get("mbtiType"),
          decisionMakingStyle: get("decisionMakingStyle"),
          problemSolvingApproach: get("problemSolvingApproach"),
          communicationStyle: get("communicationStyle"),
          workingStyle: get("workingStyle"),
          leadershipStyle: get("leadershipStyle"),
          weaknesses: get("weaknesses"),
          aiPersonaPrompt: getMulti("aiPersonaPrompt"),
          aiPersonaPromptShort: getMulti("aiPersonaPromptShort"),
          promptVersion: get("promptVersion"),
          freshnessStatus: get("freshnessStatus"),
          lastUpdated: get("lastUpdated"),
          nextUpdateDue: get("nextUpdateDue"),
          dataSourceCount: getNum("dataSourceCount"),
          personalityTraits: extractArray("personalityTraits", (s) => {
            const re = /"([^"]+)"/;
            const m = s.match(re);
            return m ? m[1] : "";
          }),
          personalityDimensions: extractArray("personalityDimensions", (s) =>
            parseObj<PersonalityDimension>(s),
          ),
          keySkills: extractArray("keySkills", (s) => parseObj<Skill>(s)),
          thinkingFrameworks: extractArray("thinkingFrameworks", (s) =>
            parseObj<ThinkingFramework>(s),
          ),
          vocabularyPatterns: extractArray("vocabularyPatterns", (s) =>
            parseObj<VocabularyPattern>(s),
          ),
          famousQuotes: extractArray("famousQuotes", (s) => {
            const re = /"([^"]+)"/;
            const m = s.match(re);
            return m ? m[1] : "";
          }),
          accomplishments: extractArray("accomplishments", (s) =>
            parseObj<Accomplishment>(s),
          ),
          recentNews: extractArray("recentNews", (s) => parseObj<NewsItem>(s)),
          relationships: extractArray("relationships", (s) =>
            parseObj<Relationship>(s),
          ),
          recommendedResources: extractArray("recommendedResources", (s) =>
            parseObj<BookOrResource>(s),
          ),
          blindSpots: extractArray("blindSpots", (s) => {
            const re = /"([^"]+)"/;
            const m = s.match(re);
            return m ? m[1] : "";
          }),
          useCasePrompts: extractArray("useCasePrompts", (s) =>
            parseObj<UseCasePrompt>(s),
          ),
          promptChangelog: extractArray("promptChangelog", (s) =>
            parseObj<PromptVersion>(s),
          ),
          failureCases: extractArray("failureCases", (s) =>
            parseObj<FailureCase>(s),
          ),
          competitiveWorldview: parseObj<CompetitiveWorldview>(
            chunk.match(/competitiveWorldview:\s*\{([\s\S]*?)\}\s*,?/m)?.[1] ?? "",
          ),
          // categories is a string array — extract manually
          categories: (() => {
            const re = /categories:\s*\[([^\]]*)\]/;
            const m = chunk.match(re);
            if (!m) return [];
            return m[1]
              .split(",")
              .map((c) => c.trim().replace(/"/g, ""))
              .filter(Boolean);
          })(),
        };

        return persona;
      } catch (e) {
        console.warn("Parse error:", e);
        return null;
      }
    })
    .filter(Boolean) as PersonaRecord[];

  console.log(`Parsed ${personas.length} personas successfully`);
  console.log("IDs:", personas.map((p) => p.id).join(", "));

  // Generate output
  if (fs.existsSync(OUT_DIR)) {
    fs.rmSync(OUT_DIR, { recursive: true });
  }
  fs.mkdirSync(OUT_DIR, { recursive: true });

  for (const p of personas) {
    const dir = path.join(OUT_DIR, p.id);
    fs.mkdirSync(dir, { recursive: true });

    fs.writeFileSync(path.join(dir, "SKILL.md"), buildSkillMd(p), "utf-8");
    fs.writeFileSync(path.join(dir, "PROFILE.md"), buildProfileMd(p), "utf-8");
    fs.writeFileSync(
      path.join(dir, "SYSTEM_PROMPT.md"),
      buildSystemPromptMd(p),
      "utf-8",
    );
    fs.writeFileSync(
      path.join(dir, "USE_CASE_PROMPTS.md"),
      buildUseCasePromptsMd(p),
      "utf-8",
    );
    fs.writeFileSync(path.join(dir, "README.md"), buildReadmeMd(p), "utf-8");

    console.log(`  ✓ ${p.id}`);
  }

  console.log(`\nDone! Generated skills for ${personas.length} personas.`);
  console.log(`Output directory: ${OUT_DIR}`);

  // Generate root skills/README.md
  const rootReadme = [
    "# AI Persona Library — Skills\n",
    mdBold("Source:") + " [github.com/ekcheungAI/perskill](https://github.com/ekcheungAI/perskill)\n",
    "\n",
    `This folder contains ${personas.length} standalone AI persona skills.\n`,
    "\n",
    "## Available Personas\n",
    "\n",
    personas
      .map(
        (p) => {
          const hasResearch = fs.existsSync(path.join(ROOT, "skills", p.id, "research"));
          const researchBadge = hasResearch ? " `[DISTILLED]`" : "";
          return (
            `### ${p.name}${p.nativeName ? ` ${p.nativeName}` : ""} (${p.rarityOverride ?? "R"})${researchBadge}\n` +
            `${p.shortBio}\n` +
            `[Install →](${p.id}/README.md)\n`
          );
        },
      )
      .join("\n"),
    "\n",
    "## Research Depth Legend\n",
    "\n",
    "- `[DISTILLED]` — Full distill_templates research complete. See `skills/{id}/research/` for evidence.\n",
    "- *(no badge)* — Generated from `src/lib/personas.ts` only. Run `npx tsx scripts/research/persona-research.ts {id}` to begin distillation.\n",
    "\n",
    "## How to Install a Persona\n",
    "### Claude Code / Cursor\n",
    "```bash\n",
    "# Copy a persona folder into your skills directory\n",
    "cp -r skills/elon-musk/ ~/.claude/skills/\n",
    "```\n",
    "\n",
    "### Any LLM (System Prompt)\n",
    "1. Open the persona's `SYSTEM_PROMPT.md`\n",
    "2. Copy the short or full prompt\n",
    "3. Paste into your AI's system prompt settings\n",
    "\n",
    "## How to Add a New Persona\n",
    "```bash\n",
    "# 1. Scaffold research project\n",
    "npx tsx scripts/research/persona-research.ts new-persona --type=HK_ENTREPRENEUR\n",
    "\n",
    "# 2. Run data collection (Twitter + web)\n",
    "npx tsx scripts/research/pipeline.ts handle --type=HK_ENTREPRENEUR --deep-research\n",
    "\n",
    "# 3. Fill in distillation files (triple-verify-log.md, etc.)\n",
    "\n",
    "# 4. Run validation\n",
    "npx tsx scripts/research/run-validation.ts new-persona\n",
    "\n",
    "# 5. Add persona to src/lib/personas.ts\n",
    "\n",
    "# 6. Export skills\n",
    "npx tsx scripts/export-personas.ts\n",
    "```\n",
    "\n",
    "## Auto-Export\n",
    "This folder is auto-generated by `scripts/export-personas.ts`.  \n",
    "To regenerate after updating `src/lib/personas.ts`:\n",
    "```bash\n",
    "npx tsx scripts/export-personas.ts\n",
    "```\n",
  ].join("");

  fs.writeFileSync(path.join(OUT_DIR, "README.md"), rootReadme, "utf-8");
  console.log(`\n  ✓ skills/README.md (root index)`);
  console.log("\nAll done!");
}

main();
