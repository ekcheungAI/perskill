#!/usr/bin/env tsx
/**
 * skill-file-generator.ts
 *
 * Generates all skill files for a single persona from `personas.ts` data.
 * Output: skills/{id}/{SKILL.md, SYSTEM_PROMPT.md, USE_CASE_PROMPTS.md,
 *          PROFILE.md, README.md, research/README.md, research/triple-verify-log.md,
 *          research/validation-log.md}
 *
 * Usage:
 *   npx tsx scripts/research/2_distill/skill-file-generator.ts <persona-id>
 *   npx tsx scripts/research/2_distill/skill-file-generator.ts elon-musk --dry-run
 */

import { createRequire } from "module";
import { existsSync } from "fs";
import { resolve } from "path";
import { getScriptDir, resolveProjectRoot } from "./path-utils.js";

const SCRIPT_DIR = getScriptDir();
const ROOT = resolveProjectRoot(SCRIPT_DIR);
const require = createRequire(import.meta.url);
const PERSONAS_PATH = resolve(ROOT, "src/lib/personas.ts");

// ─── Load personas ─────────────────────────────────────────────────────────────

interface PersonalityDimension {
  label: string;
  value: number;
  description: string;
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
  strength: string;
  since: string;
  status: string;
}

interface CompetitorProfile {
  name: string;
  relationship: string;
  description: string;
}

interface MentalModel {
  name: string;
  origin: string;
  trigger: string;
  internalMonologue: string;
  output: string;
  confidence: string;
}

interface DecisionEntry {
  year: string;
  situation: string;
  decision: string;
  reasoning: string;
  outcome: string;
  lesson: string;
}

