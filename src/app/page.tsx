import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import { searchTrials, parseSearchParams } from "@/lib/search";
import { TrialCard } from "@/components/trial-card";
import { SearchBar } from "@/components/search-bar";
import { FilterPanel } from "@/components/filter-panel";
import { Pagination } from "@/components/pagination";
import { DisclaimerBanner } from "@/components/disclaimer-banner";
import { mockTrials } from "@/lib/db/mock-data";

// Use static generation with revalidation for the main page
export const dynamic = "force-static";
export const revalidate = 3600; // Revalidate every hour if using ISR

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const params = parseSearchParams(sp);
  
  // Try to fetch from DB, fall back to mock data on error
  let result;
  try {
    result = await searchTrials(params);
  } catch (err) {
    console.warn("DB search failed, using mock data:", err);
    // Fall back to mock data
    const filtered = mockTrials.filter(t => {
      if (params.q && !t.briefTitle?.toLowerCase().includes(params.q.toLowerCase())) return false;
      if (params.cancerTypes?.length && !t.cancerTypes?.some(ct => params.cancerTypes?.includes(ct))) return false;
      return true;
    });
    result = {
      trials: filtered.slice(0, 20),
      total: filtered.length,
      page: 1,
      perPage: 20,
      totalPages: Math.ceil(filtered.length / 20),
    };
  }

  const hasActiveFilters =
    !!params.q ||
    (params.cancerTypes?.length ?? 0) > 0 ||
    (params.modalities?.length ?? 0) > 0 ||
    (params.statuses?.length ?? 0) > 0 ||
    (params.phases?.length ?? 0) > 0 ||
    (params.countries?.length ?? 0) > 0;

  return (
    <>
      <DisclaimerBanner />

      {/* Hero */}
      <section className="border-b border-rule">
        <div className="container py-16 md:py-20 max-w-narrow">
          <div className="text-[11px] uppercase tracking-[0.2em] text-ink-subtle mb-4">
            A free, independent search tool
          </div>
          <h1 className="font-display text-display-lg md:text-display-xl mb-5 text-balance">
            Find a cancer clinical trial.
          </h1>
          <p className="text-lg text-ink-muted leading-relaxed mb-8 max-w-prose">
            Search trials from registries around the world — ClinicalTrials.gov,
            WHO ICTRP, ANZCTR, ChiCTR, and more. Updated daily. Plain-language
            summaries written for patients and families.
          </p>
          <div className="space-y-4">
            <Suspense
              fallback={<div className="h-12 bg-paper-sunken animate-pulse" />}
            >
              <SearchBar />
            </Suspense>
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-accent" />
              <Link
                href="/match"
                className="text-sm link-editorial flex items-center gap-1"
              >
                Or answer a few questions to find trials matched to your situation
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="container py-10">
        <div className="grid lg:grid-cols-[260px_1fr] gap-12">
          <Suspense
            fallback={
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-10 bg-paper-sunken animate-pulse"
                  />
                ))}
              </div>
            }
          >
            <FilterPanel />
          </Suspense>

          <div>
            <div className="flex items-baseline justify-between mb-6 pb-4 border-b border-rule">
              <div>
                <h2 className="font-display text-display-sm">
                  {hasActiveFilters
                    ? `${result.total.toLocaleString()} matching trials`
                    : `${result.total.toLocaleString()} active trials`}
                </h2>
                {result.totalPages > 1 && (
                  <p className="text-xs text-ink-subtle mt-1">
                    Page {result.page} of {result.totalPages}
                  </p>
                )}
              </div>
            </div>

            {result.trials.length === 0 ? (
              <div className="py-16 text-center max-w-narrow mx-auto">
                <h3 className="font-display text-display-sm mb-3">
                  No trials match these filters
                </h3>
                <p className="text-ink-muted mb-6">
                  Try removing some filters, or use the matching wizard to get
                  personalized results.
                </p>
                <Link
                  href="/match"
                  className="inline-flex items-center gap-2 link-editorial"
                >
                  Try the matching wizard
                  <ArrowRight size={14} />
                </Link>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {result.trials.map((trial) => (
                  <TrialCard key={trial.id} trial={trial} />
                ))}
              </div>
            )}

            <Suspense fallback={null}>
              <Pagination
                currentPage={result.page}
                totalPages={result.totalPages}
              />
            </Suspense>
          </div>
        </div>
      </section>
    </>
  );
}
