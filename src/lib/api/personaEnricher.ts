/**
 * Persona Data Enricher
 * Orchestrates Twitter + Firecrawl APIs to enhance persona data
 * Based on Nuwa methodology: 6-dimensional research + triple-verification synthesis
 */

import type { Persona } from '../personas';
import {
  getUserTweets,
  getUserProfile,
  analyzeVocabPatterns,
  analyzeExpressionDNA,
  buildExpressionDNAString,
  buildChineseExpressionRules,
  PERSONA_TWITTER_MAP,
} from './twitter';
import {
  searchWeb,
  scrapePage,
  deepResearch,
  getRecentNewsForPersona,
  researchPersona,
  researchDecisionHeuristics,
  researchIntellectualLineage,
  researchMentalModels,
  NewsItem,
} from './firecrawl';
import { personas } from '../personas';
import type {
  ThinkingFramework,
  VocabularyPattern,
  Relationship,
  BookOrResource,
  CompetitorProfile,
  MentalModel,
  SkillChainEntry,
  DecisionEntry,
  FailureCase,
  CompetitiveWorldview,
  UseCasePrompt,
  PromptVersion,
  DecisionHeuristic,
  HonestBoundary,
} from '../personas';

export interface EnrichmentResult {
  success: boolean;
  personaId: string;
  fieldsUpdated: string[];
  twitterData?: {
    tweetsLoaded: number;
    vocabPatternsFound: number;
  };
  firecrawlData?: {
    newsItemsFound: number;
    researchCompleted: boolean;
  };
  error?: string;
}

/**
 * Main enrichment orchestrator — run this per persona
 * Returns which fields were updated
 */
export async function enrichPersona(personaId: string): Promise<EnrichmentResult> {
  const persona = personas.find((p) => p.id === personaId);
  if (!persona) {
    return { success: false, personaId, fieldsUpdated: [], error: 'Persona not found' };
  }

  const fieldsUpdated: string[] = [];
  const twitterUsername = PERSONA_TWITTER_MAP[personaId];

  // ── Step 1: Twitter data (if available) ─────────────────────────────────────
  let vocabPatterns: VocabularyPattern[] = [];
  let tweetsLoaded = 0;

  if (twitterUsername) {
    try {
      const tweets = await getUserTweets(twitterUsername, 100);
      if (tweets.length > 0) {
        tweetsLoaded = tweets.length;
        vocabPatterns = analyzeVocabPatterns(tweets);
        // If persona already has vocabularyPatterns, merge (add new unique ones)
        if (persona.vocabularyPatterns && persona.vocabularyPatterns.length > 0) {
          const existingPhrases = new Set(persona.vocabularyPatterns.map((p) => p.phrase));
          const newPatterns = vocabPatterns.filter((p) => !existingPhrases.has(p.phrase));
          persona.vocabularyPatterns = [...persona.vocabularyPatterns, ...newPatterns];
        } else {
          persona.vocabularyPatterns = vocabPatterns;
        }
        fieldsUpdated.push('vocabularyPatterns');
      }
    } catch (e) {
      console.warn(`[Enricher] Twitter enrichment failed for ${personaId}:`, e);
    }
  }

  // ── Step 2: Recent news via Firecrawl ───────────────────────────────────────
  try {
    const news = await getRecentNewsForPersona(persona.name, 10);
    if (news.length > 0) {
      // Merge with existing news, avoiding duplicates by headline
      const existingHeadlines = new Set(persona.recentNews.map((n) => n.headline));
      const newNews = news.filter((n) => !existingHeadlines.has(n.headline));
      if (newNews.length > 0) {
        persona.recentNews = [...newNews, ...persona.recentNews].slice(0, 10);
        fieldsUpdated.push('recentNews');
      }
    }
  } catch (e) {
    console.warn(`[Enricher] News enrichment failed for ${personaId}:`, e);
  }

  // Note: promptTier is manually maintained. Do not auto-update here.

  return {
    success: true,
    personaId,
    fieldsUpdated,
    twitterData: { tweetsLoaded, vocabPatternsFound: vocabPatterns.length },
    firecrawlData: {
      newsItemsFound: persona.recentNews.length,
      researchCompleted: false,
    },
  };
}

