#!/usr/bin/env tsx
/**
 * shi-yongqing-deep.ts
 *
 * 施永青深度研究脚本：
 * 1. 维基百科、百度百科
 * 2. 中原地产官网
 * 3. 第一财经深度报道
 * 4. Forbes / Bloomberg / SCMP 相关报道
 * 5. Firecrawl deep-research 综合分析
 */

try {
  const { readFileSync } = await import("fs");
  const { resolve, dirname } = await import("path");
  const { fileURLToPath } = await import("url");
  const thisFile = fileURLToPath(import.meta.url);
  const envPath = resolve(dirname(thisFile), "../../.env");
  for (const line of readFileSync(envPath, "utf-8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx < 0) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = val;
  }
} catch { /* no .env */ }

const FIRECRAWL_BASE = "https://api.firecrawl.dev/v1";

interface WebResearchResult {
  url: string;
  title: string;
  markdown: string;
  statusCode: number;
  creditsUsed: number;
}

async function scrapePage(
  apiKey: string,
  url: string,
  formats: ("markdown" | "html" | "json" | "extract")[] = ["markdown"]
): Promise<WebResearchResult> {
  const res = await fetch(`${FIRECRAWL_BASE}/scrape`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url,
      formats,
      onlyMainContent: true,
      timeout: 60000,
    }),
  });

  const data = await res.json();

  if (!data.success) {
    return {
      url,
      title: "",
      markdown: "",
      statusCode: data.statusCode || 0,
      creditsUsed: 0,
    };
  }

  return {
    url,
    title: data.data?.metadata?.title || "",
    markdown: data.data?.markdown || "",
    statusCode: data.data?.metadata?.statusCode || 200,
    creditsUsed: data.data?.metadata?.creditsUsed || 0,
  };
}

