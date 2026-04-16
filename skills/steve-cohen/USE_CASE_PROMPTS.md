# Steve Cohen — Use-Case Prompts

---
**4 prompts available.**
**Persona ID:** steve-cohen

---

## How to Use

Copy any prompt below and paste it into your LLM. For full immersion, paste **SYSTEM_PROMPT.md** into your model's system prompt field.

---

## Quick-Use Prompts

### 1. Edge Audit Workshop
Audit your current trades for genuine information edge vs. opinion.

**Tags:** Information Edge, Research Quality, Portfolio Review

**Prompt:**

```
Run an Edge Audit on my portfolio. Start in ASSESS mode: ask me about my top 3 positions. For each, I need to answer: What do I know that the market doesn't? How did I get this information? How many others likely have it? When will it be fully priced in? DIAGNOSE which positions have genuine edge vs. narrative. Be ruthless—if I can't clearly articulate the edge, tell me I'm trading on opinion, not information.
```

---
### 2. Pod Structure Design
Design a multi-manager pod structure with capital allocation rules and risk limits.

**Tags:** Organizational Design, Capital Allocation, Fund Management

**Prompt:**

```
Help me design a pod structure for a [SIZE] fund covering [SECTORS]. Walk me through: how many pods, sector coverage per pod, team composition, initial capital allocation, quarterly performance triggers for capital reallocation, cross-pod correlation limits, and loss budgets per pod. Challenge my design if pods are too correlated or if incentives don't create genuine competition.
```

---
### 3. Catalyst Calendar Builder
Build a catalyst-driven trading calendar with pre-positioning and execution plans.

**Tags:** Catalyst Trading, Trade Planning, Execution

**Prompt:**

```
Help me build a 30-day catalyst calendar for [SECTOR]. For each upcoming catalyst (earnings, FDA dates, regulatory rulings, index rebalances), I need: expected market reaction, my positioning plan (entry timing, initial size, add triggers), and post-catalyst execution rules (when to take profits, where to set stops). CORRECT me if any position lacks a specific catalyst or if I'm sizing without edge.
```

---
### 4. Risk Decomposition Review
Decompose your returns into alpha, beta, and factor exposure to understand what's actually driving performance.

**Tags:** Risk Management, Performance Attribution, Portfolio Analysis

**Prompt:**

```
Run a risk attribution analysis on my recent performance. Ask me about my returns, sector exposures, and position sizes. Help me decompose: how much was genuine stock selection alpha vs. market beta vs. factor exposure (momentum, value, size)? DIAGNOSE whether I'm actually adding value through stock-picking or just riding market direction. If my alpha is less than 40% of total returns, tell me directly.
```


---
*Generated from `client/src/lib/personas.ts` by `scripts/research/2_distill/export-all-skills.ts`*
