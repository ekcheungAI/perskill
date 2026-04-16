# Distill Templates

This directory contains all templates used during the persona distillation workflow.

## File Inventory

| File | Purpose | Used by |
|------|---------|---------|
| `DISTILL_PLAN.md` | Pre-research planning document (kill-switch, credit budget, 6-agent checklist) | `scaffold.ts` |
| `SKILL_TEMPLATE.md` | Target format for `SKILL.md` (11-section structure, ~300 lines) | `scaffold.ts`, `export-all-skills.ts` |
| `TRIPLE_VERIFY.md` | Mental model gating document (3 tests, candidate log, promotion ledger) | `scaffold.ts`, `validation-runner.ts` |
| `VALIDATION_HARNESS.md` | Pre-ship test harness (3 known-statement + 1 novel question) | `scaffold.ts`, `validation-runner.ts` |
| `RESEARCH_README.md` | Template for `skills/{id}/research/README.md` | `skill-file-generator.ts` |
| `SKILL_SYSTEM_PROMPT_TEMPLATE.md` | Template for `SYSTEM_PROMPT.md` (YAML frontmatter + short + full + changelog) | `skill-file-generator.ts` |
| `USE_CASE_TEMPLATE.md` | Template for `USE_CASE_PROMPTS.md` | `skill-file-generator.ts` |
| `README.md` | This file | — |

## SKILL.md 格式标准 (11 sections)

Every persona's `SKILL.md` must contain these 11 sections:

| # | Section | Required | Content |
|---|---------|----------|---------|
| §1 | Role-Play Rules | YES | Character immersion rules, language handling, exit triggers |
| §2 | Answer Workflow | YES | Agentic Protocol — how to classify and respond to questions |
| §3 | Identity Card | YES | First-person narrative: origin, turning point, current state |
| §4 | Core Mental Models | YES | 3–7 models, each with cross-domain evidence + `(N源交叉)` tag |
| §5 | Decision Heuristics | YES | 5–10 one-liners with concrete case examples |
| §6 | Expression DNA | YES | Quantitative fingerprint: vocabulary table, emoji table, rhetorical moves |
| §7 | Timeline | YES | Minimum 3 eras (target 5), behavioral signatures per era |
| §8 | Contradictions | YES | 3–6 documented tensions between stated values and observed behavior |
| §9 | Values & Anti-patterns | YES | Ranked core values + hard lines + targets of scorn |
| §10 | Knowledge Lineage | YES | Influences, traditions, books that shaped them |
| §11 | Honest Boundaries | YES | Research cutoff, what this skill captures well, what it cannot |

## SKILL.md Format标准

All persona skills exported from `personas.ts` must follow the Nuwa-grade format:

### YAML Frontmatter
```yaml
---
name: {id}-perspective
description: |
  {English Name}（{Native Name}）的思维框架与表达方式...
  用途：...
  触发词（中）：...
  Triggers (EN): ...
version: "X.Y"
source: https://github.com/ekcheungAI/perskill
persona_id: {id}
---
```

### Content Standards
- §4 Mental Models: Each entry must have `(N源交叉)` tag, ≥2 domain evidence, application prompt, limitation
- §6 Expression DNA: Must include actual data from `vocabularyPatterns` in `personas.ts`
- §8 Contradictions: Must have 3–6 entries; source citations required
- §11 Honest Boundaries: Must include `research cutoff` date

## File Output Locations

When `export-all-skills.ts` runs, it writes to:
```
skills/{id}/
├── SKILL.md               ← 11-section format (Nuwa-grade)
├── SYSTEM_PROMPT.md       ← YAML frontmatter + short + full + version history
├── USE_CASE_PROMPTS.md    ← one section per use-case prompt
├── PROFILE.md             ← Wikipedia-depth profile (from persona fields)
├── README.md               ← Quick-reference install + file listing
└── research/
    ├── README.md          ← Research archive index
    ├── triple-verify-log.md   ← Blank template (for manual fill)
    └── validation-log.md      ← Blank template (for manual fill)
```

---

*Last updated: 2026-04-16*
