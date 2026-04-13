# Paul Tudor Jones — Research Archive

No research data available for this persona yet.

## Generate Research Data

Run the research pipeline to collect data:

```bash
# Quick research (tweets only)
npx tsx scripts/research/pipeline.ts paul-tudor-jones --count=200

# Full research (tweets + web + deep)
npx tsx scripts/research/pipeline.ts paul-tudor-jones --count=500 --deep-research
```

Results will be saved to:
- `scripts/research/output/paul-tudor-jones_draft.json`
- `scripts/research/data/paul-tudor-jones_tweets.json`

Then re-run `npx tsx scripts/generate-skill-folders.ts` to populate this folder.
