"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowLeft, Sparkles, Loader2, Check, X, HelpCircle } from "lucide-react";
import {
  CANCER_TYPES,
  CANCER_GROUPS,
  type CancerGroup,
} from "@/lib/taxonomy/cancer-types";
import type { UserProfile, MatchResult } from "@/lib/ingest/matching";
import { cn, formatPhase, formatStatus } from "@/lib/utils";
import { getModality } from "@/lib/taxonomy/modalities";
import { DisclaimerBanner } from "@/components/disclaimer-banner";

const COMMON_COUNTRIES = [
  "United States",
  "China",
  "Australia",
  "United Kingdom",
  "Germany",
  "France",
  "Japan",
  "South Korea",
  "India",
  "Canada",
  "Spain",
  "Italy",
  "Netherlands",
  "Brazil",
  "Israel",
  "Singapore",
];

const COMMON_PRIOR_TREATMENTS = [
  "Chemotherapy",
  "Radiation therapy",
  "Surgery",
  "Immunotherapy (checkpoint inhibitor)",
  "Targeted therapy",
  "Hormonal therapy",
  "Stem cell transplant",
  "CAR-T cell therapy",
];

const STAGES = [
  { value: "early" as const, label: "Early stage / localized" },
  { value: "locally_advanced" as const, label: "Locally advanced" },
  { value: "metastatic" as const, label: "Metastatic / Stage IV" },
  { value: "recurrent" as const, label: "Recurrent" },
  { value: "unknown" as const, label: "Not sure / Unknown" },
];

