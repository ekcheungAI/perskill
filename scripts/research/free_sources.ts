#!/usr/bin/env tsx
/**
 * free_sources.ts
 *
 * Free data sources — integrated into Perskill research pipeline.
 * No API keys required. All sources are publicly accessible.
 *
 * Sources:
 *   hn         — HackerNews via Algolia API (tech community sentiment, trending)
 *   reddit     — Reddit public JSON API (community opinions, real-world use cases)
 *   arxiv      — arXiv preprint API (cutting-edge academic papers, no paywall)
 *   wikipedia  — Wikipedia REST API (factual background, entity definitions)
 *   openalex   — OpenAlex API (academic citation graph, 474M+ scholarly works)
 *
 * Usage:
 *   npx tsx scripts/research/free_sources.ts hn "<query>" [--limit 5]
 *   npx tsx scripts/research/free_sources.ts reddit "<query>" [--limit 5]
 *   npx tsx scripts/research/free_sources.ts arxiv "<query>" [--limit 5]
 *   npx tsx scripts/research/free_sources.ts wikipedia "<topic>"
 *   npx tsx scripts/research/free_sources.ts openalex "<query>" [--limit 5]
 *   npx tsx scripts/research/free_sources.ts all "<query>"       # All sources in parallel
 *   npx tsx scripts/research/free_sources.ts persona "<name>"  # Full persona research
 *
 * These are used as a CROSS-VALIDATION layer in the pipeline:
 *   - HackerNews: what tech community says about the persona
 *   - Reddit: broader public opinion and community discussion
 *   - Wikipedia: factual biography grounding
 *   - arXiv: academic papers on their methodology (e.g., "Buffett" in q-fin)
 *   - OpenAlex: citation graphs showing intellectual influence
 */

const HEADERS = { "User-Agent": "PerskillResearch/1.0 (research@perskill.io)" };

// ─── HackerNews ───────────────────────────────────────────────────────────────

interface HNResult { source: string; total: number; results: any[]; }

async function searchHN(query: string, limit = 5): Promise<HNResult> {
  const r = await fetch(
    `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(query)}&tags=story&hitsPerPage=${limit}`,
    { headers: HEADERS }
  );
  if (!r.ok) throw new Error(`HN error ${r.status}`);
  const data = await r.json();
  return {
    source: "HackerNews",
    total: data.nbHits ?? 0,
    results: (data.hits ?? []).map((h: any) => ({
      title: h.title,
      url: h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
      hn_url: `https://news.ycombinator.com/item?id=${h.objectID}`,
      points: h.points ?? 0,
      comments: h.num_comments ?? 0,
      date: (h.created_at ?? "").slice(0, 10),
      author: h.author ?? "",
    })),
  };
}

// ─── Reddit ────────────────────────────────────────────────────────────────────

async function searchReddit(query: string, limit = 5): Promise<HNResult> {
  const r = await fetch(
    `https://www.reddit.com/search.json?q=${encodeURIComponent(query)}&sort=top&limit=${limit}&t=year`,
    { headers: HEADERS }
  );
  if (!r.ok) throw new Error(`Reddit error ${r.status}`);
  const data = await r.json();
  return {
    source: "Reddit",
    total: data.data?.children?.length ?? 0,
    results: (data.data?.children ?? []).map((c: any) => {
      const p = c.data;
      return {
        title: p.title,
        url: `https://reddit.com${p.permalink ?? ""}`,
        subreddit: p.subreddit ?? "",
        score: p.score ?? 0,
        comments: p.num_comments ?? 0,
        selftext_preview: (p.selftext ?? "").slice(0, 200),
      };
    }),
  };
}

// ─── arXiv ────────────────────────────────────────────────────────────────────

