#!/usr/bin/env tsx
/**
 * export-all-skills.ts
 *
 * Batch exports skill files for all personas in personas.ts.
 * Writes to skills/{id}/ directory (one subdirectory per persona).
 *
 * Usage:
 *   npx tsx scripts/research/2_distill/export-all-skills.ts           # all 70 personas
 *   npx tsx scripts/research/2_distill/export-all-skills.ts --dry-run  # preview
 *   npx tsx scripts/research/2_distill/export-all-skills.ts --tier=UPGRADED  # only UPGRADED
 *   npx tsx scripts/research/2_distill/export-all-skills.ts --id=justin-sun  # single persona
 */

import { createRequire } from "module";
import { readFileSync } from "fs";
import { resolve } from "path";
import { getScriptDir, resolveProjectRoot } from "./path-utils.js";

const SCRIPT_DIR = getScriptDir();
const ROOT = resolveProjectRoot(SCRIPT_DIR);
const require = createRequire(import.meta.url);
const PERSONAS_PATH = resolve(ROOT, "src/lib/personas.ts");
const SKILLS_DIR = resolve(ROOT, "skills");

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Persona {
  id: string; name: string; nativeName?: string; title: string;
  shortBio: string; fullBio: string; born: string; nationality: string;
  categories: string[]; accentColor: string; image: string;
  rarityOverride?: string; promptTier: string; githubUrl?: string;
  lastUpdated: string; nextUpdateDue: string; dataSourceCount: number;
  personalityTraits: string[]; personalityDimensions: { label: string; value: number; description: string }[];
  mbtiType?: string; enneagramType?: string;
  keySkills: { name: string; level: number; description: string; category: string }[];
  thinkingFrameworks: { name: string; description: string; howToApply: string; example: string }[];
  decisionMakingStyle: string; problemSolvingApproach: string;
  communicationStyle: string; vocabularyPatterns: { phrase: string; context: string; frequency: string }[];
  famousQuotes: string[]; workingStyle: string; leadershipStyle: string; teamDynamics: string;
  accomplishments: { year: string; title: string; description: string; impact: string; tags: string[] }[];
  recentNews: { date: string; headline: string; summary: string; source: string; sourceUrl: string; sentiment: string; tags: string[] }[];
  relationships: { personaId: string; type: string; description: string; strength: string; since: string; status: string }[];
  recommendedResources: { title: string; author: string; type: string; relevance: string }[];
  weaknesses: string; blindSpots: string[];
  competitors: { name: string; relationship: string; description: string }[];
  mentalModels?: { name: string; origin: string; trigger: string; internalMonologue: string; output: string; confidence: string }[];
  skillChain: { name: string; originStory: string }[];
  decisionJournal: { year: string; situation: string; decision: string; reasoning: string; outcome: string; lesson: string }[];
  failureCases: { year: string; whatFailed: string; whatWentWrong: string; lesson: string }[];
  competitiveWorldview?: string;
  decisionHeuristics?: { name: string; scenario: string; example: string }[];
  values?: { value: string; description: string; priority: number }[];
  antiPatterns?: { behavior: string; reason: string; quote?: string }[];
  internalTensions?: { tension: string; explanation: string; manifestation: string }[];
  honestBoundaries?: { limitation: string; explanation: string; implication: string }[];
  identityCard?: { selfDescription: string; startingPoint: string; coreBelief: string };
  agenticProtocol?: { step1Classification: string; step2Research: string; step3Response: string };
  aiPersonaPrompt: string; aiPersonaPromptShort: string;
  promptVersion: string; promptChangelog: { version: string; date: string; changes: string }[];
  useCasePrompts: { title: string; icon: string; description: string; prompt: string; tags: string[] }[];
}

// ─── Load personas ─────────────────────────────────────────────────────────────

function loadPersonas(): Persona[] {
  const require = createRequire(import.meta.url);
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require(PERSONAS_PATH) as any;
  const arr = mod.personas ?? mod.default ?? mod;
  if (!Array.isArray(arr)) throw new Error("Could not extract personas array from personas.ts");
  return arr as Persona[];
}

// ─── File generators ───────────────────────────────────────────────────────────

function stripTemplateWrapper(content: string): string {
  return content.replace(/^`/, "").replace(/`;?\s*$/, "").trim();
}

