# Perskill

> Wikipedia-depth profiles of iconic leaders — turned into AI agent personas you can install in any LLM with one click.

A curated library of **56 deep-research personas** across Business, Tech, Film, Finance, Investing, Sports, and more. Each profile includes thinking frameworks, working patterns, AI-ready system prompts, personality radar charts, and relationship networks.

---

## Features

- **Card Library** — browse 56 personas in a responsive card grid, filterable by category and region
- **Persona Detail Pages** — full 6-tab profiles: Thinking Style, Working Style, AI Prompts, Overview, News, Network
- **Stack Builder** — combine up to 4 personas into a composite AI system prompt
- **Persona Match Quiz** — 6-question assessment that recommends personas based on complementarity scoring
- **One-Click Copy** — all AI prompts copyable in one click for ChatGPT, Claude, Cursor, or any LLM
- **Research Pipeline** — automated persona onboarding via Twitter, Firecrawl, and deep research

---

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## Project Structure

```
perskill/
├── index.html                  ← App entry point
├── package.json                 ← Vite + React 19 + TypeScript
├── vite.config.ts              ← @ path alias → src/
├── src/
│   ├── App.tsx                 ← Routes + ThemeProvider
│   ├── main.tsx                ← React entry
│   ├── index.css               ← Design tokens, animations
│   ├── lib/
│   │   ├── personas.ts         ← All 56 persona data objects
│   │   └── research-data.ts   ← Research draft registry
│   ├── pages/
│   │   ├── Home.tsx            ← Card grid + sidebar + stack tray
│   │   ├── PersonaDetail.tsx   ← 6-tab profile page
│   │   ├── PersonaMatch.tsx    ← Quiz + results
│   │   └── NotFound.tsx
│   └── components/
│       ├── PersonaCard.tsx     ← Card component
│       ├── RelationshipGraph.tsx
│       └── ui/                 ← shadcn/ui primitives
├── skills/                     ← 56 persona skill folders
│   ├── elon-musk/
│   │   ├── PROFILE.md
│   │   ├── SKILL.md
│   │   ├── SYSTEM_PROMPT.md
│   │   ├── USE_CASE_PROMPTS.md
│   │   └── README.md
│   └── [55 more personas]
└── scripts/
    ├── export-personas.ts      ← Generate skills/ from personas.ts
    └── research/
        ├── pipeline.ts         ← Main research orchestrator
        ├── persona-research.ts  ← Scaffold new persona project
        ├── twitter-scraper.ts   ← TwitterAPI.io scraper
        ├── firecrawl-research.ts
        ├── run-validation.ts    ← Pre-ship validation
        ├── INSTRUCTION.md       ← Step-by-step manual
        ├── distill_templates/   ← Research templates
        │   ├── DISTILL_PLAN.md
        │   ├── SKILL_TEMPLATE.md
        │   ├── TRIPLE_VERIFY.md
        │   └── VALIDATION_HARNESS.md
        └── output/             ← Research output per persona
```

---

## Personas (56)

### Tech & Business (7)

| Persona | Rarity | Description |
|---|---|---|
| Elon Musk | RRR | World's most consequential engineer. First-principles thinker who bets civilization-scale stakes on impossible problems. |
| Steve Jobs | RRR | Visionary product designer who created the modern personal computer, smartphone, and digital entertainment. |
| Jeff Bezos | RRR | Founded Amazon as an online bookstore and built it into the world's largest e-commerce and cloud platform. |
| Jensen Huang | RRR | Transformed NVIDIA from gaming graphics into the engine of modern AI and accelerated computing. |
| Larry Ellison | RR | Wartime CEO who built Oracle into a $400B enterprise. Obsessed with talent density. |
| Donald Trump | RR | Master negotiator and brand-builder. Uses hyperbolic anchoring and transactional deal-making. |
| Jack Ma 馬雲 | RR | The teacher who conquered e-commerce. Founded Alibaba in an apartment and bridged East and West. |

### European Tech Leaders (4)

