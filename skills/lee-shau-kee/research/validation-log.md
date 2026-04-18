# Validation Harness — Lee Shau-kee 李兆基

> Adapted from `distill_templates/VALIDATION_HARNESS.md`.
> Run this BEFORE shipping any persona skill.

---

## The 3+1 Protocol

### Part A — Three Known-Statement Tests (directional consistency)

Pick three statements Lee Shau-kee made publicly **not quoted verbatim in SKILL.md**.
Hide the ground-truth answer. Compare directions.

| # | Question posed | Lee Shau-kee's real public answer (hidden) | Skill's answer | Direction match? | Notes |
|---|---------------|-------------------------------------------|----------------|:---------------:|------|
| 1 | Should investors use borrowed money in volatile markets? | "Never speculate with borrowed money" (multiple interviews, Forbes 2012) | Low leverage; debt amplifies both gains and losses; use cash and retained earnings | ✅ | Aligns — skill emphasizes conservative capital structure |
| 2 | How should young people build wealth? | Four strategies at Peking University: work hard, delay marriage, make money work, choose career carefully | Four-step wealth framework: hard work first, delay marriage, deploy capital, rotate carefully | ✅ | Aligns — skill mirrors the four principles |
| 3 | How should philanthropists measure impact? | "Using a sprat to catch a herring — through leveraging, a dollar invested could become $10" | Each dollar should generate $10 of social return through training and leverage | ✅ | Aligns — skill applies 以小博大 to philanthropy |

**Threshold:** 2 of 3 must be directional matches. ✅ All 3 pass.

---

### Part B — One Novel-Question Test (calibrated uncertainty)

Pose a question on a subject **where Lee Shau-kee has no public record**.

| Novel question | Skill's answer | Mental model applied? | Uncertainty acknowledged? | Fabrication risk? | Verdict |
|---------------|---------------|:---------------------:|:-----------------------:|:-----------------:|---------|
| How would Lee Shau-kee evaluate a family office allocating 20% to cryptocurrency vs. 20% to regulated Asian utilities? | Cash flow first; 以小博大 rotation principle; crypto lacks cash flow and has regulatory uncertainty; regulated utilities fit the framework. Would likely reject crypto allocation. | ✅ 以小博大 + Cash Flow First | ✅ Acknowledged: Lee has no public record on crypto; this is inferred from first principles | Low — consistent with his documented preferences for proven, cash-flow-generating businesses | Pass |

---

## Ship Gate

- [x] 2 of 3 Part A tests pass
- [x] Part B passes (no fabrication, calibrated uncertainty acknowledged)
- [x] Changelog entry drafted
- [x] Source catalog committed
- [x] Triple verification log committed

---

*Validated: 2026-04-18 | Version 1.0 | 3/3 Part A + Part B Pass*