async function searchArxiv(query: string, limit = 5, category?: string): Promise<HNResult> {
  let searchQuery = query;
  if (category) searchQuery = `cat:${category} AND (${query})`;
  const q = `search_query=${encodeURIComponent(searchQuery)}&max_results=${limit}&sortBy=submittedDate&sortOrder=descending`;
  const r = await fetch(`https://export.arxiv.org/api/query?${q}`, { headers: HEADERS });
  if (!r.ok) throw new Error(`arXiv error ${r.status}`);
  const text = await r.text();

  // Parse XML response (Node.js has no DOMParser — use regex)
  const results: { title: string; abstract: string; published: string; url: string; authors: string[] }[] = [];
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/gi;
  let match;
  while ((match = entryRegex.exec(text)) !== null && results.length < limit) {
    const entry = match[1];
    const title = (entry.match(/<title>([\s\S]*?)<\/title>/i)?.[1] ?? "").replace(/\n/g, " ").trim();
    const summary = (entry.match(/<summary>([\s\S]*?)<\/summary>/i)?.[1] ?? "").replace(/\n/g, " ").trim();
    const published = (entry.match(/<published>([\s\S]*?)<\/published>/i)?.[1] ?? "").slice(0, 10);
    const id = (entry.match(/<id>([\s\S]*?)<\/id>/i)?.[1] ?? "").trim();
    const authorRegex = /<author>[\s\S]*?<name>([\s\S]*?)<\/name>[\s\S]*?<\/author>/gi;
    const authors: string[] = [];
    let authorMatch;
    while ((authorMatch = authorRegex.exec(entry)) !== null && authors.length < 3) {
      authors.push(authorMatch[1].trim());
    }
    results.push({ title, abstract: summary.slice(0, 300), published, url: id, authors });
  }

  return { source: "arXiv", total: results.length, results };
}

// ─── Wikipedia ─────────────────────────────────────────────────────────────────

async function getWikipedia(topic: string): Promise<any> {
  const slug = topic.replace(/ /g, "_");
  const r = await fetch(
    `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(slug)}`,
    { headers: HEADERS }
  );
  if (r.status === 404) {
    const r2 = await fetch(
      `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(topic)}&limit=3&format=json`,
      { headers: HEADERS }
    );
    const suggestions = await r2.json();
    return { source: "Wikipedia", error: "Page not found", suggestions: suggestions[1] ?? [] };
  }
  if (!r.ok) throw new Error(`Wikipedia error ${r.status}`);
  const data = await r.json();
  return {
    source: "Wikipedia",
    title: data.title,
    description: data.description,
    extract: data.extract ?? "",
    url: data.content_urls?.desktop?.page ?? "",
    thumbnail: data.thumbnail?.source ?? "",
  };
}

// ─── OpenAlex ─────────────────────────────────────────────────────────────────

async function searchOpenAlex(query: string, limit = 5, yearFrom?: number): Promise<HNResult> {
  const params = new URLSearchParams({
    search: query,
    "per-page": String(limit),
    select: "title,publication_year,cited_by_count,open_access,primary_location,authorships",
    sort: "cited_by_count:desc",
    mailto: "research@perskill.io",
  });
  if (yearFrom) params.set("filter", `publication_year:>${yearFrom}`);

  const r = await fetch(`https://api.openalex.org/works?${params}`, { headers: HEADERS });
  if (!r.ok) throw new Error(`OpenAlex error ${r.status}`);
  const data = await r.json();
  return {
    source: "OpenAlex",
    total: data.meta?.count ?? 0,
    results: (data.results ?? []).map((w: any) => {
      const loc = w.primary_location ?? {};
      const source = (loc.source ?? {}).display_name ?? "";
      const authors = (w.authorships ?? []).slice(0, 3).map((a: any) => a.author?.display_name ?? "");
      return {
        title: w.title ?? "",
        year: w.publication_year,
        citations: w.cited_by_count ?? 0,
        open_access: w.open_access?.is_oa ?? false,
        source,
        authors,
      };
    }),
  };
}

// ─── Persona research: all sources in parallel ────────────────────────────────

async function researchPersonaAll(name: string): Promise<any> {
  console.log(`\n🔍 Running all free sources for: ${name}\n`);

  const [hn, reddit, arxiv, arxivFin, wiki, openalex] = await Promise.allSettled([
    searchHN(name, 5),
    searchReddit(name, 5),
    searchArxiv(name, 5),
    searchArxiv(name, 3, "q-fin.GN"),
    getWikipedia(name),
    searchOpenAlex(name, 5),
  ]);

  const sources: any = {};
  for (const [key, result] of [
    ["hackernews", hn], ["reddit", reddit],
    ["arxiv_general", arxiv], ["arxiv_finance", arxivFin],
    ["wikipedia", wiki], ["openalex", openalex],
  ] as [string, PromiseSettledResult<any>][]) {
    if (result.status === "fulfilled") {
      sources[key] = result.value;
    } else {
      sources[key] = { source: key, error: result.reason?.message ?? "Failed" };
    }
  }

  return { persona_name: name, searched_at: new Date().toISOString(), sources };
}

// ─── Print helpers ────────────────────────────────────────────────────────────