type Step = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export default function MatchPage() {
  const [step, setStep] = useState<Step>(0);
  const [profile, setProfile] = useState<UserProfile>({
    cancerTypeIds: [],
    stage: "unknown",
    priorTreatments: [],
    biomarkers: "",
    ageYears: 50,
    sex: "FEMALE",
    countries: [],
    willingToTravelInternational: false,
    additionalContext: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<MatchResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof UserProfile>(key: K, value: UserProfile[K]) {
    setProfile((p) => ({ ...p, [key]: value }));
  }

  function toggleInArray<T>(arr: T[], item: T): T[] {
    return arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item];
  }

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        throw new Error(j?.error ?? `Server error (${res.status})`);
      }
      const data = (await res.json()) as { matches: MatchResult[] };
      setResults(data.matches);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSubmitting(false);
    }
  }

  const canProceed: Record<Step, boolean> = {
    0: true,
    1: profile.cancerTypeIds.length > 0,
    2: true,
    3: true,
    4: true,
    5: profile.ageYears > 0,
    6: true,
  };

  if (results) {
    return <ResultsView results={results} onRestart={() => setResults(null)} />;
  }

  return (
    <>
      <DisclaimerBanner />

      <div className="container py-10 max-w-narrow">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-ink-subtle hover:text-ink mb-8 transition-colors"
        >
          <ArrowLeft size={14} /> Back to browse
        </Link>

        <header className="mb-10 pb-8 border-b border-rule">
          <div className="text-[11px] uppercase tracking-[0.2em] text-ink-subtle mb-3 flex items-center gap-2">
            <Sparkles size={12} className="text-accent" />
            Matching wizard
          </div>
          <h1 className="font-display text-display-md md:text-display-lg leading-tight mb-4">
            Tell us about your situation.
          </h1>
          <p className="text-base text-ink-muted leading-relaxed">
            Answer a few questions and we'll search for trials that may fit your
            cancer type, treatment history, biomarkers, and location. Your
            answers stay in your browser and are sent to our server only when
            you submit — no account, no tracking.
          </p>
        </header>

        <div className="mb-8 flex items-center gap-2">
          {[0, 1, 2, 3, 4, 5, 6].map((s) => (
            <div
              key={s}
              className={cn(
                "h-1 flex-1 rounded-full transition-colors",
                s <= step ? "bg-ink" : "bg-rule"
              )}
            />
          ))}
        </div>

        {step === 0 && (
          <StepWrap
            title="What kind of cancer?"
            subtitle="Pick the most specific match. Pick more than one if applicable."
          >
            <CancerTypePicker
              selected={profile.cancerTypeIds}
              onChange={(ids) => update("cancerTypeIds", ids)}
            />
          </StepWrap>
        )}

        {step === 1 && (
          <StepWrap
            title="What stage?"
            subtitle="If you're not sure, that's fine — we'll consider all options."
          >
            <RadioGroup
              options={STAGES}
              value={profile.stage}
              onChange={(v) => update("stage", v)}
            />
          </StepWrap>
        )}

        {step === 2 && (
          <StepWrap
            title="What treatments have you already had?"
            subtitle="Check anything that applies. This helps us filter trials that require — or exclude — certain prior treatments."
          >
            <div className="space-y-2">
              {COMMON_PRIOR_TREATMENTS.map((t) => (
                <CheckboxBlock
                  key={t}
                  label={t}
                  checked={profile.priorTreatments.includes(t)}
                  onChange={() =>
                    update(
                      "priorTreatments",
                      toggleInArray(profile.priorTreatments, t)
                    )
                  }
                />
              ))}
              <div className="pt-3">
                <label className="text-xs text-ink-subtle uppercase tracking-wider mb-1 block">
                  Other treatments / drug names (optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. FOLFIRINOX, gemcitabine + nab-paclitaxel, pembrolizumab"
                  value={profile.priorTreatments
                    .filter((t) => !COMMON_PRIOR_TREATMENTS.includes(t))
                    .join(", ")}
                  onChange={(e) => {
                    const customs = e.target.value
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean);
                    const standards = profile.priorTreatments.filter((t) =>
                      COMMON_PRIOR_TREATMENTS.includes(t)
                    );
                    update("priorTreatments", [...standards, ...customs]);
                  }}
                  className="w-full"
                />
              </div>
            </div>
          </StepWrap>
        )}

        {step === 3 && (
          <StepWrap
            title="Any known biomarkers or mutations?"
            subtitle="If your tumor has been tested, mention any known mutations, fusions, expression markers, or molecular subtypes. The more specific, the better the match."
          >
            <textarea
              placeholder="e.g. HER2 negative, MSS, KRAS G12D wildtype, BRCA1/2 wildtype, NRG1 fusion present, PD-L1 CPS 5"
              value={profile.biomarkers}
              onChange={(e) => update("biomarkers", e.target.value)}
              rows={5}
              className="w-full resize-y"
            />
            <p className="text-xs text-ink-subtle mt-3 leading-relaxed">
              Don't worry about formatting — write it however your test report
              shows it. Our matcher reads free text.
            </p>
          </StepWrap>
        )}

        {step === 4 && (
          <StepWrap
            title="Where can you receive treatment?"
            subtitle="Select all countries that work for you. Leave blank to search globally."
          >
            <div className="grid grid-cols-2 gap-1">
              {COMMON_COUNTRIES.map((c) => (
                <CheckboxBlock
                  key={c}
                  label={c}
                  checked={profile.countries.includes(c)}
                  onChange={() =>
                    update("countries", toggleInArray(profile.countries, c))
                  }
                  compact
                />
              ))}
            </div>
            <div className="mt-5 pt-5 border-t border-rule">
              <CheckboxBlock
                label="I'm willing to travel internationally for the right trial"
                checked={profile.willingToTravelInternational}
                onChange={() =>
                  update(
                    "willingToTravelInternational",
                    !profile.willingToTravelInternational
                  )
                }
              />
            </div>
          </StepWrap>
        )}

        {step === 5 && (
          <StepWrap
            title="A few basics."
            subtitle="Age and sex are commonly required eligibility filters."
          >
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-xs text-ink-subtle uppercase tracking-wider mb-1 block">
                  Age (years)
                </label>
                <input
                  type="number"
                  min="0"
                  max="120"
                  value={profile.ageYears}
                  onChange={(e) =>
                    update("ageYears", parseInt(e.target.value, 10) || 0)
                  }
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-xs text-ink-subtle uppercase tracking-wider mb-1 block">
                  Sex (as listed in registries)
                </label>
                <select
                  value={profile.sex}
                  onChange={(e) =>
                    update("sex", e.target.value as UserProfile["sex"])
                  }
                  className="w-full"
                >
                  <option value="FEMALE">Female</option>
                  <option value="MALE">Male</option>
                  <option value="OTHER">Other / not specified</option>
                </select>
              </div>
            </div>
          </StepWrap>
        )}

        {step === 6 && (
          <StepWrap
            title="Anything else we should know?"
            subtitle="Optional. The matcher will use this to better evaluate fit."
          >
            <textarea
              placeholder="e.g. Recently progressed on standard-of-care. Looking specifically for novel approaches. Limited time, prefer trials starting soon."
              value={profile.additionalContext}
              onChange={(e) => update("additionalContext", e.target.value)}
              rows={4}
              className="w-full resize-y"
            />
          </StepWrap>
        )}

        {error && (
          <div className="mt-6 p-4 border border-warning bg-accent-soft text-sm text-warning">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between mt-10 pt-6 border-t border-rule">
          {step > 0 ? (
            <button
              onClick={() => setStep((s) => (s - 1) as Step)}
              className="text-sm text-ink-subtle hover:text-ink flex items-center gap-1.5"
              disabled={submitting}
            >
              <ArrowLeft size={14} /> Back
            </button>
          ) : (
            <span />
          )}

          {step < 6 ? (
            <button
              onClick={() => setStep((s) => (s + 1) as Step)}
              disabled={!canProceed[step]}
              className={cn(
                "px-5 py-2.5 text-sm font-medium flex items-center gap-2 transition-colors",
                canProceed[step]
                  ? "bg-ink text-paper hover:bg-accent"
                  : "bg-rule text-ink-faint cursor-not-allowed"
              )}
            >
              Next <ArrowRight size={14} />
            </button>
          ) : (
            <button
              onClick={submit}
              disabled={submitting}
              className="px-6 py-2.5 text-sm font-medium bg-accent text-paper hover:bg-ink flex items-center gap-2 transition-colors disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Searching trials…
                </>
              ) : (
                <>
                  <Sparkles size={14} /> Find my matches
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </>
  );
}

function StepWrap({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="font-display text-display-sm mb-2">{title}</h2>
      <p className="text-sm text-ink-muted mb-6 leading-relaxed">{subtitle}</p>
      {children}
    </div>
  );
}

function CancerTypePicker({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  const grouped: Record<CancerGroup, typeof CANCER_TYPES> = {} as Record<
    CancerGroup,
    typeof CANCER_TYPES
  >;
  for (const ct of CANCER_TYPES) {
    if (!grouped[ct.group]) grouped[ct.group] = [];
    grouped[ct.group].push(ct);
  }

  function toggle(id: string) {
    if (selected.includes(id)) onChange(selected.filter((x) => x !== id));
    else onChange([...selected, id]);
  }

  return (
    <div className="space-y-5 max-h-[60vh] overflow-y-auto pr-2">
      {Object.entries(grouped).map(([group, items]) => (
        <div key={group}>
          <div className="text-[11px] font-medium uppercase tracking-wider text-ink-subtle mb-2">
            {CANCER_GROUPS[group as CancerGroup]}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {items.map((ct) => (
              <button
                key={ct.id}
                type="button"
                onClick={() => toggle(ct.id)}
                className={cn(
                  "px-3 py-1.5 text-xs border transition-colors",
                  selected.includes(ct.id)
                    ? "bg-ink text-paper border-ink"
                    : "bg-paper-raised border-rule-strong hover:border-ink"
                )}
              >
                {ct.label}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function RadioGroup<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="space-y-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            "w-full text-left p-4 border transition-colors flex items-center gap-3",
            value === opt.value
              ? "border-ink bg-paper-raised"
              : "border-rule hover:border-ink-muted bg-paper-raised"
          )}
        >
          <span
            className={cn(
              "w-4 h-4 rounded-full border-2 shrink-0 transition-colors",
              value === opt.value
                ? "border-ink bg-ink"
                : "border-rule-strong"
            )}
          />
          <span className="text-sm">{opt.label}</span>
        </button>
      ))}
    </div>
  );
}

function CheckboxBlock({
  label,
  checked,
  onChange,
  compact = false,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={cn(
        "w-full text-left flex items-center gap-3 border transition-colors",
        compact ? "p-2.5" : "p-3.5",
        checked
          ? "border-ink bg-paper-raised"
          : "border-rule hover:border-ink-muted bg-paper-raised"
      )}
    >
      <span
        className={cn(
          "inline-flex items-center justify-center w-4 h-4 border shrink-0",
          checked ? "bg-ink border-ink" : "bg-paper border-rule-strong"
        )}
      >
        {checked && <Check size={11} className="text-paper" />}
      </span>
      <span className="text-sm">{label}</span>
    </button>
  );
}

// Results view ------------------------------------------------------------

function ResultsView({
  results,
  onRestart,
}: {
  results: MatchResult[];
  onRestart: () => void;
}) {
  return (
    <>
      <DisclaimerBanner />
      <div className="container py-10 max-w-narrow">
        <header className="mb-10 pb-8 border-b border-rule">
          <button
            onClick={onRestart}
            className="inline-flex items-center gap-1.5 text-sm text-ink-subtle hover:text-ink mb-6 transition-colors"
          >
            <ArrowLeft size={14} /> Edit your answers
          </button>
          <h1 className="font-display text-display-md md:text-display-lg leading-tight mb-3">
            {results.length === 0
              ? "No matching trials found."
              : `${results.length} trials may fit your situation.`}
          </h1>
          <p className="text-base text-ink-muted leading-relaxed">
            Each match is scored by an AI model that compared your profile to
            the trial's eligibility criteria. <strong>This is not a medical recommendation.</strong>{" "}
            Final eligibility is determined by the trial team after medical
            screening. Discuss any trial with your oncologist before contacting.
          </p>
        </header>

        {results.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-ink-muted mb-6">
              Try widening your criteria — fewer cancer subtypes, more countries,
              or enable international travel.
            </p>
            <button
              onClick={onRestart}
              className="px-5 py-2.5 text-sm bg-ink text-paper hover:bg-accent"
            >
              Edit my answers
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            {results.map((r) => (
              <MatchResultCard key={r.trial.id} result={r} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function MatchResultCard({ result }: { result: MatchResult }) {
  const status = formatStatus(result.trial.status);
  const verdictMeta = {
    likely_eligible: { label: "Likely eligible", color: "text-recruiting" },
    possibly_eligible: { label: "Possibly eligible", color: "text-not-yet" },
    unlikely_eligible: { label: "Unlikely eligible", color: "text-warning" },
  }[result.verdict];

  const modalityLabels = (result.trial.modalities ?? [])
    .map((m) => getModality(m)?.shortLabel)
    .filter(Boolean) as string[];

  return (
    <article className="border border-rule bg-paper-raised">
      <div className="p-6">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex items-center gap-3 text-xs">
            <span className={`status-pip ${status.color}`}>{status.label}</span>
            <span className="font-mono text-ink-faint">{result.trial.id}</span>
          </div>
          <div className="text-right">
            <div className={cn("text-2xl font-display", verdictMeta.color)}>
              {result.fitScore}
            </div>
            <div
              className={cn(
                "text-[10px] uppercase tracking-wider",
                verdictMeta.color
              )}
            >
              {verdictMeta.label}
            </div>
          </div>
        </div>

        <Link
          href={`/trials/${encodeURIComponent(result.trial.id)}`}
          className="block group"
        >
          <h3 className="font-display text-xl leading-snug mb-3 group-hover:text-accent transition-colors">
            {result.trial.briefTitle ?? result.trial.officialTitle}
          </h3>
        </Link>

        {result.trial.plainLanguageSummary && (
          <p className="text-sm text-ink-muted leading-relaxed mb-4">
            {result.trial.plainLanguageSummary}
          </p>
        )}

        {modalityLabels.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {modalityLabels.slice(0, 4).map((m) => (
              <span key={m} className="chip chip-accent">
                {m}
              </span>
            ))}
          </div>
        )}

        <div className="text-xs text-ink-subtle flex flex-wrap gap-x-5 gap-y-1 pb-4 border-b border-rule">
          <span>{formatPhase(result.trial.phase)}</span>
          {result.trial.countries && result.trial.countries.length > 0 && (
            <span>{result.trial.countries.join(", ")}</span>
          )}
          {result.trial.sponsorName && (
            <span className="truncate max-w-[12rem]">
              {result.trial.sponsorName}
            </span>
          )}
        </div>

        {/* Match analysis */}
        <div className="grid sm:grid-cols-3 gap-5 mt-5 text-xs">
          <ExplainBlock
            icon={<Check size={12} />}
            color="text-recruiting"
            title="Likely matches"
            items={result.explanation.matches}
          />
          <ExplainBlock
            icon={<X size={12} />}
            color="text-warning"
            title="Possible conflicts"
            items={result.explanation.conflicts}
          />
          <ExplainBlock
            icon={<HelpCircle size={12} />}
            color="text-not-yet"
            title="Need to clarify"
            items={result.explanation.uncertain}
          />
        </div>

        <div className="mt-5 pt-4 border-t border-rule flex items-center justify-between">
          <Link
            href={`/trials/${encodeURIComponent(result.trial.id)}`}
            className="text-sm link-editorial flex items-center gap-1"
          >
            View full trial
            <ArrowRight size={12} />
          </Link>
        </div>
      </div>
    </article>
  );
}

function ExplainBlock({
  icon,
  color,
  title,
  items,
}: {
  icon: React.ReactNode;
  color: string;
  title: string;
  items: string[];
}) {
  return (
    <div>
      <div className={cn("flex items-center gap-1.5 mb-2", color)}>
        {icon}
        <span className="text-[10px] uppercase tracking-wider font-medium">
          {title}
        </span>
      </div>
      {items.length === 0 ? (
        <p className="text-ink-faint italic">None noted</p>
      ) : (
        <ul className="space-y-1 text-ink-muted">
          {items.map((item, i) => (
            <li key={i} className="leading-snug">
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
