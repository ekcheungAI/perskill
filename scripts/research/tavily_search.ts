#!/usr/bin/env tsx
/**
 * tavily_search.ts
 *
 * Tavily LLM-optimized search — integrated into Perskill research pipeline.
 *
 * Tavily aggregates up to 20 sources per query, returns AI-scored/synthesized results,
 * and includes a direct extracted-answer field. Best tool for the "discovery" step:
 * finding the right URLs + synthesized context before deep scraping.
 *
 * Usage:
 *   npx tsx scripts/research/tavily_search.ts search "<query>" [--depth basic|advanced] [--max 5]
 *   npx tsx scripts/research/tavily_search.ts extract "<url1>" ["<url2>" ...]
 *   npx tsx scripts/research/tavily_search.ts persona "<name>" [--type CHINESE_BUSINESS] [--depth advanced]
 *
 * Environment:
 *   VITE_TAVILY_API_KEY — set in .env (or uses dev key below)
 */

const TAVILY_KEY = process.env.VITE_TAVILY_API_KEY ?? "";
const BASE = "https://api.tavily.com";

// ─── Persona research query templates ─────────────────────────────────────────

const PERSONA_QUERY_TEMPLATES: Record<string, [string, string][]> = {
  CHINESE_BUSINESS: [
    ["Who & Background", "{name} biography early life education family background"],
    ["Business Philosophy", "{name} management philosophy business strategy investment approach"],
    ["Spoken Word", "{name} interview speech conference talk TED manifesto"],
    ["Authored Works", "{name} book memoir autobiography essay letter annual letter"],
    ["Controversy & Critique", "{name} criticism scandal controversy failure lawsuit investigation"],
    ["Career Decisions", "{name} acquisition investment decision hiring firing stepped down"],
  ],
  HK_ENTREPRENEUR: [
    ["Who & Background", "{name} Hong Kong entrepreneur biography early life Shenzhen"],
    ["Business Empire", "{name} CK Hutchison Holdings Cheung Kong HSL Group investments"],
    ["Spoken Word", "{name} interview speech conference talk"],
    ["Institutional", "{name} annual report shareholder meeting SEC filing H-share"],
    ["Adversarial", "{name} criticism controversy investigation lawsuit"],
    ["Legacy", "{name} succession planning next generation philanthropy"],
  ],
  WESTERN_INVESTOR: [
    ["Philosophy & Strategy", "{name} investment philosophy value investing strategy approach framework"],
    ["Letters to Shareholders", "{name} Berkshire Hathaway shareholder letter annual report"],
    ["Interviews & Speeches", "{name} interview podcast conversation speech"],
    ["Institutional Records", "{name} SEC 13F 10-K annual report Berkshire filing"],
    ["Adversarial", "{name} criticism buybacks overvalued mistakes academic critique"],
    ["Career Milestones", "{name} acquisition decision reasoning"],
  ],
  TWITTER_CRYPTO: [
    ["Trading Methodology", "{name} trading strategy methodology framework how to trade"],
    ["Spoken Word", "{name} interview podcast YouTube conversation speaking"],
    ["Authored", "{name} thread tutorial guide book essay"],
    ["Adversarial", "{name} criticism rug pull scam SEC CFTC investigation fraud"],
    ["Behavioral", "{name} on-chain wallet bought sold token trade transaction"],
    ["Community", "{name} community dex scanner defi yield farming"],
  ],
  FILM_DIRECTOR: [
    ["Philosophy & Style", "{name} directing philosophy visual style auteur methodology"],
    ["Interviews", "{name} interview masterclass Q&A conversation podcast"],
    ["Film Criticism", "{name} film criticism review analysis behind the scenes"],
    ["Biography", "{name} biography early career film education influences Cannes Venice Berlin"],
    ["Controversy", "{name} controversy scandal lawsuit producer conflict box office failure"],
    ["Technique", "{name} cinematography editing shot composition blocking"],
  ],
  HISTORICAL_TRADER: [
    ["Memoir & Biography", "{name} trader speculator memoir autobiography letters biography"],
    ["Trading System", "{name} market strategy trading rules system how I made my fortune"],
    ["Oral History", "{name} interview trading pits tape reading oral history"],
    ["Market Events", "{name} market crash panic cornering market manipulation"],
    ["Adversarial", "{name} lost everything failed bankruptcy scandal SEC CFTC"],
    ["Legacy", "{name} lessons principles Reminiscences Edwin Lefevre Jesse Livermore"],
  ],
};