function printResults(data: any) {
  const source = data.source ?? "Unknown";
  console.log(`\n${"=".repeat(60)}\nSOURCE: ${source}\n${"=".repeat(60)}`);
  if (data.total != null) console.log(`Total available: ${data.total.toLocaleString()}`);
  if (data.error) { console.log(`  ERROR: ${data.error}`); return; }

  const keys = ["title", "url", "hn_url", "subreddit", "score", "points", "comments", "date", "published", "year", "citations", "authors", "abstract", "extract", "selftext_preview"];
  for (let i = 0; i < (data.results ?? []).length; i++) {
    const r = data.results[i];
    const title = r.title || r.description || "N/A";
    console.log(`\n${i + 1}. ${title}`);
    for (const k of keys) {
      const val = r[k];
      if (val != null && val !== "") {
        const display = Array.isArray(val) ? val.join(", ") : String(val);
        console.log(`   ${k}: ${display.slice(0, 150)}`);
      }
    }
  }

  // Wikipedia special
  if (source === "Wikipedia" && data.extract) {
    console.log(`\n  Extract: ${data.extract.slice(0, 300)}...`);
    if (data.url) console.log(`  URL: ${data.url}`);
  }
}

// ─── CLI ─────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error("Usage:");
    console.error("  npx tsx scripts/research/free_sources.ts hn <query> [--limit N]");
    console.error("  npx tsx scripts/research/free_sources.ts reddit <query> [--limit N]");
    console.error("  npx tsx scripts/research/free_sources.ts arxiv <query> [--limit N] [--category X]");
    console.error("  npx tsx scripts/research/free_sources.ts wikipedia <topic>");
    console.error("  npx tsx scripts/research/free_sources.ts openalex <query> [--limit N] [--year N]");
    console.error("  npx tsx scripts/research/free_sources.ts all <query>       # All sources in parallel");
    console.error("  npx tsx scripts/research/free_sources.ts persona <name>    # Full persona research");
    process.exit(1);
  }

  const [source, query, ...rest] = args;
  const limitArg = rest.indexOf("--limit");
  const limit = limitArg >= 0 ? parseInt(rest[limitArg + 1] ?? "5") : 5;
  const categoryArg = rest.indexOf("--category");
  const category = categoryArg >= 0 ? rest[categoryArg + 1] : undefined;
  const yearArg = rest.indexOf("--year");
  const year = yearArg >= 0 ? parseInt(rest[yearArg + 1] ?? "2020") : undefined;

  if (source === "all") {
    const allSources = await Promise.allSettled([
      searchHN(query, 5), searchReddit(query, 5), searchArxiv(query, 5),
      getWikipedia(query), searchOpenAlex(query, 5),
    ]);
    const names = ["HackerNews", "Reddit", "arXiv", "Wikipedia", "OpenAlex"];
    for (let i = 0; i < allSources.length; i++) {
      if (allSources[i].status === "fulfilled") printResults(allSources[i].value);
      else console.log(`\n${"=".repeat(60)}\nSOURCE: ${names[i]}\n${"=".repeat(60)}\n  ERROR: ${allSources[i].reason?.message}`);
    }
    return;
  }

  if (source === "persona") {
    const data = await researchPersonaAll(query);
    const { writeFileSync, mkdirSync } = await import("fs");
    const { resolve } = await import("path");
    const dateStr = new Date().toISOString().slice(0, 10);
    const slug = query.toLowerCase().replace(/\s+/g, "-");
    const outPath = resolve(__dirname, `../data/free-sources-${slug}-${dateStr}.json`);
    mkdirSync(resolve(__dirname, "../data"), { recursive: true });
    writeFileSync(outPath, JSON.stringify(data, null, 2));

    console.log(`\n${"=".repeat(60)}\nFREE SOURCES — PERSONA RESEARCH: ${query}\n${"=".repeat(60)}`);
    console.log(`\n💾 Saved: ${outPath}\n`);
    for (const srcData of Object.values(data.sources) as any[]) {
      printResults(srcData);
    }
    return;
  }

  let data: any;
  switch (source) {
    case "hn": data = await searchHN(query, limit); break;
    case "reddit": data = await searchReddit(query, limit); break;
    case "arxiv": data = await searchArxiv(query, limit, category); break;
    case "wikipedia": data = await getWikipedia(query); break;
    case "openalex": data = await searchOpenAlex(query, limit, year); break;
    default:
      console.error(`Unknown source: ${source}`);
      process.exit(1);
  }
  printResults(data);
}

main().catch(console.error);
