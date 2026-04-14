# Persona Distillation Templates

Standardized scaffolding for turning any public figure into a high-quality Perskill persona. Built on the Nuwa-skill extraction framework and the depth-patterns from `justin-sun-perspective`.

## The four artifacts

| File | Used when | Purpose |
|------|-----------|---------|
| `DISTILL_PLAN.md` | BEFORE spending API credits | 6-agent parallel collection checklist, kill-switch qualification, credit budget, time estimate |
| `TRIPLE_VERIFY.md` | DURING distillation | Gating log that decides Mental Model vs. Heuristic vs. Cut. The single most important quality lever. |
| `SKILL_TEMPLATE.md` | DURING drafting | The 11-section scaffold for the final `SKILL.md`. Bilingual-aware, with mandatory Contradictions section. |
| `VALIDATION_HARNESS.md` | BEFORE shipping | 3 known-statement tests + 1 novel-question test. Catches parroting and fabrication. |

## The core principle

Depth comes from **triangulation discipline**, not source volume. 270 sources triangulated into 14 mental models (Justin Sun) is good work. 270 sources that yield 30 "insights" is slop. The triple verification log is the cure.

## Tool division of labor

- **TwitterAPI.io** → Expression DNA (§6). Free of triangulation rules because it's quantitative fingerprinting.
- **Firecrawl `/scrape`** → authored works, interview transcripts, filings. High-signal per credit.
- **Firecrawl `/deep-research`** → era-windowed biographical sweeps (one run per era, 3–5 eras).
- **Firecrawl `/search`** → adversarial coverage and decision records.

Never scrape tweets with Firecrawl. Never look up filings with TwitterAPI.io. Use the right tool per layer.

## Workflow at a glance

1. Copy `DISTILL_PLAN.md` → `scripts/research/output/{slug}/PLAN.md` and fill in.
2. Pass the pre-flight kill-switch. If any check fails, pick a different subject.
3. Run the 6 collection agents in parallel. Commit raw outputs to `research/`.
4. Copy `TRIPLE_VERIFY.md` → `research/triple-verify-log.md`. List 15–25 candidate patterns. Run all three tests on each.
5. Copy `SKILL_TEMPLATE.md` → `SKILL.md` at the persona's skill folder. Fill in, capping at 3–7 models and 5–10 heuristics.
6. Copy `VALIDATION_HARNESS.md` → `validation-log.md`. Pass 3+1. Iterate on failures.
7. Ship. Schedule re-validation in 3 months.

## Why this structure beats ad-hoc research

Without a template, every persona is a unicorn. Voice drifts, depth is inconsistent, and you can't compare or stack personas. With this template:
- Every persona has the same 11 sections → users learn one reading pattern.
- Every mental model has `(N源交叉)` evidence → users can see receipts.
- Every persona has §8 Contradictions → users get honesty, not hagiography.
- Every persona has §11 Honest Boundaries → the skill knows what it doesn't know.

## References

- [Nuwa skill extraction framework](https://github.com/alchaincyf/nuwa-skill/blob/main/references/extraction-framework.md)
- `/sessions/intelligent-practical-carson/mnt/.claude/skills/justin-sun-perspective/SKILL.md` — canonical worked example
- `/sessions/intelligent-practical-carson/mnt/.claude/skills/justin-sun-perspective/research/01-tweet-statistics.md` — Expression DNA format reference
