#!/usr/bin/env npx tsx
/**
 * generate-skill-folders.ts
 *
 * Reads every persona from src/lib/personas.ts and generates
 * skills/{id}/SKILL.md following the SKILL.md standard format.
 *
 * Uses regex-based field extraction — no full object parsing needed.
 *
 * Usage: npx tsx scripts/generate-skill-folders.ts
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const PERSONAS_FILE = join(ROOT, "src/lib/personas.ts");
const SKILLS_DIR = join(ROOT, "skills");

// ── Helpers ───────────────────────────────────────────────────────────────────

function escapeFrontmatter(str: string): string {
  return str.replace(/"/g, '\\"').replace(/\n/g, " ");
}

function arrayToYaml(arr: string[]): string {
  if (!arr || arr.length === 0) return "[]";
  return "[ " + arr.map((s) => `"${s}"`).join(", ") + " ]";
}

function toTitle(str: string): string {
  return str.replace(/\b\w/g, (c) => c.toUpperCase());
}

function collapseWhitespace(str: string): string {
  return str.replace(/\s+/g, " ").trim();
}

// ── Field Extractors (regex-based, no full JSON parse) ─────────────────────────

/** Extracts a string value for a field at the top level of a persona object. */
function extractField(text: string, field: string): string | undefined {
  // Match: field: "value" or field: `value` at start of line (with indentation)
  const re = new RegExp(
    `^\\s*${field}:\\s*(['"\`])([^'"\`]*)\\1`,
    "m"
  );
  const m = text.match(re);
  if (m) return collapseWhitespace(m[2]);

  // Multi-line string ( >-  or > )
  const multiRe = new RegExp(
    `^\\s*${field}:\\s*>[-]?\\s*\\n((?:[ \\t]+[^\\n]*\\n?)*)`,
    "m"
  );
  const mm = multiRe.exec(text);
  if (mm) return collapseWhitespace(mm[1]);

  return undefined;
}

