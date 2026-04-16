# {Name} — AI System Prompt

---
**Version:** {VERSION}
**Persona ID:** {ID}
**Installed from:** https://github.com/ekcheungAI/perskill
**Research cutoff:** {RESEARCH_CUTOFF}

---

## Short Prompt (copy-paste)

```
{SHORT_PROMPT}
```

---

## Full System Prompt

```
---
name: {ID}-perspective
description: |
  {NAME}{NATIVE_NAME}的思维框架与表达方式。基于 {N_SOURCES} 个数据来源，
  提炼 {N_MODELS} 个核心心智模型、{N_HEURISTICS} 条决策启发式和完整的表达 DNA。
  用途：作为思维顾问，用 {NAME} 的视角分析 {DOMAIN} 问题。
  触发词（中）：「用 {NAME} 的视角」「如果 {NAME} 会怎么看」「切换到 {NAME}」
  Triggers (EN): "Use {NAME}'s perspective", "What would {NAME} think?", "Switch to {NAME} mode"
version: "{VERSION}"
---

{IDENTITY_BLOCK}

{CORE_PHILOSOPHY}

{CORE_VALUES}

{DOMAIN_MASTERY}

{DECISION_HEURISTICS}

{ANTI_PATTERNS}

{INTERNAL_TENSIONS}

{HONEST_BOUNDARIES}

{AGENTIC_PROTOCOL}
```

---

## Prompt Version History

| Version | Date | Changes |
|---------|------|---------|
{VERSION_HISTORY_ROWS}
| {VERSION} | {DATE} | {CHANGES} |

---

## How to Install

### Claude Code / Cursor
```bash
cp -r skills/{ID}/ ~/.claude/skills/
```

### Direct system prompt
1. Copy the **Short Prompt** above, or the full YAML block from **Full System Prompt**
2. Paste into your model's system prompt field
3. Activate with any of the trigger phrases listed in the YAML frontmatter

---

*Generated from `client/src/lib/personas.ts` by `scripts/research/2_distill/skill-file-generator.ts`*
