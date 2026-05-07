import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="container py-12 max-w-prose">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-ink-subtle hover:text-ink mb-8 transition-colors"
      >
        <ArrowLeft size={14} /> Back
      </Link>

      <h1 className="font-display text-display-lg mb-4">About</h1>
      <p className="text-lg text-ink-muted leading-relaxed mb-12">
        A free, independent search tool that aggregates cancer clinical trials
        from public registries around the world and presents them in plain
        language.
      </p>

      <section id="disclaimer" className="mb-14 scroll-mt-12">
        <h2 className="font-display text-display-sm mb-4 border-l-4 border-accent pl-4">
          Medical disclaimer
        </h2>
        <div className="space-y-4 leading-relaxed">
          <p>
            <strong>This tool is not medical advice.</strong> The information
            shown is aggregated from public clinical trial registries and may be
            incomplete, out of date, machine-summarized, or contain errors.
            Listings, summaries, and matching scores are generated automatically
            and have not been reviewed by a clinician.
          </p>
          <p>
            <strong>Always consult your oncologist</strong> or a qualified
            medical professional before considering any clinical trial,
            contacting a trial site, or making any treatment decision. Final
            eligibility for any trial is determined by the trial team after
            medical screening — not by this tool.
          </p>
          <p>
            <strong>Inclusion of a trial in our database is not an endorsement.</strong>{" "}
            We do not evaluate the scientific merit, safety record, or quality
            of any trial. The presence or ranking of a trial reflects only
            registry data and matching algorithms, not clinical judgment.
          </p>
          <p>
            <strong>The structured matching feature</strong> uses an AI model
            to compare your self-reported information to a trial's eligibility
            criteria. It can miss important details, misread medical text, and
            produce false positives or false negatives. Treat its output as a
            starting point for conversation with your care team — never as a
            substitute for one.
          </p>
          <p>
            If you are in a medical emergency, call your local emergency number.
            For mental health support, contact a local crisis line.
          </p>
        </div>
      </section>

      <section className="mb-14">
        <h2 className="font-display text-display-sm mb-4">How this works</h2>
        <div className="space-y-4 leading-relaxed">
          <p>
            Every day, a scheduled job pulls newly added or updated cancer
            trials from public registries. We currently aggregate from:
          </p>
          <ul className="list-disc pl-6 space-y-1 text-ink-muted">
            <li>
              <strong>ClinicalTrials.gov</strong> (United States National
              Library of Medicine) — primary real-time source
            </li>
            <li>
              <strong>WHO ICTRP</strong> — aggregator covering ChiCTR (China),
              ANZCTR (Australia / NZ), CTRI (India), jRCT (Japan), EU-CTR, and
              others
            </li>
            <li>
              <strong>Direct registry sources</strong> as fallback for ANZCTR
              and ChiCTR
            </li>
          </ul>
          <p>
            We then run two automated processes on each trial:
          </p>
          <ol className="list-decimal pl-6 space-y-1 text-ink-muted">
            <li>
              <strong>Cancer-type tagging</strong> — we map registry-provided
              conditions to a normalized list of cancer types, so search and
              filtering work consistently across registries.
            </li>
            <li>
              <strong>Modality classification &amp; plain-language summary</strong>{" "}
              — an AI model reads the trial's interventions and writes a 3–5
              sentence summary in everyday language and tags the treatment
              approach (CAR-T, mRNA vaccine, ADC, etc).
            </li>
          </ol>
          <p>
            Both automated steps can make mistakes. When in doubt, click through
            to the original registry record (link is on every trial page).
          </p>
        </div>
      </section>

      <section className="mb-14">
        <h2 className="font-display text-display-sm mb-4">
          What the structured matching does
        </h2>
        <div className="space-y-4 leading-relaxed">
          <p>
            The matching wizard collects your cancer type, stage, prior
            treatments, biomarkers, age, sex, and location preferences. It then:
          </p>
          <ol className="list-decimal pl-6 space-y-1 text-ink-muted">
            <li>
              <strong>Filters by hard criteria first.</strong> Trials that don't
              match your cancer type, age, sex, or available country are
              removed.
            </li>
            <li>
              <strong>Scores the rest with an AI model.</strong> The model
              compares your prior treatments and biomarkers to each trial's
              full eligibility criteria text and outputs a 0–100 fit score with
              an explanation.
            </li>
            <li>
              <strong>Returns the top matches</strong> with the model's
              reasoning broken into "matches", "conflicts", and "uncertain"
              criteria so you can see how it reached the score.
            </li>
          </ol>
          <p className="text-ink-muted">
            We cap the AI scoring at 30 trials per request to keep response times
            and costs manageable. If you have a rare cancer or very specific
            molecular profile, we recommend also browsing manually.
          </p>
        </div>
      </section>

      <section id="privacy" className="mb-14 scroll-mt-12">
        <h2 className="font-display text-display-sm mb-4 border-l-4 border-accent pl-4">
          Privacy
        </h2>
        <div className="space-y-4 leading-relaxed">
          <p>
            <strong>No accounts. No cookies for tracking. No analytics.</strong>{" "}
            We don't know who you are.
          </p>
          <p>
            Browsing or searching the trial database doesn't send any personal
            information anywhere — your search filters live in the URL.
          </p>
          <p>
            When you submit the matching wizard, the information you entered
            (cancer type, stage, biomarkers, etc.) is sent to our server, used
            once to query trials and call the AI matching model, and not
            persisted. We don't log what you submit and we don't use it to train
            anything. The AI model provider (Anthropic) processes the request
            under their standard API terms.
          </p>
          <p>
            We don't share any data with advertisers, insurers, employers, or
            third parties. There are none of those involved.
          </p>
        </div>
      </section>

      <section className="mb-14">
        <h2 className="font-display text-display-sm mb-4">Coverage</h2>
        <div className="space-y-4 leading-relaxed">
          <p>
            ClinicalTrials.gov coverage is real-time and comprehensive — most
            U.S. trials, all multinational pharma trials, and a substantial
            fraction of European and Asian trials are listed there.
          </p>
          <p>
            Coverage of trials registered <em>only</em> in regional registries
            (especially ChiCTR for Chinese-domestic trials, and KCT for
            Korean-domestic trials) depends on our WHO ICTRP weekly feed.
            Chinese pharma oncology pipelines also appear on{" "}
            <a
              href="https://www.chinadrugtrials.org.cn"
              target="_blank"
              rel="noopener noreferrer"
              className="link-editorial"
            >
              chinadrugtrials.org.cn
            </a>
            , a Chinese-only platform we may add in a future release.
          </p>
          <p>
            If you can't find a trial you've heard about, search the original
            registry directly. We will always link to it.
          </p>
        </div>
      </section>

      <section>
        <h2 className="font-display text-display-sm mb-4">Built by</h2>
        <p className="leading-relaxed">
          Designed and built by{" "}
          <a
            href="https://popvax.com"
            target="_blank"
            rel="noopener noreferrer"
            className="link-editorial"
          >
            PopVax
          </a>
          , an mRNA therapeutics company working on AI-designed cancer
          immunotherapies. We built this because patients deserve a better
          interface to public trial data than the registries themselves provide.
          We don't profile users, don't sell data, and don't preferentially
          show our own trials. There is no business model behind this tool.
        </p>
      </section>
    </div>
  );
}