| Persona | Rarity | Description |
|---|---|---|
| Erik Ekudden | R | Ericsson's CTO & SVP Technology. Architect of 5G Standalone and AI-native 6G vision. |
| Philipp Herzig | R | SAP's first Chief AI Officer turned CTO. Led the AI-first transformation of the world's largest enterprise software company. |
| Gustav Söderström | R | Spotify's Co-CEO and architect of its algorithmic personalization dominance. |
| Lars Reger | R | NXP's technology visionary bridging chip physics and the AI-at-the-edge revolution. |
| Sabine Klauke | R | Airbus's former CTO who led 13,000 engineers through aviation's decarbonization. |

### Finance & Investing (15)

| Persona | Rarity | Description |
|---|---|---|
| Warren Buffett | RRR | World's longest track record of market-beating returns. Pioneer of economic moats and patient capital allocation. |
| Charlie Munger | RRR | Intellectual giant and Buffett's partner who applies interdisciplinary thinking to investment decisions. |
| Benjamin Graham | RRR | Pioneer of value investing who developed the philosophy and mentored Buffett. |
| Peter Lynch | RRR | Beat the S&P 500 by 13% annually for 13 years through disciplined stock research. |
| Ray Dalio | RRR | Founder of the world's largest hedge fund. Pioneer of All-Weather portfolio and radical transparency. |
| George Soros | RRR | Billionaire investor who shorted the British pound for $1B in a single day. Pioneer of reflexivity theory. |
| Stanley Druckenmiller | RRR | Managed Duquesne 30+ years with zero losing years. Co-architected the 1992 pound trade for $1B+ profit. |
| Carl Icahn | RRR | Ruthless activist investor who buys undervalued companies and forces operational changes. |
| Howard Marks | RRR | Master of distressed investing who makes outsized returns by buying when others panic. |
| Cathie Wood | RRR | Bold conviction investor betting big on disruptive technologies. |
| John Bogle | RRR | Revolutionized investing through low-cost index funds, democratizing wealth-building. |
| Jesse Livermore | RR | Self-taught trader who shorted the 1929 crash for $100M+ profit. Pioneer of tape reading. |
| Paul Tudor Jones | RR | Legendary macro trader who tripled capital in the 1987 crash. |
| Richard Dennis | RR | Turned $1,600 into $200M+ with trend-following systems. Created the Turtle Trading experiment. |
| Steve Cohen | RR | Built SAC Capital to $20B AUM averaging 30% net gains for 20 years. |
| Rakesh Jhunjhunwala | RR | Indian value investor who turned ₹5,000 into $5.8B+. |

### Crypto (2)

| Persona | Rarity | Description |
|---|---|---|
| KillaXBT | RR | Crypto's most trusted quantitative voice. Called the BTC top above $100K with a structured method. |
| Justin Sun 孙宇晨 | RR | Asia's most controversial crypto founder. Ran a $10B blockchain empire from a $4.5M Buffett lunch bid. |

### Sports — Basketball (5)

| Persona | Rarity | Description |
|---|---|---|
| Michael Phelps | RRR | Most decorated Olympian in history. 23 gold medals, 8 in a single Games. |
| Serena Williams | RRR | Most dominant women's tennis player of her era. 23 Grand Slam singles titles. |
| Kobe Bryant | RRR | 5 NBA championships, 2 Finals MVPs, 1 Oscar. 'Mamba Mentality' became a philosophy transcending sports. |
| LeBron James | RRR | NBA's all-time leading scorer and most complete basketball player ever. |
| Tim Duncan | RR | Greatest power forward in NBA history. 5 championships in 19 All-NBA selections. |
| Shaquille O'Neal | RR | Most physically dominant basketball player of his era. 4 championships, 3 Finals MVPs. |
| Stephen Curry | RR | Greatest shooter in NBA history. Changed how basketball is played worldwide. |
| Patrick Mahomes | RR | Most dynamic quarterback in NFL history. 3 Super Bowls, 2 MVPs. |
| Aaron Donald | RR | Most dominant defensive player in NFL history. 10 consecutive Pro Bowls. |

