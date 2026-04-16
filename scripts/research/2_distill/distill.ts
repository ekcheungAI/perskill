#!/usr/bin/env tsx
/**
 * distill.ts
 *
 * Distills raw scraped data into structured research files.
 * Reads from:
 *   data/{handle}_tweets.json      → 01-tweet-statistics.md
 *   data/{handle}_web.json         → 02-published-works.md, 03-interview-distillation.md
 *   data/{handle}_deep.json       → 04-adversarial-distillation.md, 05-behavioral-records.md
 *   output/{handle}/               → generates final SKILL.md draft
 *
 * Usage:
 *   npx tsx scripts/research/2_distill/distill.ts warren-buffett
 *   npx tsx scripts/research/2_distill/distill.ts warren-buffett --agent=1
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { resolve } from "path";
import { getScriptDir, resolveProjectRoot } from "./path-utils.js";

const SCRIPT_DIR = getScriptDir();
const ROOT = resolveProjectRoot(SCRIPT_DIR);
const DATA_DIR = resolve(ROOT, "data");
const OUTPUT_DIR = resolve(ROOT, "output");

// ─── Types ─────────────────────────────────────────────────────────────────────

interface RawTweet {
  id: string; text: string; createdAt: string;
  likeCount: number; retweetCount: number; replyCount: number;
  viewCount: number; lang: string; isReply: boolean;
  author: { name: string; userName: string; followers: number; following: number; bio: string; createdAt: string };
}

interface ScraperResult {
  tweets: RawTweet[];
  profile: { name: string; username: string; bio: string; followers: number; following: number; joinedAt: string };
  metadata: { scrapedAt: string; tweetsScraped: number; oldestTweet: string | null; newestTweet: string | null };
}

interface WebPage {
  url: string; title: string; markdown: string; statusCode: number; creditsUsed: number;
}

interface DeepResearchResult {
  id?: string; status?: string; data?: { markdown: string; sources?: { url: string; type: string }[] };
  markdown?: string; sources?: { url: string; type: string }[];
}

// ─── Tweet Statistics Distiller ────────────────────────────────────────────────

function distillTweets(result: ScraperResult): string {
  const tweets = result.tweets;
  const profile = result.profile;
  const meta = result.metadata;

  // Language split
  const enTweets = tweets.filter(t => t.lang === "en" || t.lang === "en-gb");
  const zhTweets = tweets.filter(t => t.lang === "zh" || t.lang === "zh-cn" || t.lang === "zh-tw");

  // Length distribution
  const lengths = tweets.map(t => t.text.length);
  const avgLen = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  const lt50 = tweets.filter(t => t.text.length < 50).length;
  const lt140 = tweets.filter(t => t.text.length >= 50 && t.text.length < 140).length;
  const lt280 = tweets.filter(t => t.text.length >= 140 && t.text.length < 280).length;
  const gt280 = tweets.filter(t => t.text.length >= 280).length;

  // Engagement
  const totalLikes = tweets.reduce((a, t) => a + t.likeCount, 0);
  const totalRTs = tweets.reduce((a, t) => a + t.retweetCount, 0);
  const totalViews = tweets.reduce((a, t) => a + t.viewCount, 0);
  const avgLikes = totalLikes / tweets.length;
  const avgRTs = totalRTs / tweets.length;
  const avgViews = totalViews / tweets.length;

  // Top tweets by likes
  const topTweets = [...tweets].sort((a, b) => b.likeCount - a.likeCount).slice(0, 10);

  // Day of week
  const dow: Record<string, { count: number; totalLikes: number }> = {};
  for (const day of ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]) {
    dow[day] = { count: 0, totalLikes: 0 };
  }
  for (const tweet of tweets) {
    const d = new Date(tweet.createdAt).getDay();
    const dayName = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d];
    dow[dayName].count++;
    dow[dayName].totalLikes += tweet.likeCount;
  }

  // Type distribution
  const replies = tweets.filter(t => t.isReply).length;
  const originals = tweets.filter(t => !t.isReply).length;

  // Emoji frequency
  const emojiCount: Record<string, number> = {};
  const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]/gu;
  for (const tweet of tweets) {
    const emojis = tweet.text.match(emojiRegex) || [];
    for (const e of emojis) emojiCount[e] = (emojiCount[e] || 0) + 1;
  }
  const topEmojis = Object.entries(emojiCount).sort((a, b) => b[1] - a[1]).slice(0, 10);

  // Top EN words (simple stopword filter)
  const enStopwords = new Set(["the", "a", "an", "is", "are", "was", "were", "be", "been", "being", "to", "of", "and", "in", "that", "it", "for", "on", "with", "as", "at", "by", "from", "or", "this", "have", "has", "had", "not", "but", "what", "all", "were", "when", "we", "you", "your", "i", "my", "me", "do", "so", "just", "get", "if", "about", "would", "there", "their", "which", "out", "up", "more", "one", "can", "will", "than", "also", "how", "its", "no", "been", "very", "because", "into", "them", "only", "some", "other", "these", "then", "like", "him", "her", "his", "our", "who", "over", "such", "any", "now", "after", "before", "new", "back", "most", "dont", "know", "want", "make", "go", "see", "think", "time", "really", "good", "great", "right", "way", "first", "need", "here", "even", "still", "say", "said", "take", "year", "years"]);
  const wordCount: Record<string, number> = {};
  for (const tweet of enTweets) {
    const words = tweet.text.toLowerCase().replace(/[^\w\s]/g, " ").split(/\s+/);
    for (const w of words) {
      if (w.length > 3 && !enStopwords.has(w)) {
        wordCount[w] = (wordCount[w] || 0) + 1;
      }
    }
  }
  const topWords = Object.entries(wordCount).sort((a, b) => b[1] - a[1]).slice(0, 30);

  // Top ZH n-grams (2-char minimum)
  const zhCharCount: Record<string, number> = {};
  for (const tweet of zhTweets) {
    const chars = tweet.text.match(/[\u4e00-\u9fff]{2,}/g) || [];
    for (const c of chars) {
      zhCharCount[c] = (zhCharCount[c] || 0) + 1;
    }
  }
  const topZh = Object.entries(zhCharCount).sort((a, b) => b[1] - a[1]).slice(0, 30);

  // Generate markdown
  const topTweetsMd = topTweets.map(t =>
    `| ${t.likeCount.toLocaleString()} likes | ${t.lang} | ${t.text.slice(0, 120).replace(/\|/g, "\\|")} |`
  ).join("\n");

  const emojiMd = topEmojis.map(([emoji, count]) =>
    `| ${emoji} | ${count} |`
  ).join("\n");

  const wordMd = topWords.map(([word, count]) =>
    `| ${word} | ${count} |`
  ).join("\n");

  const zhMd = topZh.map(([phrase, count]) =>
    `| ${phrase} | ${count} |`
  ).join("\n");

  const dowMd = Object.entries(dow).map(([day, data]) =>
    `| ${day} | ${data.count} | ${Math.round(data.totalLikes / data.count)} |`
  ).join("\n");

  return `# Tweet Statistics — ${profile.name}

> **@${profile.username}** | ${meta.tweetsScraped.toLocaleString()} tweets | ${meta.oldestTweet ? new Date(meta.oldestTweet).getFullYear() : "?"}–${meta.newestTweet ? new Date(meta.newestTweet).getFullYear() : "?"} | Scraped: ${meta.scrapedAt}
> **Language split:** ${enTweets.length} EN (${Math.round(enTweets.length / tweets.length * 100)}%) / ${zhTweets.length} ZH (${Math.round(zhTweets.length / tweets.length * 100)}%)

---

## Volume Overview

| Metric | Value |
|--------|------:|
| Total tweets | ${meta.tweetsScraped.toLocaleString()} |
| EN tweets | ${enTweets.length.toLocaleString()} |
| ZH tweets | ${zhTweets.length.toLocaleString()} |
| Followers | ${profile.followers.toLocaleString()} |
| Following | ${profile.following.toLocaleString()} |
| Joined | ${profile.joinedAt} |

---

## Character Length Distribution

| Range | Count | % |
|-------|------:|--:|
| < 50 chars | ${lt50} | ${Math.round(lt50 / tweets.length * 100)}% |
| 50–140 chars | ${lt140} | ${Math.round(lt140 / tweets.length * 100)}% |
| 140–280 chars | ${lt280} | ${Math.round(lt280 / tweets.length * 100)}% |
| > 280 chars | ${gt280} | ${Math.round(gt280 / tweets.length * 100)}% |
| **Average** | | **${Math.round(avgLen)} chars** |

---

## Engagement Stats

| Metric | Value |
|--------|------:|
| Avg likes / tweet | ${Math.round(avgLikes).toLocaleString()} |
| Avg retweets / tweet | ${Math.round(avgRTs).toLocaleString()} |
| Avg views / tweet | ${Math.round(avgViews).toLocaleString()} |
| Total likes | ${totalLikes.toLocaleString()} |
| Total retweets | ${totalRTs.toLocaleString()} |
| Total views | ${totalViews.toLocaleString()} |

---

## Top 10 Tweets by Likes

| Likes | Lang | Text |
|------:|-----:|------|
${topTweetsMd}

---

## Day-of-Week Activity

| Day | Tweets | Avg Likes |
|-----|-------:|----------:|
${dowMd}

---

## Emoji Fingerprint (Top 10)

| Emoji | Count |
|------:|------:|
${emojiMd}

---

## Top EN Vocabulary (stopwords filtered, top 30)

| Word | Count |
|------|------:|
${wordMd}

---

## Top ZH Phrases (2+ char, top 30)

| Phrase | Count |
|--------|------:|
${zhMd}

---

## Post Type Distribution

| Type | Count | % |
|------|------:|--:|
| Original | ${originals} | ${Math.round(originals / tweets.length * 100)}% |
| Reply | ${replies} | ${Math.round(replies / tweets.length * 100)}% |

---

## Bio

> ${profile.bio}

---

*Generated by \`scripts/research/2_distill/distill.ts\` from ${meta.tweetsScraped.toLocaleString()} tweets*
`;
}

// ─── Source Catalog Distiller ─────────────────────────────────────────────────

function distillSourceCatalog(pages: WebPage[]): string {
  const lines: string[] = [
    "# Source Catalog",
    "",
    `> **${pages.length} sources** scraped.`,
    "",
    "| # | Label | URL | Status | Chars |",
    "|--:|-------|-----|--------|------:|",
  ];

  pages.forEach((page, i) => {
    const label = page.title.slice(0, 40);
    const url = page.url.slice(0, 60);
    lines.push(`| ${i + 1} | ${label} | ${url} | ${page.statusCode === 200 ? "✅" : "❌ " + page.statusCode} | ${page.markdown.length.toLocaleString()} |`);
  });

  lines.push("");
  lines.push("## Priority Targets (not scraped)");
  lines.push("");
  lines.push("Add any missing sources here after manual collection.");

  return lines.join("\n");
}

// ─── Main ──────────────────────────────────────────────────────────────────────

interface DistillOptions {
  agent?: string;  // "1" | "2" | "3" | "4" | "5" | "6"
}

function distill(personaId: string, options: DistillOptions = {}): void {
  const { agent } = options;
  const outDir = resolve(OUTPUT_DIR, personaId);
  const dataDir = DATA_DIR;

  mkdirSync(outDir, { recursive: true });

  // Agent 3: Tweet statistics
  if (!agent || agent === "3") {
    const tweetPath = resolve(dataDir, `${personaId}_tweets.json`);
    if (existsSync(tweetPath)) {
      const raw = readFileSync(tweetPath, "utf-8");
      const result: ScraperResult = JSON.parse(raw);
      const stats = distillTweets(result);
      writeFileSync(resolve(outDir, "01-tweet-statistics.md"), stats);
      console.log(`  ✅ 01-tweet-statistics.md (${result.tweets.length} tweets)`);
    } else {
      console.log(`  ⚠️  No tweet data found for "${personaId}" at ${tweetPath}`);
    }
  }

  // Agent 1+2: Web pages
  if (!agent || agent === "1" || agent === "2") {
    const webPath = resolve(dataDir, `${personaId}_web.json`);
    if (existsSync(webPath)) {
      const pages: WebPage[] = JSON.parse(readFileSync(webPath, "utf-8"));
      const catalog = distillSourceCatalog(pages);
      writeFileSync(resolve(outDir, "00-source-catalog.md"), catalog);
      console.log(`  ✅ 00-source-catalog.md (${pages.length} pages)`);
    }
  }

  // Agent 4+5: Deep research
  if (!agent || agent === "4" || agent === "5") {
    const deepPath = resolve(dataDir, `${personaId}_deep.json`);
    if (existsSync(deepPath)) {
      const result: DeepResearchResult = JSON.parse(readFileSync(deepPath, "utf-8"));
      const markdown = result.markdown || result.data?.markdown || "";
      if (markdown.length > 100) {
        writeFileSync(resolve(outDir, "04-deep-research.md"), `# Deep Research — ${personaId}\n\n${markdown}`);
        console.log(`  ✅ 04-deep-research.md (${markdown.length} chars)`);
      }
    }
  }

  console.log(`\n📁 Output: ../output/${personaId}/`);
}

// ─── CLI ─────────────────────────────────────────────────────────────────────

function main() {
  const args = process.argv.slice(2);
  const personaId = args[0];
  const agentArg = args.find(a => a.startsWith("--agent="));

  if (!personaId) {
    console.error("Usage: npx tsx scripts/research/2_distill/distill.ts <persona-id>");
    console.error("  npx tsx scripts/research/2_distill/distill.ts warren-buffett");
    console.error("  npx tsx scripts/research/2_distill/distill.ts warren-buffett --agent=3");
    process.exit(1);
  }

  console.log(`\n🔬 Distilling: ${personaId}`);
  distill(personaId, {
    agent: agentArg ? agentArg.replace("--agent=", "") : undefined,
  });
}

main();
