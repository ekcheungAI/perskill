# Jack Ma — Research Archive

No research data available for this persona yet.

## Generate Research Data

Run the research pipeline to collect data:

```bash
# Quick research (tweets only)
npx tsx scripts/research/pipeline.ts jack-ma --count=200

# Full research (tweets + web + deep)
npx tsx scripts/research/pipeline.ts jack-ma --count=500 --deep-research
```

Results will be saved to:
- `scripts/research/output/jack-ma_draft.json`
- `scripts/research/data/jack-ma_tweets.json`

Then re-run `npx tsx scripts/generate-skill-folders.ts` to populate this folder.
