# {Name} — Use-Case Prompts

---
**{N} prompts available.**
**Persona ID:** {ID}

---

## How to Use

Copy any prompt below and paste it into your LLM (ChatGPT, Claude, etc.) to activate this persona for a specific task.

For full immersion, paste the **Full System Prompt** from `SYSTEM_PROMPT.md` into your model's system prompt field instead.

---

## Quick-Use Prompts

{USE_CASE_SECTIONS}

---

## Creating New Use-Case Prompts

The best use-case prompts follow this structure:

```
[Task description]
Context: [What situation does this apply to]
Role: [Who is asking]
Goal: [What outcome do they want]

[Prompt body — framed in the persona's voice and methodology]
```

**Tips:**
- Start with the persona's signature phrase or mental model
- Include a specific scenario or problem type
- Reference their vocabulary patterns and rhetorical style
- End with a clear deliverable format

---

*Generated from `client/src/lib/personas.ts` by `scripts/research/2_distill/skill-file-generator.ts`*