/** Extracts a plain string array field like categories: ["Tech", "Business"] */
function extractStringArray(text: string, field: string): string[] {
  const re = new RegExp(
    `^\\s*${field}:\\s*\\[([^\\]]*)\\]`,
    "m"
  );
  const m = text.match(re);
  if (!m) return [];
  return m[1]
    .split(",")
    .map((s) => collapseWhitespace(s.replace(/['"]/g, "")))
    .filter(Boolean);
}

/** Extracts all top-level string key-value pairs from a persona block */
function extractKeyValues(text: string): Record<string, string> {
  const result: Record<string, string> = {};
  // Match field: "value" patterns
  const re = /^\s*([a-zA-Z0-9_]+):\s*(['"`])(.*?)\2/gm;
  let m;
  while ((m = re.exec(text)) !== null) {
    result[m[1]] = collapseWhitespace(m[3]);
  }
  // Multi-line strings (>-, >)
  const multiRe = /^\s*([a-zA-Z0-9_]+):\s*>[-]?\s*\n((?:[ \t]+[^\n]*\n?)*)/gm;
  let mm;
  while ((mm = multiRe.exec(text)) !== null) {
    result[mm[1]] = collapseWhitespace(mm[2]);
  }
  return result;
}

// ── Section Builders ───────────────────────────────────────────────────────────

function buildFrontmatter(kv: Record<string, string>): string {
  const id = kv.id || "";
  const name = kv.name || id;
  const categories = extractFieldArray(kv.raw || "", "categories") || [];
  const desc = [
    name,
    kv.title,
    kv.shortBio,
    "Installs thinking style, decision-making patterns, communication style, and AI prompts.",
    categories.length ? `Use when working with ${categories.join(", ")} problems.` : "",
    `Triggers on: ${name}, ${categories.join(", ")}.`,
  ]
    .filter(Boolean)
    .join(". ");

  return [
    "---",
    `name: ${id}`,
    `description: >-`,
    `  ${escapeFrontmatter(desc)}`,
    `version: "${kv.promptVersion || "1.0"}"`,
    `source: https://github.com/ekcheungAI/skillest`,
    `persona_id: ${id}`,
    `rarity: ${kv.rarityOverride || "Standard"}`,
    `categories: ${arrayToYaml(categories)}`,
    `tags: ${arrayToYaml(categories)}`,
    `data_freshness: "${kv.lastUpdated || ""}"`,
    "---",
    "",
  ].join("\n");
}

function extractFieldArray(text: string, field: string): string[] | undefined {
  const re = new RegExp(`^\\s*${field}:\\s*\\[([^\\]]*)\\]`, "m");
  const m = text.match(re);
  if (!m) return undefined;
  return m[1]
    .split(",")
    .map((s) => collapseWhitespace(s.replace(/['"]/g, "")))
    .filter(Boolean);
}

function buildQuickIdentity(kv: Record<string, string>, raw: string): string {
  const traits = (extractFieldArray(raw, "personalityTraits") || [])
    .slice(0, 6)
    .map(toTitle)
    .join(" · ") || "—";

  return [
    `## Quick Identity`,
    "",
    `**Title:** ${kv.title || "—"}`,
    `**Born:** ${kv.born || "—"}`,
    `**Nationality:** ${kv.nationality || "—"}`,
    `**Categories:** ${(extractFieldArray(raw, "categories") || []).join(", ") || "—"}`,
    `**Rarity:** ${kv.rarityOverride || "Standard"}`,
    `**Data Freshness:** Last updated ${kv.lastUpdated || "—"}`,
    "",
    `**Personality Traits:** ${traits}`,
    "",
  ].join("\n");
}

function buildThinkingStyle(raw: string): string {
  const sections: string[] = [];

  // personalityDimensions (inline JSON array)
  const dimsMatch = raw.match(
    /personalityDimensions:\s*\[([\s\S]*?)\n\s*\]/
  );
  if (dimsMatch) {
    const dims = dimsMatch[1];
    const items = dims
      .split(/{/)
      .slice(1)
      .map((s) => "{" + s)
      .filter((s) => s.includes("label"))
      .map((s) => {
        const labelM = s.match(/label:\s*"([^"]*)"/);
        const valM = s.match(/value:\s*(\d+)/);
        const descM = s.match(/description:\s*"([^"]*)"/);
        const label = labelM ? labelM[1] : "";
        const value = valM ? valM[1] : "";
        const desc = descM ? descM[1] : "";
        return label && value
          ? `- **${label}** (${value}/100): ${desc}`
          : null;
      })
      .filter(Boolean);

    if (items.length > 0) {
      sections.push(
        ["## Personality Radar\n", "Six dimensions measured 0-100:\n", items.join("\n")].join("")
      );
    }
  }

  // thinkingFrameworks
  const tfMatch = raw.match(
    /thinkingFrameworks:\s*\[([\s\S]*?)\n\s*\]/
  );
  if (tfMatch) {
    const frameworks = tfMatch[1];
    const parts = frameworks
      .split(/{/)
      .slice(1)
      .map((s) => "{" + s)
      .filter((s) => s.includes("name:"))
      .map((block) => {
        const nameM = block.match(/name:\s*"([^"]*)"/);
        const descM = block.match(/description:\s*"([^"]*)"/);
        const applyM = block.match(/howToApply:\s*"([^"]*)"/);
        const exM = block.match(/example:\s*"([^"]*)"/);
        const name = nameM ? nameM[1] : "";
        const parts2: string[] = [`### ${name}`, ""];
        if (descM) parts2.push(descM[1]);
        if (applyM) parts2.push(`\n**How to Apply:** ${applyM[1]}`);
        if (exM) parts2.push(`\n**Example:** ${exM[1]}`);
        return parts2.join("").trim();
      })
      .filter(Boolean);

    if (parts.length > 0) {
      sections.push(
        ["\n## Thinking Frameworks\n", parts.join("\n\n---\n\n")].join("")
      );
    }
  }

  const dm = extractField(raw, "decisionMakingStyle");
  if (dm) sections.push(["\n## Decision-Making Style\n", dm].join(""));

  const ps = extractField(raw, "problemSolvingApproach");
  if (ps) sections.push(["\n## Problem-Solving Approach\n", ps].join(""));

  return sections.join("\n");
}

function buildWorkingStyle(raw: string): string {
  const sections: string[] = [];

  const ws = extractField(raw, "workingStyle");
  if (ws) sections.push(["\n## Working Style\n", ws].join(""));

  const ls = extractField(raw, "leadershipStyle");
  if (ls) sections.push(["\n## Leadership Style\n", ls].join(""));

  const cs = extractField(raw, "communicationStyle");
  if (cs) sections.push(["\n## Communication Style\n", cs].join(""));

  const td = extractField(raw, "teamDynamics");
  if (td) sections.push(["\n## Team Dynamics\n", td].join(""));

  // vocabularyPatterns
  const vpMatch = raw.match(
    /vocabularyPatterns:\s*\[([\s\S]*?)\n\s*\]/
  );
  if (vpMatch) {
    const patterns = vpMatch[1]
      .split(/{/)
      .slice(1)
      .map((s) => "{" + s)
      .filter((s) => s.includes("phrase:"))
      .map((block) => {
        const phraseM = block.match(/phrase:\s*"([^"]*)"/);
        const ctxM = block.match(/context:\s*"([^"]*)"/);
        const freqM = block.match(/frequency:\s*"([^"]*)"/);
        const phrase = phraseM ? phraseM[1] : "";
        let line = `- **"${phrase}"**`;
        if (ctxM) line += ` — ${ctxM[1]}`;
        if (freqM) line += ` (${freqM[1]})`;
        return phrase ? line : null;
      })
      .filter(Boolean);

    if (patterns.length > 0) {
      sections.push(
        [
          "\n## Vocabulary Patterns\n",
          "These phrases signal how this persona thinks and communicates:\n",
          patterns.join("\n"),
        ].join("")
      );
    }
  }

  return sections.join("\n");
}

function buildAIPrompts(raw: string): string {
  const sections: string[] = [];

  const ap = extractField(raw, "aiPersonaPrompt");
  if (ap) {
    sections.push(
      ["## AI System Prompt\n", "The full behavioural system prompt:\n", "```\n", ap, "\n```"].join("")
    );
  }

  const short = extractField(raw, "aiPersonaPromptShort");
  if (short) {
    sections.push(
      ["\n## Short Prompt\n", "```\n", short, "\n```"].join("")
    );
  }

  // useCasePrompts
  const ucMatch = raw.match(
    /useCasePrompts:\s*\[([\s\S]*?)\n\s*\]/
  );
  if (ucMatch) {
    const prompts = ucMatch[1]
      .split(/{/)
      .slice(1)
      .map((s) => "{" + s)
      .filter((s) => s.includes("title:"))
      .map((block) => {
        const titleM = block.match(/title:\s*"([^"]*)"/);
        const descM = block.match(/description:\s*"([^"]*)"/);
        const promptM = block.match(/prompt:\s*"([^"]*)"/);
        const title = titleM ? titleM[1] : "";
        const parts: string[] = [`### ${title}`, ""];
        if (descM) parts.push(descM[1]);
        if (promptM) parts.push("", "```", promptM[1], "```");
        return title ? parts.join("\n") : null;
      })
      .filter(Boolean);

    if (prompts.length > 0) {
      sections.push(["\n## Use-Case Prompts\n", prompts.join("\n\n")].join(""));
    }
  }

  return sections.join("\n");
}

function buildOverview(raw: string): string {
  const sections: string[] = [];

  const bio = extractField(raw, "fullBio");
  if (bio) sections.push(["## Biography\n", bio].join(""));

  // accomplishments
  const acMatch = raw.match(
    /accomplishments:\s*\[([\s\S]*?)\n\s*\]/
  );
  if (acMatch) {
    const items = acMatch[1]
      .split(/{/)
      .slice(1)
      .map((s) => "{" + s)
      .filter((s) => s.includes("title:"))
      .map((block) => {
        const yearM = block.match(/year:\s*"([^"]*)"/);
        const titleM = block.match(/title:\s*"([^"]*)"/);
        const descM = block.match(/description:\s*"([^"]*)"/);
        const year = yearM ? yearM[1] : "—";
        const title = titleM ? titleM[1] : "";
        const desc = descM ? descM[1] : "";
        return title ? `- **${year}** ${title}${desc ? `: ${desc}` : ""}` : null;
      })
      .filter(Boolean);

    if (items.length > 0) {
      sections.push(
        ["\n## Accomplishments Timeline\n", items.join("\n")].join("")
      );
    }
  }

  // recommendedResources
  const rrMatch = raw.match(
    /recommendedResources:\s*\[([\s\S]*?)\n\s*\]/
  );
  if (rrMatch) {
    const items = rrMatch[1]
      .split(/{/)
      .slice(1)
      .map((s) => "{" + s)
      .filter((s) => s.includes("name:"))
      .map((block) => {
        const nameM = block.match(/name:\s*"([^"]*)"/);
        const authorM = block.match(/author:\s*"([^"]*)"/);
        const descM = block.match(/description:\s*"([^"]*)"/);
        const name = nameM ? nameM[1] : "";
        let line = `- **${name}**`;
        if (authorM) line += ` — ${authorM[1]}`;
        if (descM) line += `: ${descM[1]}`;
        return name ? line : null;
      })
      .filter(Boolean);

    if (items.length > 0) {
      sections.push(
        ["\n## Recommended Resources\n", items.join("\n")].join("")
      );
    }
  }

  const weak = extractField(raw, "weaknesses");
  if (weak) sections.push(["\n## Weaknesses\n", weak].join(""));

  return sections.join("\n");
}