// ─── API functions ───────────────────────────────────────────────────────────

interface TavilySearchResult {
  answer?: string;
  results: { title: string; url: string; content: string; score: number }[];
  images: string[];
}

interface TavilyExtractResult {
  results: { url: string; raw_content: string }[];
  failed_results: string[];
}

async function tavilySearch(
  query: string,
  opts: { depth?: "basic" | "advanced"; topic?: "general" | "news"; maxResults?: number; includeAnswer?: boolean } = {}
): Promise<TavilySearchResult> {
  const { depth = "basic", topic = "general", maxResults = 5, includeAnswer = true } = opts;
  const res = await fetch(`${BASE}/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: TAVILY_KEY,
      query,
      search_depth: depth,
      topic,
      max_results: maxResults,
      include_answer: includeAnswer,
      include_images: false,
      include_raw_content: false,
    }),
  });
  if (!res.ok) throw new Error(`Tavily search error ${res.status}: ${await res.text()}`);
  return res.json();
}

async function tavilyExtract(urls: string[]): Promise<TavilyExtractResult> {
  const res = await fetch(`${BASE}/extract`, {
    method: "POST",
    headers: { Authorization: `Bearer ${TAVILY_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ urls }),
  });
  if (!res.ok) throw new Error(`Tavily extract error ${res.status}: ${await res.text()}`);
  return res.json();
}

// ─── Persona research ───────────────────────────────────────────────────────

interface PersonaResearchResult {
  persona_name: string;
  persona_type: string;
  depth: string;
  searches_run: number;
  categories: Record<string, { query: string; answer: string; top_sources: { title: string; url: string; score: number }[] }>;
  top_sources: { title: string; url: string; score: number }[];
  synthesized_context: string;
}

async function researchPersona(
  name: string,
  personaType: string,
  depth: "basic" | "advanced" = "basic"
): Promise<PersonaResearchResult> {
  const templates = PERSONA_QUERY_TEMPLATES[personaType] ?? PERSONA_QUERY_TEMPLATES["CHINESE_BUSINESS"];
  const categories: PersonaResearchResult["categories"] = {};
  const allSources: { title: string; url: string; score: number }[] = [];
  const allAnswers: string[] = [];

  console.log(`\n  Tavily research: ${name} (${personaType})\n`);

  for (let i = 0; i < templates.length; i++) {
    const [category, queryTemplate] = templates[i];
    const query = queryTemplate.replace("{name}", name);
    process.stdout.write(`  [${i + 1}/${templates.length}] ${category}... `);
    try {
      const data = await tavilySearch(query, { depth, maxResults: 5 });
      categories[category] = {
        query,
        answer: data.answer ?? "",
        top_sources: data.results.slice(0, 3).map(r => ({ title: r.title, url: r.url, score: r.score })),
      };
      if (data.answer) allAnswers.push(`[${category}] ${data.answer}`);
      allSources.push(...data.results.map(r => ({ title: r.title, url: r.url, score: r.score })));
      console.log(`OK (${data.results.length} results, answer=${Boolean(data.answer)})`);
    } catch (e: any) {
      console.log(`FAILED: ${e.message}`);
      categories[category] = { query, answer: "", top_sources: [] };
    }
  }

  // Deduplicate sources by URL
  const seen = new Set<string>();
  const deduped = allSources.filter(s => {
    if (seen.has(s.url)) return false;
    seen.add(s.url);
    return true;
  });

  return {
    persona_name: name,
    persona_type: personaType,
    depth,
    searches_run: templates.length,
    categories,
    top_sources: deduped.slice(0, 20),
    synthesized_context: allAnswers.join("\n\n"),
  };
}

// ─── Output helpers ──────────────────────────────────────────────────────────

function printSearch(data: TavilySearchResult) {
  console.log(`\n${"=".repeat(60)}\nTAVILY SEARCH RESULTS\n${"=".repeat(60)}`);
  if (data.answer) console.log(`\n[AI Answer]\n${data.answer}\n`);
  for (let i = 0; i < data.results.length; i++) {
    const r = data.results[i];
    console.log(`${i + 1}. ${r.title}`);
    console.log(`   URL: ${r.url}`);
    console.log(`   Score: ${r.score}`);
    if (r.content) console.log(`   Snippet: ${r.content.slice(0, 200)}...`);
    console.log();
  }
}