interface FailureCase {
  year: string;
  whatFailed: string;
  whatWentWrong: string;
  lesson: string;
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

interface Persona {
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
  promptTier: string;
  githubUrl?: string;
  lastUpdated: string;
  nextUpdateDue: string;
  dataSourceCount: number;
  personalityTraits: string[];
  personalityDimensions: PersonalityDimension[];
  mbtiType?: string;
  enneagramType?: string;
  keySkills: { name: string; level: number; description: string; category: string }[];
  thinkingFrameworks: ThinkingFramework[];
  decisionMakingStyle: string;
  problemSolvingApproach: string;
  communicationStyle: string;
  vocabularyPatterns: VocabularyPattern[];
  famousQuotes: string[];
  workingStyle: string;
  leadershipStyle: string;
  teamDynamics: string;
  accomplishments: Accomplishment[];
  recentNews: NewsItem[];
  relationships: Relationship[];
  recommendedResources: { title: string; author: string; type: string; relevance: string }[];
  weaknesses: string;
  blindSpots: string[];
  competitors: CompetitorProfile[];
  mentalModels?: MentalModel[];  // nuwa-grade field (newer personas)
  skillChain: { name: string; originStory: string }[];
  decisionJournal: DecisionEntry[];
  failureCases: FailureCase[];
  competitiveWorldview?: string;
  decisionHeuristics?: { name: string; scenario: string; example: string }[];
  values?: { value: string; description: string; priority: number }[];
  antiPatterns?: { behavior: string; reason: string; quote?: string }[];
  internalTensions?: { tension: string; explanation: string; manifestation: string }[];
  honestBoundaries?: { limitation: string; explanation: string; implication: string }[];
  identityCard?: { selfDescription: string; startingPoint: string; coreBelief: string };
  agenticProtocol?: { step1Classification: string; step2Research: string; step3Response: string };
  aiPersonaPrompt: string;
  aiPersonaPromptShort: string;
  promptVersion: string;
  promptChangelog: PromptVersion[];
  useCasePrompts: UseCasePrompt[];
}

// Load all personas
function loadPersonas(): Persona[] {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require(PERSONAS_PATH) as any;
  const arr = mod.personas ?? mod.default ?? mod;
  if (!Array.isArray(arr)) throw new Error("Could not extract personas array from personas.ts");
  return arr as Persona[];
}

function findPersona(id: string): Persona | null {
  const all = loadPersonas();
  return all.find(p => p.id === id) ?? null;
}

// ─── Content generators ───────────────────────────────────────────────────────

function stripTemplateWrapper(content: string): string {
  return content.replace(/^`/, "").replace(/`;?\s*$/, "").trim();
}

function generateSKILL(p: Persona): string {
  const raw = p.aiPersonaPrompt;
  const content = raw.startsWith("`") ? stripTemplateWrapper(raw) : raw;

  const frontmatter = `---
name: ${p.id}-perspective
description: |
  ${p.name}${p.nativeName ? `（${p.nativeName}）` : ""}的思维框架与表达方式。基于 ${p.dataSourceCount} 个数据来源，
  提炼 ${p.mentalModels.length} 个核心心智模型、${p.decisionHeuristics?.length ?? 0} 条决策启发式和完整的表达 DNA。
  用途：作为思维顾问，用 ${p.name} 的视角分析 ${p.categories.join("、")} 问题。
  触发词（中）：「用 ${p.name} 的视角」「如果 ${p.name} 会怎么看」「切换到 ${p.name} 模式」
  Triggers (EN): "Use ${p.name}'s perspective", "What would ${p.name} think?", "Switch to ${p.name} mode"
version: "${p.promptVersion}"
source: https://github.com/ekcheungAI/perskill
persona_id: ${p.id}
---
`;
  return frontmatter + "\n" + content;
}

function generateSYSTEM_PROMPT(p: Persona): string {
  const shortPrompt = p.aiPersonaPromptShort || "You are " + p.name + ". " + p.shortBio;

  const changelogRows = p.promptChangelog
    .map(v => `| ${v.version} | ${v.date} | ${v.changes} |`)
    .join("\n");

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
${frontmatterYaml(p)}${fullContent}
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
3. Activate with any of the trigger phrases listed in the YAML frontmatter

---

*Generated from \`client/src/lib/personas.ts\` by \`scripts/research/2_distill/skill-file-generator.ts\`*
`;
}

function frontmatterYaml(p: Persona): string {
  return `---
name: ${p.id}-perspective
description: |
  ${p.name}${p.nativeName ? `（${p.nativeName}）` : ""}的思维框架与表达方式。基于 ${p.dataSourceCount} 个数据来源，
  提炼 ${p.mentalModels.length} 个核心心智模型、${p.decisionHeuristics?.length ?? 0} 条决策启发式和完整的表达 DNA。
  用途：作为思维顾问，用 ${p.name} 的视角分析 ${p.categories.join("、")} 问题。
  触发词（中）：「用 ${p.name} 的视角」「如果 ${p.name} 会怎么看」「切换到 ${p.name} 模式」
  Triggers (EN): "Use ${p.name}'s perspective", "What would ${p.name} think?", "Switch to ${p.name} mode"
version: "${p.promptVersion}"
---

`;
}

function generateUSE_CASE_PROMPTS(p: Persona): string {
  if (!p.useCasePrompts || p.useCasePrompts.length === 0) {
    return `# ${p.name} — Use-Case Prompts

---
**0 prompts available.**
**Persona ID:** ${p.id}

---

No use-case prompts have been defined for this persona yet.
Add entries to the \`useCasePrompts\` field in \`client/src/lib/personas.ts\` to generate them here.

---

*Generated by \`scripts/research/2_distill/skill-file-generator.ts\`*
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

Copy any prompt below and paste it into your LLM (ChatGPT, Claude, etc.) to activate this persona for a specific task.

For full immersion, paste the **Full System Prompt** from \`SYSTEM_PROMPT.md\` into your model's system prompt field instead.

---

## Quick-Use Prompts

${sections}

---

*Generated from \`client/src/lib/personas.ts\` by \`scripts/research/2_distill/skill-file-generator.ts\`*
`;
}

function generatePROFILE(p: Persona): string {
  const dimensions = p.personalityDimensions
    .map(d => `| ${d.label} | ${d.value}/100 | ${d.description} |`)
    .join("\n");

  const frameworks = p.thinkingFrameworks
    .map(f => `- **${f.name}**: ${f.description}`)
    .join("\n");

  const accomplishments = p.accomplishments
    .map(a => `| ${a.year} | ${a.title} | ${a.description} | ${a.impact} |`)
    .join("\n");

  const relationships = p.relationships
    .map(r => `| [${r.personaId}](https://github.com/ekcheungAI/perskill/tree/main/skills/${r.personaId}) | ${r.type} | ${r.description} | ${r.strength} | ${r.since} | ${r.status} |`)
    .join("\n");

  const news = p.recentNews
    .slice(0, 10)
    .map(n => `| ${n.date} | ${n.headline} | ${n.source} | \`${n.sentiment}\` |`)
    .join("\n");

  const competitors = p.competitors
    .map(c => `- **${c.name}** (${c.relationship}): ${c.description}`)
    .join("\n");

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

${p.blindSpots.map(s => `- ${s}`).join("\n")}

---

*Generated from \`client/src/lib/personas.ts\` by \`scripts/research/2_distill/skill-file-generator.ts\`*
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
| **Rarity** | ${p.rarityOverride || p.promptTier === "UPGRADED" ? "Double Rare" : "Common"} |
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
  const hasResearchData = existsSync(resolve(ROOT, "skills", p.id, "research"));
  const researchStatus = hasResearchData ? "DISTILLED" : "FROM_PERSONA_DATA";

  return `# ${p.name} — Research Archive

> **Research type:** ${p.categories.join(", ")}
> **Compiled:** ${p.lastUpdated}
> **Status:** ${researchStatus}

## What's Inside

||| File | Status |
|||------|--------|
||| \`00-source-catalog.md\` | Not collected |
||| \`01-tweet-statistics.md\` | Not collected |
||| \`02-published-works.md\` | Not collected |
||| \`03-interview-distillation.md\` | Not collected |
||| \`04-adversarial-distillation.md\` | Not collected |
||| \`05-behavioral-records.md\` | Not collected |
||| \`06-timeline.md\` | Not collected |
||| \`triple-verify-log.md\` | Blank (fill before shipping) |
||| \`validation-log.md\` | Blank (fill before shipping) |

## Research Coverage Summary

| Dimension | Count | Notes |
|-----------|------:|-------|
| Mental models | ${p.mentalModels.length} | From \`personas.ts\` |
| Decision heuristics | ${p.decisionHeuristics?.length ?? 0} | From \`personas.ts\` |
| Contradictions | ${p.internalTensions?.length ?? 0} | From \`personas.ts\` |
| Use-case prompts | ${p.useCasePrompts.length} | From \`personas.ts\` |
| Data sources used | ${p.dataSourceCount} | |
| Research cutoff | ${p.lastUpdated} | |

## How to Read This Archive

1. Start with \`SKILL.md\` for the full operating system
2. Review \`PROFILE.md\` for the Wikipedia-depth overview
3. Check \`USE_CASE_PROMPTS.md\` for task-specific prompt templates

## Next Steps

- [ ] Run full research pipeline: \`npx tsx scripts/research/1_collect/pipeline.ts ${p.id} --deep-research --type=${getResearchType(p)}`
- [ ] Fill in \`triple-verify-log.md\` (15–25 candidates → 3–7 Mental Models + 5–10 Heuristics)
- [ ] Fill in \`validation-log.md\` (3 known-statement tests + 1 novel question)
- [ ] Run \`npx tsx scripts/research/3_validate/validation-runner.ts ${p.id}\`
- [ ] Ship when all ship-gate items are checked

---

*Research archive index generated by \`scripts/research/2_distill/skill-file-generator.ts\`*
`;
}

function getResearchType(p: Persona): string {
  if (p.categories.includes("Crypto") || p.categories.includes("Trading")) return "TWITTER_CRYPTO";
  if (p.categories.includes("Finance") || p.categories.includes("Investing")) return "WESTERN_INVESTOR";
  if (p.categories.includes("Tech") || p.categories.includes("Business")) return "CHINESE_BUSINESS";
  return "HK_ENTREPRENEUR";
}

function generateTripleVerifyLog(p: Persona): string {
  const rows = Array.from({ length: 15 }, (_, i) => {
    const model = p.mentalModels[i];
    if (model) {
      return `||| ${i + 1} | ${model.name} | | | ☐ | | ☐ | | ☐ | |`;
    }
    return `||| ${i + 1} | | | | ☐ | | ☐ | | ☐ | |`;
  }).join("\n");

  return `# Triple Verification Log — ${p.name}

> Adapted from \`distill_templates/TRIPLE_VERIFY.md\`.
> Copy this file to \`triple-verify-log.md\` and fill in BEFORE writing SKILL.md §4.

**Rule:** Pass 3/3 → Mental Model. Pass 2/3 → Decision Heuristic. Pass 1/3 → Color. Pass 0/3 → Cut.

---

## The Three Tests

### Test 1 — Cross-Domain Reproduction
Same framework must surface in ≥2 different domains. One domain = coincidence. Two = pattern. Three+ = operating system.

### Test 2 — Generative Power
The model must let you predict their stance on a problem they've never addressed publicly.

### Test 3 — Non-Obvious / Exclusive
Not something any smart operator would think. Must reveal a distinctively theirs perspective.

---

## Candidate Log

||| # | Candidate model | Domain 1 | Domain 2 | T1? | Novel prediction | T2? | Who disagrees? | T3? | Verdict |
|||---|---|- | - |:---:|- |:---:|- |:---:| - |
${rows}

**Target:** 15–25 candidates → 3–7 Mental Models + 5–10 Heuristics.

---

## Promotion Ledger

||| Slot | Name | Candidates # | Pass count |
|||------|------|------------|:-----------:|
||| Meta | | | 3/3 |
||| Model 1 | | | 3/3 |
||| Model 2 | | | 3/3 |
||| Model 3 | | | 3/3 |
||| Heuristic 1 | | | 2/3 |

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

Pick three statements the subject has made publicly **not quoted verbatim in SKILL.md**.
Hide the ground-truth answer. Compare directions.

|| # | Question posed | Subject's real public answer (hidden) | Skill's answer | Direction match? | Notes |
||---|---------------|---------------------------------------|----------------|:---------------:|-------|
|| 1 | | | | ☐ | |
|| 2 | | | | ☐ | |
|| 3 | | | | ☐ | |

**Threshold:** 2 of 3 must be directional matches. Fewer → revisit SKILL.md §4 and §5.

---

### Part B — One Novel-Question Test (calibrated uncertainty)

Pose a question on a subject **where the persona has no public record**.

|| Novel question posed | Skill's answer | Applied which mental model? | Uncertainty acknowledged? | Fabrication risk? | Verdict |
||----------------------|----------------|:-------------------------:|:----------------------:|:-----------------:|---------|
|| | | | ☐ | ☐ | Pass / Fail |

---

## Ship Gate

- [ ] 2 of 3 Part A tests pass
- [ ] Part B passes (no fabrication, calibrated uncertainty)
- [ ] Changelog entry drafted
- [ ] Source catalog committed
- [ ] Triple verification log committed

---

*Fill in for persona: ${p.name} (${p.id})*
`;
}

// ─── Main generator ────────────────────────────────────────────────────────────

interface GenerateOptions {
  dryRun?: boolean;
  personaId?: string;
}

function generateAllFiles(p: Persona, opts: GenerateOptions = {}): void {
  const { dryRun = false } = opts;
  const skillDir = resolve(ROOT, "skills", p.id);
  const researchDir = resolve(skillDir, "research");

  if (!dryRun) {
    mkdirSync(skillDir, { recursive: true });
    mkdirSync(researchDir, { recursive: true });
  }

  const files: { path: string; content: string }[] = [
    { path: resolve(skillDir, "SKILL.md"), content: generateSKILL(p) },
    { path: resolve(skillDir, "SYSTEM_PROMPT.md"), content: generateSYSTEM_PROMPT(p) },
    { path: resolve(skillDir, "USE_CASE_PROMPTS.md"), content: generateUSE_CASE_PROMPTS(p) },
    { path: resolve(skillDir, "PROFILE.md"), content: generatePROFILE(p) },
    { path: resolve(skillDir, "README.md"), content: generateREADME(p) },
    { path: resolve(researchDir, "README.md"), content: generateResearchReadme(p) },
    { path: resolve(researchDir, "triple-verify-log.md"), content: generateTripleVerifyLog(p) },
    { path: resolve(researchDir, "validation-log.md"), content: generateValidationLog(p) },
  ];

  if (dryRun) {
    console.log(`\n[DRY RUN] Would generate ${files.length} files for "${p.name}":`);
    files.forEach(f => console.log(`  - ${f.path.replace(ROOT + "/", "")}`));
    return;
  }

  files.forEach(({ path, content }) => {
    writeFileSync(path, content);
  });

  console.log(`  ✅ SKILL.md`);
  console.log(`  ✅ SYSTEM_PROMPT.md`);
  console.log(`  ✅ USE_CASE_PROMPTS.md`);
  console.log(`  ✅ PROFILE.md`);
  console.log(`  ✅ README.md`);
  console.log(`  ✅ research/README.md`);
  console.log(`  ✅ research/triple-verify-log.md`);
  console.log(`  ✅ research/validation-log.md`);
}

// ─── CLI ─────────────────────────────────────────────────────────────────────

function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const id = args.find(a => !a.startsWith("--"));

  if (!id) {
    console.error("Usage:");
    console.error("  npx tsx scripts/research/2_distill/skill-file-generator.ts <persona-id>");
    console.error("  npx tsx scripts/research/2_distill/skill-file-generator.ts elon-musk --dry-run");
    process.exit(1);
  }

  console.log(`\n🔧 Generating skill files for: ${id}${dryRun ? " [DRY RUN]" : ""}`);

  try {
    const p = findPersona(id);
    if (!p) {
      console.error(`❌ Persona "${id}" not found in personas.ts`);
      process.exit(1);
    }
    generateAllFiles(p, { dryRun });
    console.log(`\n✅ All files generated for "${p.name}"${dryRun ? " (dry run)" : ""}`);
  } catch (e: any) {
    console.error(`❌ Error: ${e.message}`);
    process.exit(1);
  }
}

main();
