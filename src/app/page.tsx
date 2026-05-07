import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { DisclaimerBanner } from "@/components/disclaimer-banner";

// Minimal static page - testing if imports are the issue
export const dynamic = "force-static";

export default function HomePage() {
  return (
    <>
      <DisclaimerBanner />

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
            WHO ICTRP, ANZCTR, ChiCTR, and more. Updated daily.
          </p>
          <Link href="/match" className="text-sm link-editorial flex items-center gap-1">
            Try the matching wizard
            <ArrowRight size={14} />
          </Link>
        </div>
      </section>

      <section className="container py-10">
        <p className="text-ink-muted">Trials will appear here.</p>
      </section>
    </>
  );
}
