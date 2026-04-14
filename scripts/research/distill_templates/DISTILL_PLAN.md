# Distillation Plan — {Persona Name}

> The 6-layer parallel-collection protocol. Copy this file to `scripts/research/output/{slug}/PLAN.md` and fill it in BEFORE spending any API credits.

---

## Pre-flight qualification (kill-switch)

Answer these honestly. If any is "no," stop and pick a different subject.

- [ ] **Book-length or 60+ min adversarial source exists?** (If no, skill will be hagiography. Cut.)
- [ ] **≥2,000 public utterances across tweets / posts / interviews?** (If no, Expression DNA is noise.)
- [ ] **At least one documented contradiction between stated values and behavior?** (If no, persona is boring or under-researched.)
- [ ] **Subject is relevant to Perskill's target audience (AI builders / operators / vibe coders)?**
- [ ] **Estimated 15–25 hours of reading time available?** (This is the real constraint, not API spend.)

---

## Credit budget (target per persona)

| Tool | Typical usage | Cost estimate |
|------|---------------|---------------|
| TwitterAPI.io | 500–20,000 tweets per handle × 1–3 handles | ~$2–8 |
| Firecrawl `/scrape` | 40–80 long-form URLs | ~$2–4 |
| Firecrawl `/deep-research` | 5 runs (one per era) | ~$3–6 |
| Firecrawl `/search` | 10–20 queries for adversarial + filings | ~$1–2 |
| **Total budget target** | | **$8–20 per persona** |

> If spend blows past $25, you're over-collecting. Triangulation discipline (TRIPLE_VERIFY.md) is the cure, not more sources.

---

## The 6 Collection Agents (run in parallel)

Each agent produces a research file in `research/`. Agents are independent — spin them up as parallel sub-tasks.

### Agent 1 — Published Works
**Goal:** Capture long-form, intentionally authored output. This is where mental models surface most clearly.

- Autobiography / memoir / book(s) — purchase, then extract key chapters
- Essays, blog posts, Substack, personal website
- Paid courses, audio lectures, YouTube long-form
- Conference keynotes (full transcripts, not clips)

**Tools:** Firecrawl `/scrape` for web-hosted. Manual for books (excerpts only, under fair-use lengths).

**Output:** `research/02-published-works.md` — per work: title, length, date, 10–20 key passages as blockquotes with page/timestamp citations.

---

### Agent 2 — Interviews & Podcasts
**Goal:** Unscripted long-form. Contradictions surface here more than in authored work.

- Target: **5–10 interviews over 45 minutes**
- Mix: ≥50% adversarial / ≥50% friendly
- Prioritize interviews from different eras (see Agent 6)

**Tools:** Firecrawl `/scrape` on transcript sites (Podscribe, Rev, show websites). If no transcript, use Whisper locally on audio — do NOT burn Firecrawl credits fetching audio.

**Output:** `research/03-interview-distillation.md` — per interview: source, date, interviewer stance (friendly/neutral/hostile), length, 5–15 key exchanges as Q/A blockquotes.

---

### Agent 3 — Social Media (Expression DNA)
**Goal:** The numerical fingerprint. This is what separates a caricature from a real voice.

- Scrape ALL handles the subject operates (EN + native language if bilingual)
- Minimum 500 tweets per handle, target 2,000+
- Include: full text, date, engagement (likes/RTs/replies), media attachments, reply/quote/original flag

**Tools:** `scripts/research/twitter-scraper.ts` (TwitterAPI.io). **Never use Firecrawl for tweets** — wrong tool, wastes credits.

**Analysis to run:**
- Volume timeline by year / month / day-of-week
- Length distribution (%<50, 50–140, 140–280, >280 chars)
- Top-50 content vocabulary (excluding stopwords + own brand names)
- Emoji frequency table
- Reply / quote / original ratio by year
- Top-20 tweets by engagement
- Follower/engagement deltas before vs. after major events

**Output:** `research/01-tweet-statistics.md` — tables + short interpretation paragraphs. See Justin Sun's `01-tweet-statistics.md` as the reference format.