/**
 * Build a complete aiPersonaPrompt for a persona using Firecrawl deep research
 * This is the most intensive operation — use sparingly
 */
export async function buildPersonaPrompt(personaId: string): Promise<string | null> {
  const persona = personas.find((p) => p.id === personaId);
  if (!persona) return null;

  const twitterUsername = PERSONA_TWITTER_MAP[personaId];

  // ── Gather raw data from all sources ───────────────────────────────────────
  let expressionDNA = '';
  if (twitterUsername) {
    const tweets = await getUserTweets(twitterUsername, 50);
    if (tweets.length > 0) {
      const dna = analyzeExpressionDNA(tweets);
      expressionDNA = buildExpressionDNAString(dna, persona.name);
    }
  }

  // ── Deep research on the person ─────────────────────────────────────────────
  const researchQuery = `${persona.name} ${persona.nativeName || ''} ${persona.title} thinking style decision making philosophy methodology`;
  const research = await deepResearch(researchQuery, 365 * 5); // last 5 years

  // ── Build the prompt ────────────────────────────────────────────────────────
  const prompt = buildPromptFromResearch(persona, research, expressionDNA);
  return prompt;
}

/**
 * Update recentNews for a persona using Firecrawl search
 */
export async function updatePersonaNews(
  personaId: string,
  limit: number = 10
): Promise<{ added: number; total: number }> {
  const persona = personas.find((p) => p.id === personaId);
  if (!persona) return { added: 0, total: 0 };

  const news = await getRecentNewsForPersona(persona.name, limit);
  const existingHeadlines = new Set(persona.recentNews.map((n) => n.headline));
  const newNews = news.filter((n) => !existingHeadlines.has(n.headline));

  persona.recentNews = [...newNews, ...persona.recentNews].slice(0, 10);
  return { added: newNews.length, total: persona.recentNews.length };
}

/**
 * Build vocabularyPatterns from Twitter for a persona
 */
export async function buildVocabFromTwitter(personaId: string): Promise<VocabularyPattern[]> {
  const twitterUsername = PERSONA_TWITTER_MAP[personaId];
  if (!twitterUsername) return [];

  const tweets = await getUserTweets(twitterUsername, 200);
  if (tweets.length === 0) return [];

  return analyzeVocabPatterns(tweets);
}

/**
 * Research a person's biography and career from web sources
 */
export async function researchPerson(personaId: string): Promise<{
  biography: string;
  keyEvents: { year: string; event: string; impact: string }[];
  sources: string[];
} | null> {
  const persona = personas.find((p) => p.id === personaId);
  if (!persona) return null;

  const query = `${persona.name} biography career achievements ${persona.categories.join(' ')}`;
  return researchPersona(persona.name);
}

/**
 * Perform deep research for competitor intelligence
 */
export async function researchCompetitorIntelligence(personaId: string): Promise<{
  competitors: CompetitorProfile[];
  mentalModels: MentalModel[];
  skillChain: SkillChainEntry[];
  decisionJournal: DecisionEntry[];
  failureCases: FailureCase[];
  competitiveWorldview: CompetitiveWorldview;
} | null> {
  const persona = personas.find((p) => p.id === personaId);
  if (!persona) return null;

  const researchQuery = `${persona.name} competitors strategy competitive advantage market position thinking frameworks`;
  const research = await deepResearch(researchQuery, 365 * 3);

  if (!research) return null;

  // Parse research markdown to extract structured information
  const markdown = research.markdown;
  const sections = research.sections;

  // This would need more sophisticated parsing in production
  // For now, return a placeholder structure
  return {
    competitors: parseCompetitorsFromResearch(sections, persona.name),
    mentalModels: parseMentalModelsFromResearch(sections, persona.name),
    skillChain: [],
    decisionJournal: [],
    failureCases: [],
    competitiveWorldview: {
      marketFrame: '',
      threatRanking: [],
      strategicFears: [],
      strategicConfidence: [],
      contrarianBeliefs: [],
    },
  };
}

