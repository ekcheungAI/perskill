# Sam Altman — Research Archive

No research data available for this persona yet.

## Generate Research Data

Run the research pipeline to collect data:

```bash
# Quick research (tweets only)
npx tsx scripts/research/pipeline.ts sam-altman --count=200

# Full research (tweets + web + deep)
npx tsx scripts/research/pipeline.ts sam-altman --count=500 --deep-research
```

Results will be saved to:
- `scripts/research/output/sam-altman_draft.json`
- `scripts/research/data/sam-altman_tweets.json`

Then re-run `npx tsx scripts/generate-skill-folders.ts` to populate this folder.