function generateSKILL(p: Persona): string {
  const raw = p.aiPersonaPrompt;
  const content = raw.startsWith("`") ? stripTemplateWrapper(raw) : raw;
  return `---
name: ${p.id}-perspective
description: |
  ${p.name}${p.nativeName ? `（${p.nativeName}）` : ""}的思维框架与表达方式。基于 ${p.dataSourceCount} 个数据来源，
  提炼 ${p.mentalModels?.length ?? 0} 个核心心智模型、${p.decisionHeuristics?.length ?? 0} 条决策启发式和完整的表达 DNA。
  用途：作为思维顾问，用 ${p.name} 的视角分析 ${p.categories.join("、")} 问题。
  触发词（中）：「用 ${p.name} 的视角」「如果 ${p.name} 会怎么看」「切换到 ${p.name} 模式」
  Triggers (EN): "Use ${p.name}'s perspective", "What would ${p.name} think?", "Switch to ${p.name} mode"
version: "${p.promptVersion}"
source: https://github.com/ekcheungAI/perskill
persona_id: ${p.id}
---

${content}`;
}

function generateSYSTEM_PROMPT(p: Persona): string {
  const shortPrompt = p.aiPersonaPromptShort || "You are " + p.name + ". " + p.shortBio;
  const changelogRows = p.promptChangelog?.map(v => `| ${v.version} | ${v.date} | ${v.changes} |`).join("\n");
  const fullRaw = p.aiPersonaPrompt;
  const fullContent = fullRaw.startsWith("`") ? stripTemplateWrapper(fullRaw) : fullRaw;

  return `# ${p.name}${p.nativeName ? ` (${p.nativeName})` : ""} — AI System Prompt

---
**Version:** ${p.promptVersion}
**Persona ID:** ${p.id}
**Installed from:** https://github.com/ekcheungAI/perskill
**Research cutoff:** ${p.lastUpdated}

---

## Short Prompt (copy-paste)

\`\`\`
${shortPrompt}
\`\`\`

---

## Full System Prompt

\`\`\`
---
name: ${p.id}-perspective
description: |
  ${p.name}${p.nativeName ? `（${p.nativeName}）` : ""}的思维框架与表达方式。基于 ${p.dataSourceCount} 个数据来源，
  提炼 ${p.mentalModels?.length ?? 0} 个核心心智模型、${p.decisionHeuristics?.length ?? 0} 条决策启发式和完整的表达 DNA。
  用途：作为思维顾问，用 ${p.name} 的视角分析 ${p.categories.join("、")} 问题。
  触发词（中）：「用 ${p.name} 的视角」「如果 ${p.name} 会怎么看」「切换到 ${p.name} 模式」
  Triggers (EN): "Use ${p.name}'s perspective", "What would ${p.name} think?", "Switch to ${p.name} mode"
version: "${p.promptVersion}"
---

${fullContent}
\`\`\`

---

## Prompt Version History

| Version | Date | Changes |
|---------|------|---------|
${changelogRows}

---

## How to Install

### Claude Code / Cursor
\`\`\`bash
cp -r skills/${p.id}/ ~/.claude/skills/
\`\`\`

### Direct system prompt
1. Copy the **Short Prompt** above, or the full YAML block from **Full System Prompt**
2. Paste into your model's system prompt field
3. Activate with any of the trigger phrases

---

*Generated from \`client/src/lib/personas.ts\` by \`scripts/research/2_distill/export-all-skills.ts\`*
`;
}

function generateUSE_CASE_PROMPTS(p: Persona): string {
  if (!p.useCasePrompts || p.useCasePrompts.length === 0) {
    return `# ${p.name} — Use-Case Prompts

---
**0 prompts available.**
**Persona ID:** ${p.id}

---

No use-case prompts defined in \`personas.ts\` for this persona yet.

---
*Generated by \`scripts/research/2_distill/export-all-skills.ts\`*
`;
  }
  const sections = p.useCasePrompts.map((uc, i) => {
    const tagsStr = uc.tags?.length ? uc.tags.join(", ") : "—";
    return `### ${i + 1}. ${uc.title}
${uc.description ? uc.description + "\n" : ""}
**Tags:** ${tagsStr}

**Prompt:**

\`\`\`
${uc.prompt || "(No prompt defined)"}
\`\`\`
`;
  }).join("\n---\n");

  return `# ${p.name}${p.nativeName ? ` (${p.nativeName})` : ""} — Use-Case Prompts

---
**${p.useCasePrompts.length} prompt${p.useCasePrompts.length !== 1 ? "s" : ""} available.**
**Persona ID:** ${p.id}

---

## How to Use

Copy any prompt below and paste it into your LLM. For full immersion, paste **SYSTEM_PROMPT.md** into your model's system prompt field.

---

## Quick-Use Prompts

${sections}

---
*Generated from \`client/src/lib/personas.ts\` by \`scripts/research/2_distill/export-all-skills.ts\`*
`;
}