/**
 * Full enrichment pipeline — enriches all structured Nuwa-grade fields
 * Call this when onboarding a new persona or refreshing an existing one
 */
export async function enrichPersonaFull(personaId: string): Promise<EnrichmentResult> {
  const persona = personas.find((p) => p.id === personaId);
  if (!persona) {
    return { success: false, personaId, fieldsUpdated: [], error: 'Persona not found' };
  }

  const fieldsUpdated: string[] = [];
  const twitterUsername = PERSONA_TWITTER_MAP[personaId];

  // ── Step 1: Twitter data → vocabularyPatterns + expressionDNA ─────────────────
  let vocabPatterns: VocabularyPattern[] = [];
  let tweetsLoaded = 0;
  let expressionDNA = '';

  if (twitterUsername) {
    try {
      const tweets = await getUserTweets(twitterUsername, 100);
      if (tweets.length > 0) {
        tweetsLoaded = tweets.length;
        vocabPatterns = analyzeVocabPatterns(tweets);
        if (persona.vocabularyPatterns?.length) {
          const existingPhrases = new Set(persona.vocabularyPatterns.map((p) => p.phrase));
          const newPatterns = vocabPatterns.filter((p) => !existingPhrases.has(p.phrase));
          persona.vocabularyPatterns = [...persona.vocabularyPatterns, ...newPatterns];
        } else {
          persona.vocabularyPatterns = vocabPatterns;
        }
        fieldsUpdated.push('vocabularyPatterns');

        const dna = analyzeExpressionDNA(tweets);
        expressionDNA = buildExpressionDNAString(dna, persona.name);
      }
    } catch (e) {
      console.warn(`[Enricher] Twitter enrichment failed for ${personaId}:`, e);
    }
  }

  // ── Step 2: Recent news via Firecrawl ───────────────────────────────────────
  try {
    const news = await getRecentNewsForPersona(persona.name, 10);
    if (news.length > 0) {
      const existingHeadlines = new Set(persona.recentNews.map((n) => n.headline));
      const newNews = news.filter((n) => !existingHeadlines.has(n.headline));
      if (newNews.length > 0) {
        persona.recentNews = [...newNews, ...persona.recentNews].slice(0, 10);
        fieldsUpdated.push('recentNews');
      }
    }
  } catch (e) {
    console.warn(`[Enricher] News enrichment failed for ${personaId}:`, e);
  }

  // ── Step 3: Deep research → mentalModels + decisionHeuristics ─────────────────
  try {
    const [heuristicsResult, lineageResult] = await Promise.all([
      researchDecisionHeuristics(persona.name),
      researchIntellectualLineage(persona.name),
    ]);

    if (heuristicsResult.heuristics.length > 0 && !persona.decisionHeuristics?.length) {
      persona.decisionHeuristics = heuristicsResult.heuristics.map((h) => ({
        name: h.name,
        scenario: h.scenario,
        example: h.example,
      }));
      fieldsUpdated.push('decisionHeuristics');
    }

    if (lineageResult.influences.length > 0 || lineageResult.influenced.length > 0) {
      if (!persona.intellectualLineage) {
        persona.intellectualLineage = { influences: [], influenced: [] };
      }
      if (lineageResult.influences.length > 0) {
        persona.intellectualLineage.influences = lineageResult.influences;
        fieldsUpdated.push('intellectualLineage');
      }
      if (lineageResult.influenced.length > 0) {
        persona.intellectualLineage.influenced = lineageResult.influenced;
      }
    }
  } catch (e) {
    console.warn(`[Enricher] Deep research failed for ${personaId}:`, e);
  }

  // ── Step 4: Rebuild aiPersonaPrompt in Nuwa format ────────────────────────────
  if (expressionDNA || persona.thinkingFrameworks?.length) {
    const newPrompt = buildNuwaStylePrompt(persona);
    if (newPrompt !== persona.aiPersonaPrompt) {
      persona.aiPersonaPrompt = newPrompt;
      persona.promptVersion = incrementVersion(persona.promptVersion);
      persona.promptChangelog.unshift({
        version: persona.promptVersion,
        date: new Date().toISOString().split('T')[0],
        changes: `Nuwa-grade format rebuild via enrichPersonaFull: added ${fieldsUpdated.join(', ')}`,
      });
      fieldsUpdated.push('aiPersonaPrompt');
    }
  }

  return {
    success: true,
    personaId,
    fieldsUpdated,
    twitterData: { tweetsLoaded, vocabPatternsFound: vocabPatterns.length },
    firecrawlData: {
      newsItemsFound: persona.recentNews.length,
      researchCompleted: fieldsUpdated.length > 2,
    },
  };
}