### Sports — Tennis (3)

| Persona | Rarity | Description |
|---|---|---|
| Novak Djokovic | RR | Most successful men's tennis player in history. 24 Grand Slams, 428 weeks at No. 1. |
| Rafael Nadal | RR | King of Clay and one of the greatest competitors in tennis history. 22 Grand Slams. |
| Lionel Messi | RRR | Greatest footballer of all time. 8 Ballon d'Or, 1 World Cup. |

### Sports — Other (3)

| Persona | Rarity | Description |
|---|---|---|
| Cristiano Ronaldo | RR | Most physically complete footballer ever. 5 Ballon d'Or, 130+ international goals. |
| Katie Ledecky | RR | Greatest female swimmer in history. 10 Olympic medals, 7 golds. |
| Lewis Hamilton | RR | Greatest Formula One driver in history. 7 world championships, 104 wins. |

### Film — Hong Kong Directors (5)

| Persona | Rarity | Description |
|---|---|---|
| Wong Kar-wai 王家衛 | RRR | Poet of longing. Widely regarded as the greatest living auteur in world cinema. |
| Stephen Chow 周星馳 | RRR | King of Comedy who revolutionized Asian cinema with 'Mo Lei Tau' absurdity. |
| John Woo 吳宇森 | RR | Invented the stylized 'bullet ballet' action choreography that defined Hong Kong cinema. |
| Johnnie To 杜琪峯 | RR | Hong Kong's master of crime cinema. 100+ films over five decades. |
| Tsui Hark 徐克 | RR | Steven Spielberg of Asia. Defined the golden age of Hong Kong cinema with visual innovation. |
| Peter Chan 陳可辛 | R | Hong Kong's most versatile auteur. Moved seamlessly between romantic comedy, war epic, and social drama. |

### Live Commerce (1)

| Persona | Rarity | Description |
|---|---|---|
| 李佳琦 Austin Li | RR | China's most influential beauty live-streamer. 94M+ Taobao fans, ~¥175B annual GMV. |

### Hong Kong Business (1)

| Persona | Rarity | Description |
|---|---|---|
| Li Ka-shing 李嘉誠 | RR | Asia's Superman. Built a $40B empire by reading geopolitical currents before they shift. |
| 施永青 | RR | Founded Midland Realty in 1978. Pioneer of Hong Kong and Mainland China real estate agency. |

---

## Adding a New Persona

### 1. Scaffold Research Project

```bash
npx tsx scripts/research/persona-research.ts new-persona --type=BUSINESS
```

This creates `scripts/research/output/new-persona/` with `PLAN.md` and distillation template files.

### 2. Run Data Collection

```bash
npx tsx scripts/research/pipeline.ts handle --deep-research
```

Collects tweets via TwitterAPI.io, web content via Firecrawl, and deep research synthesis. Saves to `scripts/research/output/{persona}/`.

### 3. Complete Distillation Files

Fill in the distillation templates in `scripts/research/output/{persona}/research/`. Run `npx tsx scripts/research/run-validation.ts {persona}` when ready.

### 4. Add to App

Add the persona object to `src/lib/personas.ts`. Run the export script:

```bash
npx tsx scripts/export-personas.ts
```

This regenerates all `skills/{id}/` folders from the updated `personas.ts`.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 + Vite 8 |
| Routing | Wouter 3.x |
| Styling | Tailwind CSS 4 (OKLCH color tokens) |
| UI Components | shadcn/ui (Radix UI) |
| Language | TypeScript 5 |
| Fonts | Fraunces + Inter + JetBrains Mono |
| Charts | Recharts |
| Icons | Lucide React |
| Toasts | Sonner |

---

## Commands

```bash
npm run dev        # Start dev server at localhost:5173
npm run build      # Build for production → dist/
npm run preview    # Preview production build
npm run typecheck  # TypeScript check
```

---

## License

MIT
