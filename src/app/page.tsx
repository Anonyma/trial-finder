import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { mockTrials } from "@/lib/db/mock-data";
import { TrialCard } from "@/components/trial-card";
import { DisclaimerBanner } from "@/components/disclaimer-banner";

// Pure static page - no client components
export const dynamic = "force-static";

export default function HomePage() {
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
            {/* Simple search form - no client JS needed for initial render */}
            <form action="/" method="GET" className="relative">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.3-4.3"></path>
              </svg>
              <input
                type="text"
                name="q"
                placeholder="Search by drug, mutation, sponsor, or condition…"
                className="w-full pl-12 pr-12 py-3.5 text-base bg-paper-raised"
              />
            </form>
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
          {/* Static filter panel */}
          <aside className="space-y-1">
            <h3 className="text-xs uppercase tracking-[0.15em] text-ink-subtle font-medium mb-4">
              Filters
            </h3>
            <div className="border-b border-rule py-3">
              <div className="font-display text-base">Cancer type</div>
            </div>
            <div className="border-b border-rule py-3">
              <div className="font-display text-base">Treatment type</div>
            </div>
            <div className="border-b border-rule py-3">
              <div className="font-display text-base">Status</div>
            </div>
            <div className="border-b border-rule py-3">
              <div className="font-display text-base">Phase</div>
            </div>
            <div className="border-b border-rule py-3">
              <div className="font-display text-base">Country</div>
            </div>
          </aside>

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