/**
 * Build a complete aiPersonaPrompt in Nuwa-skill standard format
 * This is the most intensive operation — use sparingly
 */
export async function buildPersonaPrompt(personaId: string): Promise<string | null> {
  const persona = personas.find((p) => p.id === personaId);
  if (!persona) return null;
  return buildNuwaStylePrompt(persona);
}

// ─── Nuwa-Style Prompt Builder ────────────────────────────────────────────────

function buildNuwaStylePrompt(persona: Persona): string {
  const twitterUsername = PERSONA_TWITTER_MAP[persona.id];

  let expressionDNA = '';
  let chineseRules = '';
  if (twitterUsername) {
    // expressionDNA is only populated if we have real tweets — skip for now
    // (call enrichPersonaFull first for live data)
  }

  const quote = persona.famousQuotes?.[0]
    ? `> "${persona.famousQuotes[0]}"`
    : `> "${persona.shortBio}"`;

  const strengths = buildStrengthsList(persona);
  const weaknesses = buildWeaknessesList(persona);
  const roleRules = buildRolePlayingRules(persona);
  const protocol = buildAgenticProtocol(persona);
  const exampleDialogue = buildExampleDialogue(persona);
  const identity = buildIdentityCard(persona);
  const mentalModels = buildMentalModelsSection(persona);
  const heuristics = buildDecisionHeuristicsSection(persona);
  const expressionSection = buildExpressionDNASection(persona);
  const valuesSection = buildValuesSection(persona);
  const boundaries = buildHonestBoundariesSection(persona);
  const lineage = buildIntellectualLineageSection(persona);

  return [
    buildFrontmatter(persona),
    '',
    `# ${persona.name}${persona.nativeName ? ` · ${persona.nativeName}` : ''} · Thinking Operating System`,
    '',
    quote,
    '',
    '## How to Use',
    '',
    '**Strengths**:',
    ...strengths.map((s) => `- ${s}`),
    '',
    '**Weaknesses**:',
    ...weaknesses.map((w) => `- ${w}`),
    '',
    '---',
    '',
    roleRules,
    '',
    protocol,
    '',
    exampleDialogue,
    '',
    identity,
    '',
    '---',
    '',
    mentalModels,
    '',
    heuristics,
    '',
    expressionSection,
    '',
    valuesSection,
    '',
    boundaries,
    '',
    lineage,
    '',
    `*This skill is distilled from ${persona.dataSourceCount}+ public sources · ${persona.lastUpdated} · Updated ${new Date().toISOString().split('T')[0]}*`,
  ]
    .filter(Boolean)
    .join('\n');
}

// ─── Section builders ─────────────────────────────────────────────────────────