async function deepResearch(
  apiKey: string,
  topic: string,
  options: { recencyDays?: number; limit?: number } = {}
): Promise<any> {
  const { recencyDays = 365, limit = 20 } = options;

  const res = await fetch(`${FIRECRAWL_BASE}/deep-research`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      topic,
      recencyDays,
      limit,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Firecrawl deep-research error ${res.status}: ${text}`);
  }

  return res.json();
}

async function pollDeepResearch(
  apiKey: string,
  jobId: string,
  maxWaitMs = 240000
): Promise<any> {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    await new Promise((r) => setTimeout(r, 10000));
    const res = await fetch(`${FIRECRAWL_BASE}/deep-research/${jobId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    const data = await res.json();
    if (data.status === "completed") return data;
    if (data.status === "failed") throw new Error("Deep research failed: " + JSON.stringify(data));
    console.log(`  ⏳ Still processing... (${Math.round((Date.now() - start) / 1000)}s)`);
  }
  throw new Error("Timed out waiting for deep research");
}

// ─── 研究目标列表 ──────────────────────────────────────────────────────────────

interface ResearchTarget {
  url: string;
  label: string;
  priority: "high" | "medium" | "low";
  reason: string;
}

const targets: ResearchTarget[] = [
  // 高优先级：官方/百科
  {
    url: "https://zh.wikipedia.org/zh-hans/%E6%96%BD%E6%B0%B8%E9%9D%92",
    label: "维基百科（中文）施永青",
    priority: "high",
    reason: "最完整的中文百科条目，涵盖生平、创业历程、管理理念"
  },
  {
    url: "https://baike.baidu.hk/item/%E6%96%BD%E6%B0%B8%E9%9D%92/0",
    label: "百度百科 施永青",
    priority: "high",
    reason: "中文维基镜像 + 补充细节"
  },
  {
    url: "https://www.yicai.com/news/4744355.html",
    label: "第一财经：施永青人物报道",
    priority: "high",
    reason: '"斗士"施永青——完整人物深度报道'
  },
  {
    url: "https://doc.sina.cn/?id=comos:hefphqk3938817",
    label: "新浪财经专访：施永青不惑",
    priority: "high",
    reason: "施永青亲述管理哲学与人生观"
  },
  {
    url: "https://www.cnpp.cn/focus/234450.html",
    label: "十大品牌网：施永青成就",
    priority: "high",
    reason: "成就汇总 + 行业影响评估"
  },

  // 中优先级：英文百科 + 新闻
  {
    url: "https://en.wikipedia.org/wiki/Shi_Yongqing",
    label: "维基百科（英文）",
    priority: "medium",
    reason: "英文视角的人物介绍"
  },
  {
    url: "https://www.centaline.com.hk",
    label: "中原地产官网",
    priority: "medium",
    reason: "中原集团官方信息"
  },
  {
    url: "https://www.scmp.com/author/shi-yongqing",
    label: "SCMP 施永青专栏/报道",
    priority: "medium",
    reason: "南华早报关于施永青的报道"
  },

  // 低优先级：补充来源
  {
    url: "https://finance.sina.com.cn/roll/2019-04-03/doc-doc-ifrxmuve7493377.shtml",
    label: "新浪财经：施永青管理理念",
    priority: "low",
    reason: "无为而治管理哲学详细报道"
  },
  {
    url: "https://www.am730.com.hk",
    label: "am730 官网",
    priority: "low",
    reason: "施永青创办的免费报纸官网"
  },
];

// ─── 主函数 ──────────────────────────────────────────────────────────────────────

async function main() {
  const apiKey = process.env.VITE_FIRECRAWL_API_KEY;
  if (!apiKey) {
    console.error("❌ VITE_FIRECRAWL_API_KEY 未设置");
    process.exit(1);
  }

  const { writeFileSync, mkdirSync } = await import("fs");
  mkdirSync("scripts/research/data", { recursive: true });
  mkdirSync("scripts/research/output", { recursive: true });

  console.log("🚀 施永青 深度研究开始");
  console.log(`📊 目标数量: ${targets.length}`);
  console.log("");

  const results: any[] = [];
  let totalCredits = 0;

  // ── Phase 1: 按优先级并行抓取 ──────────────────────────────────────────────
  console.log("=== Phase 1: 批量抓取 ===\n");

  const priorityGroups = ["high", "medium", "low"] as const;
  for (const priority of priorityGroups) {
    const group = targets.filter((t) => t.priority === priority);
    if (group.length === 0) continue;

    console.log(`\n[${priority.toUpperCase()} PRIORITY — ${group.length} targets]`);

    for (const target of group) {
      const start = Date.now();
      try {
        const result = await scrapePage(apiKey, target.url);
        const elapsed = Date.now() - start;

        results.push({
          ...result,
          label: target.label,
          priority: target.priority,
          reason: target.reason,
        });

        totalCredits += result.creditsUsed;

        if (result.statusCode === 200) {
          const chars = result.markdown.length;
          const words = result.markdown.split(/\s+/).length;
          console.log(`  ✅ ${result.title || target.url}`);
          console.log(`     ${result.statusCode} | ${chars.toLocaleString()} chars / ~${words.toLocaleString()} words | ${result.creditsUsed} credits | ${elapsed}ms`);
        } else {
          console.log(`  ❌ ${target.label} — HTTP ${result.statusCode}`);
        }
      } catch (e: any) {
        console.log(`  ❌ ${target.label} — 错误: ${e.message}`);
        results.push({
          url: target.url,
          label: target.label,
          priority: target.priority,
          reason: target.reason,
          markdown: "",
          statusCode: 0,
          creditsUsed: 0,
          error: e.message,
        });
      }

      // 避免 API 限流
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  // 保存批量抓取结果
  const timestamp = new Date().toISOString().slice(0, 10);
  writeFileSync(
    `scripts/research/data/shi-yongqing-corporate-research-${timestamp}.json`,
    JSON.stringify(results, null, 2)
  );
  console.log(`\n💾 批量数据已保存至: scripts/research/data/shi-yongqing-corporate-research-${timestamp}.json`);

  // ── Phase 2: Deep Research ──────────────────────────────────────────────────
  console.log("\n=== Phase 2: Firecrawl Deep Research ===\n");

  const topic = `施永青 2022-2026：中原集团最新业绩、施永青管理哲学"无为而治"、三三制利润分配制度、香港房地产市场分析、中原内地扩张策略、施永青慈善基金动态、接班计划（施俊朗）、香港地产代理行业竞争格局（大湾区、一手楼、二手楼）、施永青人生哲学与处世之道、创办am730报业主角色、重要决策案例分析`;

  console.log("📡 启动 deep-research...");
  console.log(`   主题: ${topic.slice(0, 80)}...\n`);

  try {
    const initRes = await deepResearch(apiKey, topic, { recencyDays: 1095, limit: 20 });
    console.log("🆔 Job ID:", initRes.id || initRes.jobId);

    if (initRes.id || initRes.jobId) {
      const jobId = initRes.id || initRes.jobId;
      console.log("  Polling for results (may take 1-3 min)...\n");
      const result = await pollDeepResearch(apiKey, jobId);
      writeFileSync(
        `scripts/research/data/shi-yongqing-deep-research-${timestamp}.json`,
        JSON.stringify(result, null, 2)
      );
      console.log("✅ Deep research 完成!");

      if (result.data?.sources) {
        console.log("\n📚 Sources found:");
        result.data.sources.slice(0, 15).forEach((s: any) => {
          console.log(`  - [${s.type || "web"}] ${s.url || s}`);
        });
      }
      if (result.data?.markdown) {
        console.log(`\n📄 Content preview (first 4000 chars):`);
        console.log(result.data.markdown.slice(0, 4000));
      }
    }
  } catch (e: any) {
    console.error("❌ Deep research 失败:", e.message);
  }

  // ── 汇总报告 ────────────────────────────────────────────────────────────────
  console.log("\n" + "═".repeat(60));
  console.log("📊 抓取结果汇总");
  console.log("═".repeat(60));

  const highPriority = results.filter((r) => r.priority === "high" && r.statusCode === 200);
  const mediumPriority = results.filter((r) => r.priority === "medium" && r.statusCode === 200);
  const lowPriority = results.filter((r) => r.priority === "low" && r.statusCode === 200);

  console.log(`\n高优先级: ${highPriority.length}/${targets.filter((t) => t.priority === "high").length} 成功`);
  console.log(`中优先级: ${mediumPriority.length}/${targets.filter((t) => t.priority === "medium").length} 成功`);
  console.log(`低优先级: ${lowPriority.length}/${targets.filter((t) => t.priority === "low").length} 成功`);
  console.log(`总消耗 credits: ~${totalCredits}`);
  console.log(`\n💾 所有数据保存至 scripts/research/data/`);

  // 打印关键内容预览
  console.log("\n" + "─".repeat(60));
  console.log("🔍 关键内容预览");
  console.log("─".repeat(60));

  for (const r of results) {
    if (r.statusCode === 200 && r.markdown.length > 200) {
      console.log(`\n📄 ${r.label}`);
      const paragraphs = r.markdown.split(/\n\n+/).filter((p: string) => p.trim().length > 80);
      const firstPara = paragraphs[0]?.trim() || "";
      console.log(`   ${firstPara.slice(0, 300)}...`);
    }
  }
}

main().catch(console.error);
