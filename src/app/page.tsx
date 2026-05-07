"use client";

import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import { mockTrials } from "@/lib/db/mock-data";
import { TrialCard } from "@/components/trial-card";
import { SearchBar } from "@/components/search-bar";
import { FilterPanel } from "@/components/filter-panel";
import { DisclaimerBanner } from "@/components/disclaimer-banner";

// Wrapper components that provide Suspense boundaries
// Required for useSearchParams() to work with static export
function SearchBarWrapper() {
  return (
    <Suspense fallback={<div className="h-12 bg-paper-sunken animate-pulse rounded" />}>
      <SearchBar />
    </Suspense>
  );
}

function FilterPanelWrapper() {
  return (
    <Suspense fallback={<div className="h-64 bg-paper-sunken animate-pulse rounded" />}>
      <FilterPanel />
    </Suspense>
  );
}

export default function HomePage() {
  // Use mock data directly for static export
  // Client-side search will handle filtering via JavaScript
  const trials = mockTrials.slice(0, 20);
  const total = mockTrials.length;

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
            <SearchBarWrapper />
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
          <FilterPanelWrapper />

          <div>
            <div className="flex items-baseline justify-between mb-6 pb-4 border-b border-rule">
              <div>
                <h2 className="font-display text-display-sm">
                  {total.toLocaleString()} active trials
                </h2>
              </div>
            </div>

            {trials.length === 0 ? (
              <div className="py-16 text-center max-w-narrow mx-auto">
                <h3 className="font-display text-display-sm mb-3">
                  No trials available
                </h3>
                <p className="text-ink-muted mb-6">
                  Try using the matching wizard to get personalized results.
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
                {trials.map((trial) => (
                  <TrialCard key={trial.id} trial={trial} />
                ))}
              </div>
            )}

            <div className="mt-8 flex justify-center">
              <p className="text-sm text-ink-muted">
                Showing {trials.length} of {total} trials
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