function buildFrontmatter(persona: Persona): string {
  const models = persona.thinkingFrameworks?.length ?? 0;
  const heuristics = persona.decisionHeuristics?.length ?? 0;
  return [
    '---',
    `name: ${persona.id}-perspective`,
    'description: |',
    `  The thinking operating system of ${persona.name}${persona.nativeName ? ` (${persona.nativeName})` : ''}.`,
    `  Distilled from ${persona.dataSourceCount}+ sources: ${models} mental models, ${heuristics} decision heuristics${persona.vocabularyPatterns?.length ? `, ${persona.vocabularyPatterns.length} expression signatures` : ''}.`,
    `  Trigger phrases: "${persona.name} lens", "How would ${persona.name} see this", "Think like ${persona.name}"`,
    `  Also applies to: analysis and advice related to ${persona.categories.join(', ')}.`,
    '---',
  ].join('\n');
}

function buildRolePlayingRules(persona: Persona): string {
  return [
    '## Role-Playing Rules',
    '',
    '**Once this skill is activated, respond directly as '${persona.name}.'**',
    '',
    `- Use first person ("I") not third person ("${persona.name} would think...")`,
    `- Use '${persona.name}'s tone: ${persona.communicationStyle || 'direct, clear, opinionated'}`,
    `- For questions outside your circle of competence, say: "This is outside my circle of competence" or "I have nothing to add."`,
    `- **Disclosure statement only on first activation**, not repeated in subsequent responses`,
    `- Do not break character for meta-analysis (unless user says "exit role")`,
    '',
    '**Exiting role**: Say "exit", "return to normal mode", or "stop role-playing" to restore normal mode.',
  ].join('\n');
}

function buildAgenticProtocol(persona: Persona): string {
  const researchDimensions = buildResearchDimensions(persona);

  return [
    '## Answer Workflow (Agentic Protocol)',
    '',
    '**Core principle: '${persona.name} does not speak from instinct. For questions requiring factual support, do your research first, then answer.**',
    '',
    '### Step 1: Classify the Question',
    '',
    'When you receive a question, classify it first:',
    '',
    '| Type | Characteristics | Action |',
    '|------|------|------|',
    '| **Factual questions** | Involving specific companies/people/events/products/market conditions | → Research first, then answer (Step 2) |',
    '| **Framework questions** | Abstract values, thinking styles, life advice | → Answer directly with mental models (skip to Step 3) |',
    '| **Mixed questions** | Using concrete cases to discuss abstract ideas | → Get case facts first, then analyze with framework |',
    '',
    '**Rule of thumb**: If answer quality would significantly degrade without the latest information, you must research first. Better to search once more than to fabricate from training data.',
    '',
    '### Step 2: ${persona.name}'-style Research (select by question type)',
    '',
    '**You must use tools (WebSearch, etc.) to get real information. Do not skip this step.**',
    '',
    researchDimensions,
    '',
    '**Research output format**: After research, organize a factual summary internally (do not output to user), then proceed to Step 3.',
    '',
    '### Step 3: ${persona.name}'-style Response',
    '',
    'Based on facts from Step 2 (if any), use mental models and Expression DNA to generate your response:',
    `- ${persona.leadershipStyle || 'clear viewpoints, does not avoid conflict'}`,
    `- ${persona.communicationStyle || 'direct, no preamble'}`,
    `- Proactively note parts you are uncertain about or outside your circle of competence`,
  ].join('\n');
}

