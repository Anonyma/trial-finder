import Link from "next/link";
import type { Trial } from "@/lib/db/schema";
import { formatPhase, formatStatus } from "@/lib/utils";
import { getCancerType } from "@/lib/taxonomy/cancer-types";
import { getModality } from "@/lib/taxonomy/modalities";

export function TrialCard({ trial }: { trial: Trial }) {
  const status = formatStatus(trial.status);
  const cancerLabels = (trial.cancerTypes ?? [])
    .map((id) => getCancerType(id)?.label)
    .filter(Boolean) as string[];
  const modalityLabels = (trial.modalities ?? [])
    .map((id) => getModality(id)?.shortLabel)
    .filter(Boolean) as string[];
  const countries = trial.countries ?? [];

  return (
    <Link
      href={`/trials/${trial.id}`}
      className="trial-card block p-6 group"
    >
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className={`status-pip ${status.color}`}>{status.label}</div>
        <span className="text-[11px] font-mono text-ink-faint">{trial.id}</span>
      </div>

      <h3 className="font-display text-xl leading-snug mb-3 group-hover:text-accent transition-colors">
        {trial.briefTitle ?? trial.officialTitle ?? "Untitled trial"}
      </h3>

      {trial.plainLanguageSummary && (
        <p className="text-sm text-ink-muted leading-relaxed mb-4 line-clamp-3">
          {trial.plainLanguageSummary}
        </p>
      )}

      <div className="flex flex-wrap gap-1.5 mb-3">
        {cancerLabels.slice(0, 2).map((label) => (
          <span key={label} className="chip">
            {label}
          </span>
        ))}
        {cancerLabels.length > 2 && (
          <span className="chip">+{cancerLabels.length - 2}</span>
        )}
        {modalityLabels.slice(0, 3).map((label) => (
          <span key={label} className="chip chip-accent">
            {label}
          </span>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-ink-subtle pt-3 border-t border-rule">
        <span>{formatPhase(trial.phase)}</span>
        {countries.length > 0 && (
          <span>
            {countries.length === 1
              ? countries[0]
              : `${countries.length} countries`}
          </span>
        )}
        {trial.sponsorName && (
          <span className="truncate max-w-[14rem]">{trial.sponsorName}</span>
        )}
      </div>
    </Link>
  );
}
