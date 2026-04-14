#!/usr/bin/env tsx
/**
 * run-validation.ts
 *
 * Executes the validation harness for a persona skill.
 * Run this BEFORE shipping a persona.
 *
 * Usage:
 *   npx tsx scripts/research/run-validation.ts shi-yongqing
 *   npx tsx scripts/research/run-validation.ts li-ka-shing
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "../..");

// ─── Types ─────────────────────────────────────────────────────────────────────

interface ValidationResult {
  partA: { question: string; answer: string; passed: boolean; notes: string }[];
  partB: { question: string; answer: string; uncertaintyAcknowledged: boolean; fabricationRisk: boolean; passed: boolean };
  overallPass: boolean;
  errors: string[];
}

// ─── Validation runner ───────────────────────────────────────────────────────

function runValidation(id: string): ValidationResult {
  const result: ValidationResult = {
    partA: [],
    partB: { question: "", answer: "", uncertaintyAcknowledged: false, fabricationRisk: false, passed: false },
    overallPass: false,
    errors: [],
  };

  const logPath = resolve(ROOT, "skills", id, "validation-log.md");

  if (!existsSync(logPath)) {
    result.errors.push(`validation-log.md not found at skills/${id}/validation-log.md`);
    return result;
  }

  const content = readFileSync(logPath, "utf-8");

  // Parse Part A results
  const partAMatches = content.matchAll(/\|\s*\d+\s*\|\s*([^|]+?)\s*\|\s*☐/g);
  for (const match of partAMatches) {
    result.partA.push({
      question: match[1]?.trim() || "",
      answer: "",
      passed: false,
      notes: "",
    });
  }

  // Parse Part B result
  const partBLine = content.match(/\|\s*\|\s*☐\s*\|\s*☐\s*\|\s*(Pass|Fail)/);
  if (partBLine) {
    result.partB.passed = partBLine[1] === "Pass";
  }

  // Count Part A passes
  const partAPasses = (content.match(/✅|☐|✓|✗/g) || []).filter(m => m === "✅" || m === "✓").length;
  const partATotal = result.partA.length;

  // Ship gate checks
  const shipGate = [
    content.includes("[x]") || content.includes("[X]"), // Part A passed
    content.includes("Part B"),                           // Part B tested
    content.includes("Changelog"),                       // Changelog entry
    content.includes("source catalog") || content.includes("Source catalog"), // Catalog
    content.includes("triple verification") || content.includes("Triple verification"), // TV log
  ];
  const shipGatePasses = shipGate.filter(Boolean).length;

  // Determine overall pass
  const partAPassCount = partATotal > 0 ? Math.round((partAPasses / partATotal) * 3) : 0;
  result.overallPass = partAPassCount >= 2 && result.partB.passed;

  if (shipGatePasses < 5) {
    result.errors.push(`${5 - shipGatePasses} ship-gate items not checked. Run through all 5 before publishing.`);
  }

  return result;
}

// ─── Markdown report generator ────────────────────────────────────────────────

function generateReport(id: string, result: ValidationResult): string {
  const timestamp = new Date().toISOString().slice(0, 10);
  const passIcon = result.overallPass ? "✅" : "❌";

  const lines: string[] = [];
  lines.push(`# Validation Report — ${id}`);
  lines.push("");
  lines.push(`> Generated: ${timestamp} | **Overall: ${passIcon} ${result.overallPass ? "PASS" : "FAIL"}**`);
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  lines.push(`| Check | Status |`);
  lines.push(`|-------|--------|`);
  lines.push(`| Part A (3 Known Statements) | ${result.partA.filter(r => r.passed).length}/${result.partA.length} passed |`);
  lines.push(`| Part B (1 Novel Question) | ${result.partB.passed ? "✅ PASS" : "❌ FAIL"} |`);
  lines.push(`| Ship Gate | ${result.errors.length === 0 ? "✅ All 5 items checked" : `⚠️ ${result.errors.length} item(s) unchecked`} |`);
  lines.push("");

  if (result.errors.length > 0) {
    lines.push("## Errors");
    lines.push("");
    for (const e of result.errors) {
      lines.push(`- ❌ ${e}`);
    }
    lines.push("");
  }

  lines.push("## Ship Gate Checklist");
  lines.push("");
  lines.push("- [ ] 2 of 3 Part A tests pass (directional match)");
  lines.push("- [ ] Part B passes (no fabrication, calibrated uncertainty)");
  lines.push("- [ ] Changelog entry drafted");
  lines.push("- [ ] Source catalog committed");
  lines.push("- [ ] Triple verification log committed");
  lines.push("");

  lines.push("## Next Steps");
  lines.push("");
  if (result.overallPass) {
    lines.push("1. ✅ All validation checks passed.");
    lines.push("2. Review the skill at `skills/" + id + "/SKILL.md`");
    lines.push("3. Run `npx tsx scripts/export-personas.ts` to publish");
    lines.push("4. Commit to Git and push");
    lines.push("5. Schedule re-validation in 3 months");
  } else {
    lines.push("1. ❌ Fix validation failures before shipping.");
    lines.push("2. Re-run: `npx tsx scripts/research/run-validation.ts " + id + "`");
    lines.push("3. If Part A fails: revisit mental models in SKILL.md §4");
    lines.push("4. If Part B fails: strengthen §11 Honest Boundaries");
  }
  lines.push("");
  lines.push("---");
  lines.push(`*Generated by \`scripts/research/run-validation.ts\` on ${timestamp}*`);

  return lines.join("\n");
}

// ─── CLI ─────────────────────────────────────────────────────────────────────

function main() {
  const id = process.argv[2]?.trim();

  if (!id) {
    console.error("Usage: npx tsx scripts/research/run-validation.ts <persona-id>");
    console.error("  npx tsx scripts/research/run-validation.ts shi-yongqing");
    console.error("  npx tsx scripts/research/run-validation.ts li-ka-shing");
    process.exit(1);
  }

  console.log(`\n🔍 Validating persona: ${id}`);
  console.log("");

  const result = runValidation(id);

  if (result.errors.length > 0) {
    console.error("❌ Validation errors:");
    for (const e of result.errors) console.error(`   - ${e}`);
    console.log("");
  }

  // Print summary
  console.log("═".repeat(50));
  console.log(`  Overall: ${result.overallPass ? "✅ PASS" : "❌ FAIL"}`);
  console.log("═".repeat(50));
  console.log(`  Part A: ${result.partA.filter(r => r.passed).length}/${result.partA.length} known-statement tests passed`);
  console.log(`  Part B: ${result.partB.passed ? "✅ PASS" : "❌ FAIL"} (calibrated uncertainty)`);
  console.log("");

  if (result.overallPass) {
    console.log("✅ All validation checks passed.");
    console.log(`   Next: edit skills/${id}/validation-log.md with test results, then commit.`);
  } else {
    console.log("❌ Validation failed. Fix issues before shipping.");
    console.log(`   Run: npx tsx scripts/research/run-validation.ts ${id} --fix`);
  }
  console.log("");

  // Save report
  const reportPath = resolve(ROOT, "skills", id, "validation-report.md");
  const report = generateReport(id, result);
  writeFileSync(reportPath, report);
  console.log(`📄 Report saved: skills/${id}/validation-report.md`);
}

main();