function buildResearchDimensions(persona: Persona): string {
  const domains = persona.categories.slice(0, 2).join(', ');
  const frameworks = persona.thinkingFrameworks?.map((f) => f.name) ?? [];

  const sections: string[] = [];

  if (domains.includes('Tech') || domains.includes('Business') || domains.includes('Investing')) {
    sections.push(
      '#### Evaluating Companies/Investment Targets\n' +
        '1. **Moat**: What is the competitive advantage? How long can it last?\n' +
        '2. **Management**: How is the incentive structure designed?\n' +
        '3. **Financial data**: Revenue, profit margin, free cash flow\n' +
        '4. **Competitive landscape**: Is the moat widening or narrowing?\n' +
        '5. **Valuation**: Is the current price expensive?\n' +
        '6. **Maximum risk**: How could this cause people to lose money? (inverse thinking)\n'
    );
  }

  if (domains.includes('Science') || domains.includes('Philosophy')) {
    sections.push(
      '#### Evaluating Theories/Viewpoints\n' +
        '1. **First principles**: What premises is this conclusion based on? Are the premises still valid?\n' +
        '2. **Counterarguments**: What do the smartest critics say?\n' +
        '3. **Historical validation**: Have similar theories been confirmed or falsified historically?\n' +
        '4. **Scope**: Under what conditions does this framework fail?\n'
    );
  }

  if (domains.includes('Film') || domains.includes('Arts')) {
    sections.push(
      '#### Evaluating Creative Work\n' +
        '1. **Historical context**: Has this direction been tried before? What were the results?\n' +
        '2. **Uniqueness**: What makes it different?\n' +
        '3. **Execution ability**: Does the team have the capability to execute the idea?\n'
    );
  }

  if (domains.includes('Sports') || domains.includes('Athletics')) {
    sections.push(
      '#### Evaluating Performance\n' +
        '1. **Historical data**: How has this person performed in similar situations?\n' +
        '2. **Opponent analysis**: What is the competitive landscape?\n' +
        '3. **Execution details**: What is the quality of decision-making under pressure?\n'
    );
  }

  // Default generic section
  if (sections.length === 0) {
    sections.push(
      '#### Analyzing Any Problem\n' +
        '1. **Fact-check**: Confirm basic facts first, do not go by impressions\n' +
        '2. **Historical analogy**: Has there been a similar situation before? What were the results?\n' +
        '3. **Interest structure**: Who benefits, who is harmed?\n' +
        '4. **Maximum risk**: What is the worst-case scenario?\n'
    );
  }

  return sections.join('\n\n');
}

function buildExampleDialogue(persona: Persona): string {
  const exampleQ = persona.categories[0] === 'Investing'
    ? 'Is this investment opportunity worth following up on?'
    : persona.categories[0] === 'Science'
    ? 'Is this theory correct?'
    : 'How should I think about this problem?';

  const exampleA = persona.decisionMakingStyle
    ? persona.decisionMakingStyle.split('.')[0] + '。'
    : 'Let me analyze this using my framework.';

  return [
    '### Example Dialogue',
    '',
    `**User**: "${exampleQ}"`,
    '',
    `**${persona.name}**：${exampleA} ${persona.thinkingFrameworks?.[0]?.description?.slice(0, 80) ?? ''}`,
  ].join('\n');
}

function buildIdentityCard(persona: Persona): string {
  const selfDesc = persona.identityCard?.selfDescription ||
    `${persona.name}. ${persona.title}. ${persona.shortBio}`;
  const startPoint = persona.identityCard?.startingPoint ||
    `${persona.born} · ${persona.nationality}`;
  const coreBelief = persona.identityCard?.coreBelief ||
    (persona.thinkingFrameworks?.[0]?.name
      ? `Core belief: ${persona.thinkingFrameworks[0].name}`
      : `Core belief: ${persona.personalityTraits?.[0] ?? 'Pursuing excellence'}.`);

  return [
    '## Identity Card',
    '',
    '**Who I am**: '${selfDesc},
    '',
    '**My starting point**: '${startPoint},
    '',
    '**My core belief**: '${coreBelief},
  ].join('\n');
}

function buildMentalModelsSection(persona: Persona): string {
  if (!persona.thinkingFrameworks?.length) return '';

  const models = persona.thinkingFrameworks.map((m, i) => [
    `### Model ${i + 1}: ${m.name}`,
    '',
    `**One-liner**: ${m.description}`,
    '',
    m.howToApply ? `**How to apply**: ${m.howToApply}` : '',
    '',
    m.example ? `**Example**: ${m.example}` : '',
  ].filter(Boolean).join('\n')).join('\n\n---\n\n');

  return '## Core Mental Models\n\n' + models;
}

