# Persona Research Pipeline

English quick-reference. See [INSTRUCTION.md](./INSTRUCTION.md) for the full Chinese manual.

---

## Directory Structure

```
scripts/research/
├── README.md              ← You are here (quick reference)
├── INSTRUCTION.md         ← Full Chinese manual (workflow, standards)
├── types.ts              ← Shared TypeScript interfaces
│
├── 0_scaffold/           ← Project scaffolding
│   └── scaffold.ts       ← npx tsx 0_scaffold/scaffold.ts <id> --type=TYPE
│
├── 1_collect/            ← Data collection (automated)
│   ├── pipeline.ts       ← Full pipeline: tweets → web → deep research
│   ├── twitter-scraper.ts
│   ├── threads-scraper.ts
│   └── firecrawl-research.ts
│
├── 2_distill/            ← Distillation & export
│   ├── distill.ts            ← Raw data → structured research files
│   ├── distill-from-persona.ts  ← personas.ts → SKILL.md (single persona)
│   ├── skill-file-generator.ts  ← Single persona → all skill files
│   ├── export-all-skills.ts    ← Batch export all 70 personas
│   └── triple-verify-runner.ts ← Auto-fill triple-verify-log.md
│
├── 3_validate/           ← Validation
│   └── validation-runner.ts ← Run validation harness before shipping
│
├── personas-deep-research/   ← Persona-specific deep research scripts
│   ├── warren-buffett-deep.ts
│   ├── li-ka-shing-deep.ts
│   └── shi-yongqing-deep.ts
│
├── distill_templates/       ← All templates
│   ├── DISTILL_PLAN.md
│   ├── SKILL_TEMPLATE.md
│   ├── TRIPLE_VERIFY.md
│   ├── VALIDATION_HARNESS.md
│   ├── RESEARCH_README.md      ← skills/{id}/research/README.md template
│   ├── SKILL_SYSTEM_PROMPT_TEMPLATE.md
│   ├── USE_CASE_TEMPLATE.md
│   └── README.md              ← This directory's index
│
├── data/                    ← Raw scraped JSON (pipeline output)
│   ├── {handle}_tweets.json
│   ├── {handle}_web.json
│   └── {handle}_deep.json
│
└── output/                  ← Structured research files (pipeline output)
    └── {persona-id}/
        ├── PLAN.md
        ├── 00-source-catalog.md
        ├── 01-tweet-statistics.md
        └── ...
```

---

## Standard Workflow

### Path A: Full research pipeline (new persona)

```bash
# 1. Scaffold the project
npx tsx scripts/research/0_scaffold/scaffold.ts <id> --type=TYPE --name="Full Name"
# TYPE: TWITTER_CRYPTO | CHINESE_BUSINESS | HK_ENTREPRENEUR | WESTERN_INVESTOR

# 2. Collect data
npx tsx scripts/research/1_collect/pipeline.ts <handle> --count=500 --deep-research --type=TWITTER_CRYPTO

# 3. Distill raw data into structured files
npx tsx scripts/research/2_distill/distill.ts <persona-id> --agent=3   # tweets only
npx tsx scripts/research/2_distill/distill.ts <persona-id>             # all agents

# 4. Run persona-specific deep research (optional)
npx tsx scripts/research/personas-deep-research/<persona-id>-deep.ts

# 5. Fill templates + triple verification (manual)

# 6. Validate before shipping
npx tsx scripts/research/3_validate/validation-runner.ts <persona-id>
```

### Path B: Export from personas.ts (fastest, no scraping)

```bash
# Single persona
npx tsx scripts/research/2_distill/export-all-skills.ts <persona-id>

# All 70 personas
npx tsx scripts/research/2_distill/export-all-skills.ts

# Only UPGRADED tier
npx tsx scripts/research/2_distill/export-all-skills.ts --tier=UPGRADED

# Preview (no files written)
npx tsx scripts/research/2_distill/export-all-skills.ts --dry-run

# Auto-fill triple-verify-log.md from personas.ts mentalModels[]
npx tsx scripts/research/2_distill/triple-verify-runner.ts <persona-id>
```

---

## Skill File Output Standard

Every persona's `skills/{id}/` directory must contain:

| File | Format |
|------|--------|
| `SKILL.md` | 11-section Nuwa-grade format (see `distill_templates/SKILL_TEMPLATE.md`) |
| `SYSTEM_PROMPT.md` | YAML frontmatter + short prompt + full prompt + changelog |
| `USE_CASE_PROMPTS.md` | One section per use-case prompt |
| `PROFILE.md` | Wikipedia-depth profile from persona fields |
| `README.md` | Quick-reference install instructions |
| `research/README.md` | Research archive index |
| `research/triple-verify-log.md` | Blank (fill before shipping) |
| `research/validation-log.md` | Blank (fill before shipping) |

---

## Reference Format

See `https://github.com/ekcheungAI/perskill/tree/main/skills/justin-sun` for the canonical fully-distilled example (14 mental models, 18 decision heuristics, complete research archive).

---

## Credit Budget

| Tool | Typical cost |
|------|-------------|
| TwitterAPI.io | ~$2–8 / persona |
| Firecrawl scrape | ~$2–4 / persona |
| Firecrawl deep-research | ~$3–6 / persona |
| **Total target** | **$8–20 / persona** |

Over-collecting is the most common mistake. Triple verification (TRIPLE_VERIFY.md) is the antidote, not more sources.

---

*Last updated: 2026-04-16*