function generatePROFILE(p: Persona): string {
  const dimensions = (p.personalityDimensions ?? []).map(d =>
    `| ${d.label} | ${d.value}/100 | ${d.description} |`
  ).join("\n");

  const frameworks = (p.thinkingFrameworks ?? []).map(f =>
    `- **${f.name}**: ${f.description}`
  ).join("\n");

  const accomplishments = (p.accomplishments ?? []).map(a =>
    `| ${a.year} | ${a.title} | ${a.description} | ${a.impact} |`
  ).join("\n");

  const relationships = (p.relationships ?? []).map(r =>
    `| [${r.personaId}](https://github.com/ekcheungAI/perskill/tree/main/skills/${r.personaId}) | ${r.type} | ${r.description} | ${r.strength} | ${r.since} | ${r.status} |`
  ).join("\n");

  const news = (p.recentNews ?? []).slice(0, 10).map(n =>
    `| ${n.date} | ${n.headline} | ${n.source} | \`${n.sentiment}\` |`
  ).join("\n");

  const competitors = (p.competitors ?? []).map(c =>
    `- **${c.name}** (${c.relationship}): ${c.description}`
  ).join("\n");

  return `# ${p.name}${p.nativeName ? ` ${p.nativeName}` : ""}

---
id: ${p.id}
title: ${p.title}
born: ${p.born}
nationality: ${p.nationality}
categories: [${p.categories.join(", ")}]
accentColor: ${p.accentColor}
mbti: ${p.mbtiType || "—"}
enneagram: ${p.enneagramType || "—"}
promptTier: ${p.promptTier}
promptVersion: ${p.promptVersion}
lastUpdated: ${p.lastUpdated}
github: ${p.githubUrl || `https://github.com/ekcheungAI/perskill/tree/main/skills/${p.id}`}
---

## ${p.shortBio}

${p.fullBio}

## Personality Dimensions

| Dimension | Score | Description |
|-----------|:------:|------------|
${dimensions}

## Thinking Frameworks

${frameworks}

## Key Accomplishments

| Year | Title | Description | Impact |
|------|-------|-------------|--------|
${accomplishments}

## Relationships

| Persona | Type | Description | Strength | Since | Status |
|---------|------|-------------|----------|-------|--------|
${relationships}

## Recent News

| Date | Headline | Source | Sentiment |
|------|----------|--------|-----------|
${news}

## Competitive Landscape

${competitors}

## Weaknesses

${p.weaknesses}

## Blind Spots

${(p.blindSpots ?? []).map(s => `- ${s}`).join("\n")}

---
*Generated from \`client/src/lib/personas.ts\` by \`scripts/research/2_distill/export-all-skills.ts\`*
`;
}

function generateREADME(p: Persona): string {
  return `# ${p.name}${p.nativeName ? ` (${p.nativeName})` : ""}

**${p.title}**

${p.shortBio}

| | |
|---|---|
| **Title** | ${p.title} |
| **Born** | ${p.born} |
| **Nationality** | ${p.nationality} |
| **Categories** | ${p.categories.join(", ")} |
| **Prompt Tier** | ${p.promptTier} |
| **Rarity** | ${p.rarityOverride || (p.promptTier === "UPGRADED" ? "Double Rare" : "Common")} |
| **Source** | [ekcheungAI/perskill](https://github.com/ekcheungAI/perskill) |

## Install

### Claude Code / Cursor
\`\`\`bash
cp -r skills/${p.id}/ ~/.claude/skills/
\`\`\`

### Copy System Prompt
1. Open \`SYSTEM_PROMPT.md\`
2. Copy the short prompt or the full YAML block
3. Paste into your LLM's system prompt field

## Files Included

| File | Description |
|------|-------------|
| \`SKILL.md\` | Full Claude/Cursor skill file (auto-loaded) |
| \`PROFILE.md\` | Wikipedia-depth profile |
| \`SYSTEM_PROMPT.md\` | Ready-to-use AI behaviour prompt |
| \`USE_CASE_PROMPTS.md\` | Copy-paste prompt templates |
| \`README.md\` | This file |

**Last updated:** ${p.lastUpdated} | **Version:** ${p.promptVersion}

---

*AI persona generated from [ekcheungAI/perskill](https://github.com/ekcheungAI/perskill)*
`;
}

