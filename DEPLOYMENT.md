# Deployment Guide

Step-by-step deployment to Vercel + Supabase, with a daily ingestion job running on GitHub Actions.

Total time from zero: about 45 minutes (most of it waiting for the initial backfill).

---

## 1. Supabase setup (5 min)

1. Go to [supabase.com](https://supabase.com) and sign up. Free tier is fine for MVP — 500MB database, more than enough for ~50,000 trials with our schema.
2. **New project**:
   - Name: `trial-finder`
   - Database password: use a strong one and save it
   - Region: pick whatever's closest to your Vercel region (US East and EU West both work for Vercel)
3. Wait for the project to finish provisioning (~2 minutes)
4. Go to **Project Settings → Database → Connection string**
5. Switch the dropdown to **Connection pooling** (not Direct connection — pooled is required for serverless)
6. Make sure **Mode = Transaction** and **Port = 6543**
7. Copy the connection string. It looks like:
   ```
   postgresql://postgres.abcdef:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
   ```
8. Replace `[YOUR-PASSWORD]` with your actual password — keep this safe, you'll need it for both local dev and Vercel/GitHub.

---

## 2. Anthropic API key (2 min)

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Create or select a workspace
3. **API Keys → Create Key** — name it `trial-finder`
4. Copy the key (starts with `sk-ant-...`)
5. Add ~$20 of credit to your account. The initial backfill + classification will cost about $15.

---

## 3. Local setup & initial backfill (30-60 min, mostly waiting)

```bash
# Clone or unzip the project
cd trial-finder

# Install
npm install

# Create local env file
cp .env.example .env
# Edit .env: paste DATABASE_URL and ANTHROPIC_API_KEY

# Push schema to Supabase
npm run db:push

# Initial backfill — takes ~30-60 min
npm run ingest:full

# Classify all the trials — takes ~60-90 min, costs ~$10-15
npm run ingest:classify

# Test it locally
npm run dev
# Open http://localhost:3000
```

Both ingestion scripts can be safely interrupted and resumed — they're idempotent.

You can ingest first and let users browse without classification — trials show up but without modality tags or plain-language summaries until classify runs.

---

## 4. GitHub repository (5 min)

1. Create a private GitHub repo (e.g., `popvax/trial-finder`)
2. Push the code:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/<your-org>/trial-finder.git
   git branch -M main
   git push -u origin main
   ```
3. Add repository secrets — go to **Settings → Secrets and variables → Actions → New repository secret**:
   - `DATABASE_URL` — same value as your `.env`
   - `ANTHROPIC_API_KEY` — same value as your `.env`

The daily cron job is already configured in `.github/workflows/ingest.yml` and will start running tomorrow at 06:00 UTC. You can also trigger it manually from the **Actions** tab.

---

## 5. Vercel deployment (5 min)

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. **Add New → Project**, select your `trial-finder` repo
3. Framework: Next.js (auto-detected)
4. **Environment Variables** — add:
   - `DATABASE_URL` — your Supabase pooler URL
   - `ANTHROPIC_API_KEY` — your Anthropic key
   - `NEXT_PUBLIC_SITE_URL` — leave as `https://your-project.vercel.app` for now (you can update once you have a custom domain)
5. **Deploy**

Once deployed you'll get a URL like `https://trial-finder-xxx.vercel.app`. Visit it and confirm the home page loads with trials.

---

## 6. Custom domain (when you get one)

You don't need a domain to launch. The Vercel subdomain works.

When you're ready, **suggested domains**:

- `trialcompass.org` (clean, neutral, charitable feel)
- `findatrial.org`
- `clinicaltrials.help`
- `oncotrials.org`
- `trialfinder.health`

Avoid medical-sounding TLDs (`.med`, `.health`) only if you're worried about implying clinical authority — `.org` reads as nonprofit/educational, which fits the unbranded patient-utility framing.

To add a domain in Vercel: **Project Settings → Domains → Add**. Vercel handles SSL automatically.

After adding, update the `NEXT_PUBLIC_SITE_URL` env var to your new domain and redeploy.

---

## 7. WHO ICTRP access (do this in parallel — 1-2 week lead time)

To unlock China + Australia + India + Japan + EU coverage beyond what ClinicalTrials.gov already provides, send this email today:

> **To**: ictrpinfo@who.int  
> **Subject**: Request for SharePoint access — weekly ICTRP records download
>
> Hello,
>
> I'm setting up a free, non-commercial patient-facing search tool that aggregates cancer clinical trials from public registries worldwide and presents them in plain language. We want to extend coverage beyond ClinicalTrials.gov to include the registries in the WHO ICTRP network — particularly ChiCTR, ANZCTR, CTRI, jRCT, and EU-CTR.
>
> Could you please grant access to the SharePoint folder containing the weekly XML download of new and updated records? We will fully comply with the ICTRP Terms and Conditions, including attribution and prohibition on commercial reuse.
>
> Project: Trial Finder (oncology)  
> Hosted at: [your URL once deployed]  
> Sponsoring organization: PopVax ([popvax.com](https://popvax.com))
>
> Thank you,  
> [Your name]

When they reply with credentials, implement the parser in `src/lib/ingest/ictrp.ts` (the file has detailed notes), enable it in `scripts/run-ingest.ts` (set `enabled: true` for the `ictrp` source), and add `WHO_ICTRP_USERNAME`, `WHO_ICTRP_PASSWORD`, `WHO_ICTRP_SHAREPOINT_URL` to both your local `.env` and your Vercel/GitHub secrets.

---

## 8. Monitoring

### Built-in status endpoint

```
GET /api/ingest/status
```

Returns total trials, classification progress, and the last 20 ingestion runs. No auth — fine for an MVP, add auth if you make this private.

### GitHub Actions

Tab → **Actions** in the repo. You'll see daily runs and can re-run failures.

### Supabase

Dashboard → **Table editor** → `trials` and `ingestion_runs`. The `ingestion_runs` table has the full log of every run with row counts and any error messages.

---

## 9. Going live checklist

Before sharing the link publicly:

- [ ] Initial ingestion complete (`/api/ingest/status` shows >40,000 trials)
- [ ] Classification complete (`pendingClassification` is at most a few hundred — the rest will catch up the next night)
- [ ] Spot-check 5–10 trial detail pages — eligibility, locations, plain-language summary all look right
- [ ] Submit a few different cancer types to the matching wizard, verify results make sense
- [ ] Disclaimer banner appears on every page
- [ ] Footer "Designed by PopVax" link is correct
- [ ] If you've added a custom domain, `NEXT_PUBLIC_SITE_URL` is updated
- [ ] GitHub Actions cron tested with **Run workflow** button at least once
- [ ] WHO ICTRP access requested (this can come later)

---

## Troubleshooting

### "DATABASE_URL is not set" during `db:push`
Drizzle reads `.env` automatically, but if your `.env` has Windows line endings or BOMs, it can fail to parse. Re-save in UTF-8.

### "prepared statement does not exist" errors during ingestion
The Supabase **transaction** pooler doesn't support prepared statements. We've already disabled them in `src/lib/db/index.ts` (`prepare: false`). If you switch to a different pooler mode, you may need to revisit this.

### Classification keeps failing on certain trials
Check `lastClassifiedAt` and `classificationVersion` in `trials` table. The classifier marks failures with `modalities = ["other"]` so they don't retry forever. Bump `CURRENT_CLASSIFICATION_VERSION` in `src/lib/ingest/classify.ts` to force re-classification of everything (after fixing whatever bug).

### Vercel function timeout on `/api/match`
Match requests can take 30-60 seconds (calling Sonnet on 30 trials in parallel). The Vercel Hobby plan allows up to 60 seconds. If you hit limits, reduce `MATCH_LIMIT_LLM` in `src/lib/ingest/matching.ts` from 30 to 15.

### My ingestion script keeps disconnecting from Supabase
The free Supabase tier limits concurrent connections. Make sure you're using the pooler URL (port 6543), not the direct URL (port 5432). The pooler handles connection multiplexing.