function buildDecisionHeuristicsSection(persona: Persona): string {
  if (!persona.decisionHeuristics?.length) return '';

  const items = persona.decisionHeuristics.map((h, i) =>
    [
      `### ${i + 1}. ${h.name}`,
      '',
      h.scenario + '.',
      '',
      h.example ? `Example: ${h.example}` : '',
    ].filter(Boolean).join('\n')
  ).join('\n\n');

  return '## Decision Heuristics\n\n' + items;
}

function buildExpressionDNASection(persona: Persona): string {
  const parts: string[] = [];

  if (persona.vocabularyPatterns?.length) {
    const signature = persona.vocabularyPatterns
      .filter((p) => p.frequency === 'Signature' || p.frequency === 'Common')
      .slice(0, 5);
    if (signature.length > 0) {
      parts.push('**Signature phrases**: 'signature.map((p) => `"${p.phrase}"`).join(', '));
    }
  }

  parts.push('**Communication style**: '${persona.communicationStyle || 'direct, powerful, uniquely opinionated'});

  const sections: string[] = ['## Expression DNA', '', parts.join('\n')];

  if (persona.vocabularyPatterns?.length) {
    const vocabItems = persona.vocabularyPatterns.slice(0, 8);
    sections.push(
      '',
      '| Phrase | Context | Frequency |',
      '|------|------|------|',
      ...vocabItems.map((v) => `| ${v.phrase} | ${v.context} | ${v.frequency} |`)
    );
  }

  return sections.join('\n');
}

function buildValuesSection(persona: Persona): string {
  const pursuits: string[] = [];
  const rejections: string[] = [];
  const tensions: string[] = [];

  if (persona.values?.length) {
    for (const v of persona.values) {
     pursuits.push(`${v.priority}. **${v.value}**: ${v.description}`);
    }
  }

  if (persona.antiPatterns?.length) {
    for (const ap of persona.antiPatterns) {
     rejections.push(`❌ **${ap.behavior}**: ${ap.reason}`);
    }
  }

  if (persona.internalTensions?.length) {
    for (const t of persona.internalTensions) {
     tensions.push(`**${t.tension}**: ${t.manifestation}`);
    }
  }

  const sections: string[] = ['## Values & Anti-Patterns'];

  if (pursuits.length) {
    sections.push('', '### What They Pursue (by priority)', '', ...pursuits);
  }
  if (rejections.length) {
    sections.push('', '### What They Reject', '', ...rejections);
  }
  if (tensions.length) {
    sections.push('', '### Internal Tensions', '', ...tensions);
  }

  if (sections.length === 1) {
    sections.push('', `Core traits: ${persona.personalityTraits?.join(', ') ?? 'Pursuing excellence, risk-taking, results-oriented'}`);
  }

  return sections.join('\n');
}

function buildHonestBoundariesSection(persona: Persona): string {
  const boundaries: string[] = [];

  if (persona.honestBoundaries?.length) {
    for (const b of persona.honestBoundaries) {
      boundaries.push(`**${b.limitation}**: ${b.explanation} → Usage note: ${b.implication}`);
    }
  }

  // Default boundaries if none defined
  if (boundaries.length === 0) {
    boundaries.push(
      `**Public statements ≠ Private thoughts**: ${persona.name}'s public statements may differ from private thinking`,
      `**Information timeliness**: This skill is based on public information before ${persona.lastUpdated}; new developments may have occurred since`,
      `**New domain blind spots**: ${persona.name}'s judgment in areas outside their expertise may be limited`
    );
  }

  return [
    '## Honest Boundaries',
    '',
    '⚠️ This skill is distilled from public information and has the following limitations:',
    '',
    ...boundaries.map((b, i) => `${i + 1}. ${b}`),
  ].join('\n');
}

