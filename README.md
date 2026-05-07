# Trial Finder

A free, independent search tool for cancer clinical trials worldwide. Aggregates from ClinicalTrials.gov, WHO ICTRP, ANZCTR, ChiCTR, and other registries. Plain-language summaries written for patients and families. Structured matching wizard that compares your situation to trial eligibility criteria.

> **Designed by [PopVax](https://popvax.com).** No ads, no accounts, no tracking, no business model.

## What's in here

- **Next.js 15 + App Router + TypeScript** — modern React stack
- **Supabase Postgres + Drizzle ORM** — database and migrations
- **Tailwind CSS** with editorial-medical design system (Fraunces serif + Geist sans)
- **Anthropic Claude API**:
  - Haiku for modality classification + plain-language summaries (cheap, fast)
  - Sonnet for structured eligibility matching (expensive, accurate)
- **GitHub Actions cron** — daily ingestion + classification at 06:00 UTC

## Project structure

```
src/
  app/                  # Next.js App Router pages
    page.tsx              # Home: search + filter + listing
    trials/[id]/page.tsx  # Trial detail
    match/page.tsx        # Structured matching wizard (client component)
    about/page.tsx        # About / disclaimer / privacy
    api/                  # JSON API routes
      search/route.ts
      trial/[id]/route.ts
      match/route.ts
      ingest/status/route.ts
  components/           # Reusable UI components
  lib/
    db/                 # Drizzle schema + client
    taxonomy/           # Cancer types & modalities
    ingest/             # Ingestion + classification + matching logic
    search.ts           # Search query builder
    utils.ts
scripts/
  run-ingest.ts         # Main ingestion entry (called by cron)
  run-classify.ts       # Modality + plain-language classifier
.github/workflows/
  ingest.yml            # Daily cron + manual trigger
```

## Quick start (local development)

### 1. Install dependencies

```bash
npm install
```

### 2. Create a Supabase project

- Go to [supabase.com](https://supabase.com) and create a free project
- From **Project Settings → Database**, copy the **Connection Pooling** connection string (port 6543, transaction mode)
- It will look like: `postgresql://postgres.xxx:password@aws-0-region.pooler.supabase.com:6543/postgres`

### 3. Get an Anthropic API key

- [console.anthropic.com](https://console.anthropic.com)
- Add ~$20 of credit to start (a full backfill + classification costs ~$15)

### 4. Set environment variables

```bash
cp .env.example .env
# Edit .env with your DATABASE_URL and ANTHROPIC_API_KEY
```

### 5. Push the schema to Supabase

```bash
npm run db:push
```

This creates the `trials` and `ingestion_runs` tables.

### 6. Run an initial ingestion

This will take 30–60 minutes and ingest ~50,000 cancer trials from ClinicalTrials.gov. It calls the API page-by-page (1000 trials per page), filters to oncology, and upserts to Postgres.

```bash
npm run ingest:full
```

You can run it in the background and watch progress in the logs.

### 7. Run classification

This calls Claude Haiku for each trial to assign treatment modalities and write plain-language summaries. Cost: ~$0.0002 per trial → ~$10 for the full backfill.

```bash
npm run ingest:classify
```

You can stop and restart this safely — it picks up where it left off. The script processes 2000 trials per run by default; set `MAX_CLASSIFY_PER_RUN` to override.

### 8. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Architecture decisions

**Why ClinicalTrials.gov as primary?** It's the largest single registry, has a clean JSON API v2, no auth required, and most multinational pharma trials register there even when they also register elsewhere. Easy 80% coverage.

**Why WHO ICTRP for secondaries?** Single source for ChiCTR (China), ANZCTR (Australia/NZ), CTRI (India), jRCT (Japan), EU-CTR, ISRCTN, etc. — much cleaner than scraping 20 different sites. Requires SharePoint access from WHO (free, but takes 1–2 weeks). Email `ictrpinfo@who.int` to request.

**Why direct ANZCTR/ChiCTR scrapers as fallback?** Fresher data than ICTRP's weekly XML. Marked as stubs in the codebase — implement only if ICTRP coverage proves insufficient.

**Why Claude for classification?** Trial intervention descriptions vary wildly. "AdV-tk + valacyclovir + radiation" needs to map to "Gene Therapy + Radiation + Combination" — no keyword set captures this reliably. Haiku is cheap enough for full corpus (~$15) and accurate enough for filter use cases.

**Why Sonnet for matching?** The matching task requires reading dense eligibility criteria text and comparing to user-reported biomarkers and prior treatments. Sonnet handles ambiguous cases (e.g., "no prior anti-PD-1" vs. user's "pembrolizumab two years ago") much better than Haiku. We cap at 30 candidates per match request to control cost.

**Why Drizzle?** Type-safe SQL with no runtime overhead. Migrations are explicit. Works with Supabase pooler.

**Why Next.js App Router?** Server Components let us run database queries at the page level without an API layer. Streaming + Suspense make perceived performance good even with slow DB queries on the free Supabase tier.

## Cost estimates

| Component | Cost |
|---|---|
| Supabase free tier | $0 (500MB DB, fits ~50k trials with our schema) |
| Vercel free tier (Hobby) | $0 (single domain, generous bandwidth) |
| GitHub Actions | $0 (well under the 2000-min/month free tier) |
| Anthropic API — initial backfill (Haiku) | ~$15 one-time |
| Anthropic API — daily ingestion (Haiku) | ~$0.50/day = ~$15/month |
| Anthropic API — matching (Sonnet) | ~$0.10 per match request |
| **Total** | **~$15-20/month** at low traffic |

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md).

## License

MIT (you are encouraged to fork and adapt for any disease area).
