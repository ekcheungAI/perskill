# Charlie Munger — Research Archive

No research data available for this persona yet.

## Generate Research Data

Run the research pipeline to collect data:

```bash
# Quick research (tweets only)
npx tsx scripts/research/pipeline.ts charlie-munger --count=200

# Full research (tweets + web + deep)
npx tsx scripts/research/pipeline.ts charlie-munger --count=500 --deep-research
```

Results will be saved to:
- `scripts/research/output/charlie-munger_draft.json`
- `scripts/research/data/charlie-munger_tweets.json`

Then re-run `npx tsx scripts/generate-skill-folders.ts` to populate this folder.