function buildIntellectualLineageSection(persona: Persona): string {
  if (!persona.intellectualLineage) return '';

  const sections: string[] = ['## Intellectual Lineage'];

  if (persona.intellectualLineage.influences.length) {
    sections.push(
      '',
      '### People who influenced ${persona.name}',
      '',
      '| Person | Influence |',
      '|------|------|',
      ...persona.intellectualLineage.influences.map((i) => `| ${i.person} | ${i.influence} |`)
    );
  }

  if (persona.intellectualLineage.influenced.length) {
    sections.push(
      '',
      `### Who ${persona.name} influenced`,
      '',
      '| Person | How |',
      '|------|------|',
      ...persona.intellectualLineage.influenced.map((i) => `| ${i.person} | ${i.way} |`)
    );
  }

  return sections.join('\n');
}

// ─── Utility builders ──────────────────────────────────────────────────────────

function buildStrengthsList(persona: Persona): string[] {
  const strengths: string[] = [];
  if (persona.thinkingFrameworks?.length) {
    strengths.push(`Analyzes complex problems using ${persona.thinkingFrameworks[0].name} and other mental models`);
  }
  if (persona.personalityTraits?.length) {
    strengths.push(`Possesses traits such as ${persona.personalityTraits.slice(0, 2).join(' and ')}`);
  }
  strengths.push(`${persona.workingStyle || 'Results-oriented work style'}`);
  return strengths.length > 0 ? strengths : ['Deeply analyzes complex problems', 'Has unique perspective'];
}

function buildWeaknessesList(persona: Persona): string[] {
  const weaknesses: string[] = [];
  if (persona.blindSpots?.length) {
    weaknesses.push(`${persona.blindSpots[0]} (${persona.name}'s known blind spot)`);
  }
  weaknesses.push('Unpredictable response to entirely new problems');
  weaknesses.push('Public statements may differ from private thinking');
  return weaknesses.length > 0 ? weaknesses : ['Unpredictable response to entirely new problems'];
}

function incrementVersion(version: string): string {
  const parts = version.split('.');
  const patch = parseInt(parts[parts.length - 1] || '0', 10) + 1;
  parts[parts.length - 1] = String(patch);
  return parts.join('.');
}

function parseCompetitorsFromResearch(
  sections: { title: string; content: string }[],
  personName: string
): CompetitorProfile[] {
  const competitors: CompetitorProfile[] = [];
  const competitorSection = sections.find((s) =>
    s.title.toLowerCase().includes('competitor') || s.title.toLowerCase().includes('rival')
  );

  if (competitorSection) {
    // Basic parsing — would need refinement in production
    const names = competitorSection.content.match(/[A-Z][a-z]+ [A-Z][a-z]+/g) || [];
    for (const name of [...new Set(names)].slice(0, 3)) {
      if (name !== personName) {
        competitors.push({
          name,
          relationship: 'Primary Rival',
          marketPosition: 'Competitor in overlapping market',
          competitiveDynamic: 'Ongoing competitive tension',
          tacticalResponse: 'Monitor closely',
          whatTheyDoBetter: 'TBD from further research',
          whatTheyDoWorse: 'TBD from further research',
          status: 'Active',
        });
      }
    }
  }

  return competitors;
}

function parseMentalModelsFromResearch(
  sections: { title: string; content: string }[],
  personName: string
): MentalModel[] {
  const mentalModels: MentalModel[] = [];
  const thinkingSection = sections.find((s) =>
    s.title.toLowerCase().includes('think') || s.title.toLowerCase().includes('model')
  );

  if (thinkingSection) {
    const lines = thinkingSection.content.split('\n').filter((l) => l.trim().length > 20);
    for (const line of lines.slice(0, 5)) {
      const cleaned = line.replace(/^#{1,6}\s*/, '').trim();
      if (cleaned.length > 10) {
        mentalModels.push({
          name: cleaned.split(' ').slice(0, 4).join(' '),
          origin: `Developed through ${personName}'s career experience`,
          trigger: `When facing ${cleaned.split(' ').slice(0, 2).join(' ')} type problems`,
          internalMonologue: `I recall that ${cleaned.toLowerCase()}`,
          output: cleaned,
          confidence: 'Pragmatic',
        });
      }
    }
  }

  return mentalModels;
}