---

### Agent 4 — Critical / Adversarial Coverage
**Goal:** Force §8 Contradictions to be grounded in the strongest possible counter-case.

- Investigative journalism (The Verge, WSJ, FT, local equivalent)
- Academic critiques
- Known critics / enemies on social media (capture their greatest hits)
- Short-seller reports if public figure is in markets
- Wikipedia "Controversies" section as a starting index

**Tools:** Firecrawl `/search` with hostile query patterns: `"{name}" scandal`, `"{name}" investigation`, `"{name}" lawsuit`, `"{name}" criticism`. Then `/scrape` the top hits.

**Output:** `research/04-adversarial-distillation.md` — per source: claim, evidence presented, subject's public response (if any), verdict on claim strength.

---

### Agent 5 — Decision Records (behavioral proof)
**Goal:** What they actually DID, stripped of narrative. Ground truth for §8 Contradictions.

- Court filings, SEC filings, regulatory letters
- Company registrations, board seats, public investments
- On-chain records (if crypto-adjacent)
- Timing of launches, exits, departures
- Hiring / firing patterns if reported

**Tools:** Firecrawl `/scrape` on EDGAR, CourtListener, Crunchbase, company registries. `/search` for news announcements of specific deals.

**Output:** `research/05-behavioral-record.md` — chronological table: date, action, evidence (link to primary source), significance.

---

### Agent 6 — Biographical Timeline
**Goal:** Era boundaries for §7 Timeline. You need ≥3 eras, ideally 5, to show evolution.

**Tools:** Firecrawl `/deep-research` with date-windowed queries, one run per era:
- Era 1 (pre-career): `topic="{name} early life education"`, `recencyDays=` large window ending pre-career
- Era 2 (emergence): first major role, 5–10 years
- Era 3 (scaling): period of rapid growth
- Era 4 (mature): current-style operation
- Era 5 (latest): last 12–18 months

Also scrape Wikipedia + subject's own bio pages as scaffold.

**Output:** `research/06-timeline.md` — era-by-era table with defining event, role, behavioral signature, primary sources per era.

---

## Parallel execution checklist

Track agent completion. Don't start distillation until all are green.

- [ ] Agent 1 (Published works) — {N} works captured
- [ ] Agent 2 (Interviews) — {N} long-form transcripts
- [ ] Agent 3 (Social DNA) — {N} tweets across {N} handles
- [ ] Agent 4 (Adversarial) — {N} hostile sources
- [ ] Agent 5 (Behavioral) — {N} filings / records
- [ ] Agent 6 (Timeline) — {N} eras mapped

---

## Distillation sequence (after collection)

1. **Skim all 6 research files** — do not take notes yet. Build intuition.
2. **List 15–25 candidate patterns** in `TRIPLE_VERIFY.md`.
3. **Run triple verification** on every candidate. Cut ruthlessly.
4. **Write SKILL.md §4 (Mental Models)** — 3–7 only, each with `(N源交叉)` tag.
5. **Write §5 (Heuristics)** — demoted candidates go here, max 10.
6. **Write §6 (Expression DNA)** — copy numbers directly from `01-tweet-statistics.md`.
7. **Write §8 (Contradictions)** — must have 3–6, sourced from Agent 4 + Agent 5.
8. **Write §7 (Timeline)** — map eras with behavioral shifts.
9. **Fill remaining sections** (§1, §2, §3, §9, §10, §11).
10. **Run `VALIDATION_HARNESS.md`** — 3 known statements + 1 novel question.
11. **Iterate** on any failures, then ship.

---

## Estimated time budget

| Stage | Hours |
|-------|------:|
| Pre-flight + plan | 1 |
| 6-agent collection (parallel) | 4–6 |
| Reading + skim | 6–10 |
| Triple verification | 2–3 |
| SKILL.md drafting | 3–5 |
| Validation + iteration | 1–2 |
| **Total per persona** | **17–27 hrs** |

Plan one persona per week at sustainable pace. Two per week is burnout territory.