function buildFamousQuotes(raw: string): string {
  const fqMatch = raw.match(/famousQuotes:\s*\[([\s\S]*?)\n\s*\]/);
  if (!fqMatch) return "";
  const quotes = fqMatch[1]
    .match(/"([^"]*)"/g)
    ?.map((q) => `> "${q.replace(/^"|"$/g, "")}"`)
    .join("\n\n");
  return quotes ? ["\n## Famous Quotes\n", quotes].join("\n") : "";
}

function buildInstallSection(kv: Record<string, string>): string {
  const id = kv.id || "";
  const githubUrl = kv.githubUrl ||
    `https://github.com/ekcheungAI/skillest/tree/main/skills/${id}`;
  return [
    "---",
    "",
    "## Install This Persona",
    "",
    "Copy the contents of `SKILL.md` into your AI agent's system prompt.",
    "",
    "For Claude Code / Cursor: place this folder in your `~/.claude/skills/` or `~/.cursor/skills/` directory.",
    "",
    `**GitHub Source:** ${githubUrl}`,
    "",
  ].join("\n");
}

// ── Main ─────────────────────────────────────────────────────────────────────

function generateSKILL(id: string, raw: string): string {
  const kv = extractKeyValues(raw);
  kv.id = id;
  kv.raw = raw; // pass raw for array field extraction

  const parts: string[] = [];
  parts.push(buildFrontmatter(kv));
  parts.push(`# ${kv.name || id}${kv.nativeName ? ` — ${kv.nativeName}` : ""}`);
  parts.push("");
  parts.push(buildQuickIdentity(kv, raw));
  parts.push(buildThinkingStyle(raw));
  parts.push(buildWorkingStyle(raw));
  parts.push(buildAIPrompts(raw));
  parts.push(buildOverview(raw));
  parts.push(buildFamousQuotes(raw));
  parts.push(buildInstallSection(kv));
  return parts.join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";
}

