# Stephen Chow — Research Archive

No research data available for this persona yet.

## Generate Research Data

Run the research pipeline to collect data:

```bash
# Quick research (tweets only)
npx tsx scripts/research/pipeline.ts stephen-chow --count=200

# Full research (tweets + web + deep)
npx tsx scripts/research/pipeline.ts stephen-chow --count=500 --deep-research
```

Results will be saved to:
- `scripts/research/output/stephen-chow_draft.json`
- `scripts/research/data/stephen-chow_tweets.json`

Then re-run `npx tsx scripts/generate-skill-folders.ts` to populate this folder.
