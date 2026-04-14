/**
 * research-data.ts
 *
 * Maps persona IDs → raw research data collected by the pipeline.
 * Each entry is a static export of what `scripts/research/pipeline.ts` collected.
 *
 * To add research data for a new persona:
 * 1. Run: npx tsx scripts/research/pipeline.ts {handle}
 * 2. Copy the output from scripts/research/output/{handle}_draft.json
 * 3. Paste it here as a new entry in researchDrafts
 *
 * Supports two research types:
 * - Twitter pipeline: structured tweet analysis (see ResearchDraft interface)
 * - Firecrawl pipeline: deep web research (see WebResearchData interface)
 */

import killaXbtData from "./research/killa-xbt.json";
import liJiaqiData from "./research/li-jiaqi.json";
import liKaShingData from "./research/li-ka-shing.json";
import shiYongqingData from "./research/shi-yongqing.json";

export interface RawAnalysis {
  tweetCount: number;
  followerCount: number;
  topVocabulary: { phrase: string; count: number }[];
  dayOfWeekStats: Record<string, { count: number; avgLikes: number }>;
  topTweets: { text: string; likes: number; date: string }[];
  engagementStats: { avgLikes: number; avgRetweets: number; totalViews: number };
  tweetFrequency: { byMonth: Record<string, number>; avgPerDay: number };
}

export interface ResearchDraft {
  id: string;
  name: string;
  twitterHandle: string;
  title: string;
  accentColor: string;
  lastUpdated: string;
  dataSourceCount: number;
  profile?: { followers: number; bio: string; profileImage: string };
  rawAnalysis: RawAnalysis;
}

export interface WebResearchData {
  id: string;
  name: string;
  title: string;
  accentColor: string;
  lastUpdated: string;
  dataSourceCount: number;
  researchType: "web-deep-research";
  sources: Array<{ url: string; title: string; chars: number }>;
  analysisSummary: string;
  skillFolder: string;
  rawExtractFile: string;
}

export const researchDrafts: Record<string, ResearchDraft | WebResearchData | null> = {
  "killa-xbt": killaXbtData as ResearchDraft,
  "li-jiaqi": liJiaqiData as WebResearchData,
  "li-ka-shing": liKaShingData as WebResearchData,
  "shi-yongqing": shiYongqingData as WebResearchData,
};