function generateResearchReadme(p: Persona): string {
  return `# ${p.name} — Research Archive

> **Research type:** ${p.categories.join(", ")}
> **Compiled:** ${p.lastUpdated}
> **Status:** FROM_PERSONA_DATA

## What's Inside

||| File | Status |
|||------|--------|
||| \`triple-verify-log.md\` | Blank (fill before shipping) |
||| \`validation-log.md\` | Blank (fill before shipping) |

## Research Coverage Summary

| Dimension | Count | Notes |
|-----------|------:|-------|
| Mental models | ${p.mentalModels?.length ?? 0} | From \`personas.ts\` |
| Decision heuristics | ${p.decisionHeuristics?.length ?? 0} | From \`personas.ts\` |
| Contradictions | ${p.internalTensions?.length ?? 0} | From \`personas.ts\` |
| Use-case prompts | ${p.useCasePrompts.length} | From \`personas.ts\` |
| Data sources | ${p.dataSourceCount} | |
| Research cutoff | ${p.lastUpdated} | |

## Next Steps

- [ ] Run full research pipeline to collect primary sources
- [ ] Fill in \`triple-verify-log.md\` (15–25 candidates → 3–7 Mental Models)
- [ ] Fill in \`validation-log.md\` (3 known-statement tests + 1 novel question)
- [ ] Run \`npx tsx scripts/research/3_validate/validation-runner.ts ${p.id}\`
- [ ] Ship when ship-gate items are checked

---
*Generated by \`scripts/research/2_distill/export-all-skills.ts\`*
`;
}

function generateTripleVerifyLog(p: Persona): string {
  const rows = Array.from({ length: 15 }, (_, i) => {
    const model = p.mentalModels?.[i];
    return `||| ${i + 1} | ${model?.name ?? ""} | | | ☐ | | ☐ | | ☐ | |`;
  }).join("\n");

  return `# Triple Verification Log — ${p.name}

> Adapted from \`distill_templates/TRIPLE_VERIFY.md\`.

**Rule:** Pass 3/3 → Mental Model. Pass 2/3 → Decision Heuristic. Pass 1/3 → Color. Pass 0/3 → Cut.

---

## The Three Tests

### Test 1 — Cross-Domain Reproduction
Same framework must surface in ≥2 different domains.

### Test 2 — Generative Power
The model must let you predict their stance on a problem they've never addressed publicly.

### Test 3 — Non-Obvious / Exclusive
Must reveal a distinctively theirs perspective that a thoughtful competitor would disagree with.

---

## Candidate Log

||| # | Candidate model | Domain 1 | Domain 2 | T1? | Novel prediction | T2? | Who disagrees? | T3? | Verdict |
|||---|---|- | - |:---:|- |:---:|- |:---:| - |
${rows}

**Target:** 15–25 candidates → 3–7 Mental Models + 5–10 Heuristics.

---

*Fill in for persona: ${p.name} (${p.id})*
`;
}