function printPersonaResearch(data: PersonaResearchResult) {
  console.log(`\n${"=".repeat(60)}\nTAVILY PERSONA RESEARCH: ${data.persona_name}\n${"=".repeat(60)}`);
  console.log(`Type: ${data.persona_type} | Searches: ${data.searches_run} | Depth: ${data.depth}`);
  console.log(`Total unique sources: ${data.top_sources.length}\n`);

  for (const [category, catData] of Object.entries(data.categories)) {
    console.log(`─── ${category} ───`);
    if (catData.answer) {
      console.log(`  Answer: ${catData.answer.slice(0, 300)}${catData.answer.length > 300 ? "..." : ""}`);
    } else {
      console.log("  (no synthesized answer)");
    }
    if (catData.top_sources.length > 0) {
      console.log("  Top sources:");
      for (const s of catData.top_sources) {
        console.log(`    - ${s.title.slice(0, 60)} (score: ${s.score})`);
      }
    }
    console.log();
  }

  console.log(`─── Top 20 Unique Sources ───`);
  for (let i = 0; i < data.top_sources.length; i++) {
    const s = data.top_sources[i];
    console.log(`  ${String(i + 1).padStart(2)}. ${s.title.slice(0, 60)}`);
    console.log(`      ${s.url}`);
  }
}

// ─── CLI ─────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error("Usage:");
    console.error("  npx tsx scripts/research/tavily_search.ts search <query> [--depth basic|advanced] [--max N]");
    console.error("  npx tsx scripts/research/tavily_search.ts extract <url1> [url2...]");
    console.error("  npx tsx scripts/research/tavily_search.ts persona <name> [--type TYPE] [--depth basic|advanced]");
    process.exit(1);
  }

  const mode = args[0];

  if (mode === "search") {
    const query = args[1];
    let depth: "basic" | "advanced" = "basic";
    let maxResults = 5;

    for (let i = 2; i < args.length; i++) {
      if (args[i] === "--depth" && i + 1 < args.length) depth = args[++i] as "basic" | "advanced";
      if (args[i] === "--max" && i + 1 < args.length) maxResults = parseInt(args[++i]);
    }

    const data = await tavilySearch(query, { depth, maxResults });
    printSearch(data);

  } else if (mode === "extract") {
    const urls = args.slice(1);
    const data = await tavilyExtract(urls);
    console.log(`\n${"=".repeat(60)}\nTAVILY EXTRACT RESULTS\n${"=".repeat(60)}`);
    for (const r of data.results) {
      console.log(`\nURL: ${r.url}`);
      console.log(`Content length: ${r.raw_content.length} chars`);
      console.log(`Preview: ${r.raw_content.slice(0, 500)}...`);
    }
    if (data.failed_results.length > 0) console.log(`\nFailed: ${data.failed_results}`);

  } else if (mode === "persona") {
    const name = args[1];
    let depth: "basic" | "advanced" = "basic";
    let ptype = "CHINESE_BUSINESS";

    for (let i = 2; i < args.length; i++) {
      if (args[i] === "--depth" && i + 1 < args.length) depth = args[++i] as "basic" | "advanced";
      if (args[i] === "--type" && i + 1 < args.length) ptype = args[++i];
    }

    const data = await researchPersona(name, ptype, depth);
    printPersonaResearch(data);

    // Save JSON output
    const { writeFileSync, mkdirSync } = await import("fs");
    const { resolve } = await import("path");
    const dateStr = new Date().toISOString().slice(0, 10);
    const slug = name.toLowerCase().replace(/\s+/g, "-");
    const outPath = resolve(__dirname, `../data/tavily-${slug}-${dateStr}.json`);
    mkdirSync(resolve(__dirname, "../data"), { recursive: true });
    writeFileSync(outPath, JSON.stringify(data, null, 2));
    console.log(`\n💾 Saved: ${outPath}`);

  } else {
    console.error(`Unknown mode: ${mode}. Use 'search', 'extract', or 'persona'.`);
    process.exit(1);
  }
}

main().catch(console.error);