function extractPersonaBlocks(content: string): Array<{ id: string; raw: string }> {
  const blocks: Array<{ id: string; raw: string }> = [];

  // Find the start of the personas array
  const startMatch = content.match(/personas\s*:\s*Persona\s*\[\]\s*=\s*\[/);
  if (!startMatch) throw new Error("Could not find 'personas: Persona[] = [' in file");
  const arrayStart = content.indexOf(startMatch[0]) + startMatch[0].length;

  // Find each { id: "xxx", ... } block by scanning with a depth counter
  let i = arrayStart;
  let depth = 0;
  let inString = false;
  let stringChar = "";
  let blockStart = -1;

  while (i < content.length) {
    const ch = content[i];

    if (!inString) {
      if (ch === '"' || ch === "'" || ch === "`") {
        inString = true;
        stringChar = ch;
      } else if (ch === "{") {
        depth++;
        if (depth === 1) blockStart = i;
      } else if (ch === "}") {
        depth--;
        if (depth === 0 && blockStart !== -1) {
          const blockEnd = i + 1;
          const blockText = content.slice(blockStart, blockEnd);
          // Extract id from the FIRST 200 chars of the block (top-level field, not nested)
          const idPos = blockText.slice(0, 200).indexOf('id: "');
          let personaId = "";
          if (idPos !== -1) {
            const idStart = idPos + 5;
            const idEnd = blockText.indexOf('"', idStart);
            personaId = blockText.slice(idStart, idEnd);
          }
          if (personaId) blocks.push({ id: personaId, raw: blockText });
          blockStart = -1;
        }
      }
    } else {
      if (ch === stringChar && content[i - 1] !== "\\") {
        inString = false;
      }
    }
    i++;
  }

  return blocks;
}

function main() {
  console.log("Reading personas from:", PERSONAS_FILE);
  const content = readFileSync(PERSONAS_FILE, "utf-8");

  let blocks: Array<{ id: string; raw: string }>;
  try {
    blocks = extractPersonaBlocks(content);
  } catch (e: any) {
    console.error("Failed to extract personas:", e);
    process.exit(1);
  }

  console.log(`Found ${blocks.length} personas. Generating SKILL.md files...\n`);

  let created = 0;
  let skipped = 0;
  let errors = 0;

  for (const block of blocks) {
    if (!block.id) { skipped++; continue; }

    const folder = join(SKILLS_DIR, block.id);
    const file = join(folder, "SKILL.md");

    if (!existsSync(folder)) {
      mkdirSync(folder, { recursive: true });
    }

    try {
      const md = generateSKILL(block.id, block.raw);
      writeFileSync(file, md, "utf-8");
      console.log(`  ✓ ${block.id}/SKILL.md`);
      created++;
    } catch (e: any) {
      console.error(`  ✗ ${block.id}: ${e.message}`);
      errors++;
    }
  }

  console.log(`\nDone: ${created} created, ${skipped} skipped, ${errors} errors.`);

  if (errors > 0) process.exit(1);
}

main();