function generateValidationLog(p: Persona): string {
  return `# Validation Harness — ${p.name}

> Adapted from \`distill_templates/VALIDATION_HARNESS.md\`.
> Run this BEFORE shipping any persona skill.

---

## The 3+1 Protocol

### Part A — Three Known-Statement Tests (directional consistency)

|| # | Question posed | Subject's real answer (hidden) | Skill's answer | Direction match? | Notes |
||---|---------------|-------------------------------|----------------|:---------------:|-------|
|| 1 | | | | ☐ | |
|| 2 | | | | ☐ | |
|| 3 | | | | ☐ | |

**Threshold:** 2 of 3 must be directional matches.

---

### Part B — One Novel-Question Test (calibrated uncertainty)

|| Novel question | Skill's answer | Mental model applied? | Uncertainty acknowledged? | Fabrication risk? | Verdict |
||---------------|----------------|:---------------------:|:-----------------------:|:-----------------:|---------|
|| | | | ☐ | ☐ | Pass / Fail |

---

## Ship Gate

- [ ] 2 of 3 Part A tests pass
- [ ] Part B passes
- [ ] Changelog entry drafted
- [ ] Source catalog committed
- [ ] Triple verification log committed

---
*Fill in for persona: ${p.name} (${p.id})*
`;
}

// ─── Batch export ─────────────────────────────────────────────────────────────

interface ExportOptions {
  dryRun?: boolean;
  tier?: string;
  id?: string;
}

async function exportPersona(p: Persona, opts: ExportOptions, log: string[]): Promise<void> {
  const { dryRun = false } = opts;
  const skillDir = resolve(SKILLS_DIR, p.id);
  const researchDir = resolve(skillDir, "research");

  if (!dryRun) {
    const { mkdirSync, writeFileSync } = await import("fs");
    mkdirSync(skillDir, { recursive: true });
    mkdirSync(researchDir, { recursive: true });

    writeFileSync(resolve(skillDir, "SKILL.md"), generateSKILL(p));
    writeFileSync(resolve(skillDir, "SYSTEM_PROMPT.md"), generateSYSTEM_PROMPT(p));
    writeFileSync(resolve(skillDir, "USE_CASE_PROMPTS.md"), generateUSE_CASE_PROMPTS(p));
    writeFileSync(resolve(skillDir, "PROFILE.md"), generatePROFILE(p));
    writeFileSync(resolve(skillDir, "README.md"), generateREADME(p));
    writeFileSync(resolve(researchDir, "README.md"), generateResearchReadme(p));
    writeFileSync(resolve(researchDir, "triple-verify-log.md"), generateTripleVerifyLog(p));
    writeFileSync(resolve(researchDir, "validation-log.md"), generateValidationLog(p));
  }

  log.push(`  ✅ ${p.id} — ${p.name}`);
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const tierArg = args.find(a => a.startsWith("--tier="));
  const singleId = args.find(a => !a.startsWith("--"));

  const tier = tierArg ? tierArg.replace("--tier=", "") : undefined;

  console.log(`\n${"═".repeat(60)}`);
  console.log(`  Perskill Skill Export${dryRun ? " [DRY RUN]" : ""}`);
  console.log(`${"═".repeat(60)}`);

  let personas: Persona[];
  try {
    personas = loadPersonas();
  } catch (e: any) {
    console.error(`❌ Failed to load personas: ${e.message}`);
    process.exit(1);
  }

  // Filter
  let filtered = personas;
  if (singleId) {
    filtered = personas.filter(p => p.id === singleId);
  } else if (tier) {
    filtered = personas.filter(p => p.promptTier === tier.toUpperCase());
  }

  if (filtered.length === 0) {
    console.error("❌ No personas matched the filter.");
    console.error(`   Loaded: ${personas.length} personas total`);
    if (singleId) console.error(`   Filter: id=${singleId}`);
    if (tier) console.error(`   Filter: tier=${tier}`);
    process.exit(1);
  }

  console.log(`  Total: ${filtered.length} persona${filtered.length !== 1 ? "s" : ""} (${personas.length} loaded)`);
  if (singleId) console.log(`  Filter: id=${singleId}`);
  if (tier) console.log(`  Filter: tier=${tier.toUpperCase()}`);
  console.log("");

  const log: string[] = [];
  for (const p of filtered) {
    await exportPersona(p, { dryRun }, log);
  }

  if (dryRun) {
    console.log("  [Dry run — no files written]\n");
  } else {
    console.log("\n  Files written to:");
  }
  log.forEach(l => console.log(l));

  console.log(`\n${"═".repeat(60)}`);
  console.log(`  Done. ${filtered.length} persona${filtered.length !== 1 ? "s" : ""} processed.`);
  console.log(`${"═".repeat(60)}\n`);
}

main();
