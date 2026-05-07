import { notFound } from "next/navigation";
import Link from "next/link";
import { ExternalLink, ArrowLeft, MapPin, Calendar, Users, Beaker } from "lucide-react";
import { db } from "@/lib/db";
import { trials } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { formatDate, formatPhase, formatStatus } from "@/lib/utils";
import { getCancerType } from "@/lib/taxonomy/cancer-types";
import { getModality } from "@/lib/taxonomy/modalities";
import { DisclaimerBanner } from "@/components/disclaimer-banner";

export const dynamic = "force-dynamic";

export default async function TrialDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const decodedId = decodeURIComponent(id);
  const [trial] = await db
    .select()
    .from(trials)
    .where(eq(trials.id, decodedId))
    .limit(1);

  if (!trial) notFound();

  const status = formatStatus(trial.status);
  const cancerLabels = (trial.cancerTypes ?? [])
    .map((cid) => getCancerType(cid)?.label)
    .filter(Boolean) as string[];
  const modalitiesWithDesc = (trial.modalities ?? [])
    .map((mid) => getModality(mid))
    .filter((m): m is NonNullable<typeof m> => Boolean(m));

  // Group locations by country
  const locationsByCountry = new Map<string, typeof trial.locations>();
  for (const loc of trial.locations ?? []) {
    if (!loc.country) continue;
    const arr = locationsByCountry.get(loc.country) ?? [];
    arr.push(loc);
    locationsByCountry.set(loc.country, arr);
  }

  return (
    <>
      <DisclaimerBanner />

      <article className="container py-10 max-w-prose">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-ink-subtle hover:text-ink mb-8 transition-colors"
        >
          <ArrowLeft size={14} /> All trials
        </Link>

        <header className="mb-10 pb-8 border-b border-rule">
          <div className="flex items-center gap-4 mb-4 text-xs">
            <span className={`status-pip ${status.color}`}>{status.label}</span>
            <span className="font-mono text-ink-faint">{trial.id}</span>
            <a
              href={trial.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto inline-flex items-center gap-1 text-ink-subtle hover:text-accent transition-colors"
            >
              View on{" "}
              {trial.source === "clinicaltrials_gov"
                ? "ClinicalTrials.gov"
                : trial.source}
              <ExternalLink size={12} />
            </a>
          </div>

          <h1 className="font-display text-display-md md:text-display-lg leading-tight mb-4 text-balance">
            {trial.briefTitle ?? trial.officialTitle ?? "Untitled trial"}
          </h1>

          {trial.officialTitle &&
            trial.briefTitle &&
            trial.officialTitle !== trial.briefTitle && (
              <p className="text-sm text-ink-muted italic leading-relaxed">
                {trial.officialTitle}
              </p>
            )}
        </header>

        {trial.plainLanguageSummary && (
          <section className="mb-10">
            <h2 className="text-[11px] uppercase tracking-[0.15em] text-ink-subtle mb-3">
              In plain language
            </h2>
            <p className="text-lg leading-relaxed text-ink">
              {trial.plainLanguageSummary}
            </p>
          </section>
        )}

        {/* Quick facts */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-10 py-6 border-y border-rule">
          <Fact icon={<Beaker size={14} />} label="Phase">
            {formatPhase(trial.phase)}
          </Fact>
          <Fact icon={<Users size={14} />} label="Enrollment">
            {trial.enrollmentCount?.toLocaleString() ?? "—"}
          </Fact>
          <Fact icon={<Calendar size={14} />} label="Started">
            {formatDate(trial.startDate)}
          </Fact>
          <Fact icon={<MapPin size={14} />} label="Locations">
            {(trial.locations?.length ?? 0).toString()}{" "}
            {trial.countries && trial.countries.length > 0 && (
              <span className="text-ink-subtle text-xs">
                ({trial.countries.length}{" "}
                {trial.countries.length === 1 ? "country" : "countries"})
              </span>
            )}
          </Fact>
        </section>

        {/* Cancer types & modalities */}
        {(cancerLabels.length > 0 || modalitiesWithDesc.length > 0) && (
          <section className="mb-10">
            {cancerLabels.length > 0 && (
              <div className="mb-5">
                <h2 className="text-[11px] uppercase tracking-[0.15em] text-ink-subtle mb-2">
                  Cancer types
                </h2>
                <div className="flex flex-wrap gap-2">
                  {cancerLabels.map((label) => (
                    <span key={label} className="chip">
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {modalitiesWithDesc.length > 0 && (
              <div>
                <h2 className="text-[11px] uppercase tracking-[0.15em] text-ink-subtle mb-2">
                  Treatment approach
                </h2>
                <div className="space-y-3">
                  {modalitiesWithDesc.map((m) => (
                    <div
                      key={m.id}
                      className="border-l-2 border-accent pl-4 py-1"
                    >
                      <div className="font-medium text-sm mb-0.5">
                        {m.label}
                      </div>
                      <p className="text-sm text-ink-muted leading-relaxed">
                        {m.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* Brief summary */}
        {trial.briefSummary && (
          <section className="mb-10">
            <h2 className="font-display text-display-sm mb-3">Summary</h2>
            <div className="prose-content text-base leading-relaxed text-ink whitespace-pre-line">
              {trial.briefSummary}
            </div>
          </section>
        )}

        {/* Detailed description */}
        {trial.detailedDescription &&
          trial.detailedDescription !== trial.briefSummary && (
            <section className="mb-10">
              <h2 className="font-display text-display-sm mb-3">
                Detailed description
              </h2>
              <div className="text-base leading-relaxed text-ink-muted whitespace-pre-line">
                {trial.detailedDescription}
              </div>
            </section>
          )}

        {/* Eligibility */}
        {trial.eligibilityCriteria && (
          <section className="mb-10">
            <h2 className="font-display text-display-sm mb-3">
              Who can participate
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4 text-sm">
              <Fact label="Min age">
                {trial.minAgeYears ? `${trial.minAgeYears}+ years` : "No min"}
              </Fact>
              <Fact label="Max age">
                {trial.maxAgeYears ? `${trial.maxAgeYears} years` : "No max"}
              </Fact>
              <Fact label="Sex">
                {trial.sex === "ALL"
                  ? "Any"
                  : trial.sex
                  ? trial.sex.charAt(0) + trial.sex.slice(1).toLowerCase()
                  : "—"}
              </Fact>
              <Fact label="Healthy volunteers">
                {trial.healthyVolunteers ? "Yes" : "No"}
              </Fact>
            </div>
            <div className="bg-paper-sunken border border-rule p-5 text-sm leading-relaxed whitespace-pre-line font-mono">
              {trial.eligibilityCriteria}
            </div>
          </section>
        )}

        {/* Locations */}
        {locationsByCountry.size > 0 && (
          <section className="mb-10">
            <h2 className="font-display text-display-sm mb-4">
              Where this trial is running
            </h2>
            <div className="space-y-5">
              {Array.from(locationsByCountry.entries()).map(([country, locs]) => (
                <div key={country}>
                  <h3 className="text-sm font-medium mb-2">{country}</h3>
                  <ul className="space-y-1.5">
                    {(locs ?? []).slice(0, 20).map((loc, i) => (
                      <li
                        key={`${country}-${i}`}
                        className="text-sm text-ink-muted pl-4 border-l border-rule"
                      >
                        {loc.facility && (
                          <span className="text-ink">{loc.facility}</span>
                        )}
                        {loc.city && (
                          <span className="text-ink-subtle">
                            {loc.facility ? " · " : ""}
                            {loc.city}
                            {loc.state && `, ${loc.state}`}
                          </span>
                        )}
                        {loc.status && (
                          <span className="text-xs ml-2 text-ink-faint">
                            ({loc.status})
                          </span>
                        )}
                      </li>
                    ))}
                    {(locs?.length ?? 0) > 20 && (
                      <li className="text-xs text-ink-subtle pl-4 italic">
                        + {(locs?.length ?? 0) - 20} more locations
                      </li>
                    )}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Contacts */}
        {trial.centralContacts && trial.centralContacts.length > 0 && (
          <section className="mb-10">
            <h2 className="font-display text-display-sm mb-3">Contact</h2>
            <p className="text-sm text-ink-muted mb-4">
              For questions about enrollment, contact the trial team directly:
            </p>
            <ul className="space-y-3">
              {trial.centralContacts.map((c, i) => (
                <li key={i} className="text-sm">
                  {c.name && <div className="font-medium">{c.name}</div>}
                  {c.role && (
                    <div className="text-ink-subtle text-xs">{c.role}</div>
                  )}
                  {c.email && (
                    <a
                      href={`mailto:${c.email}`}
                      className="link-editorial block"
                    >
                      {c.email}
                    </a>
                  )}
                  {c.phone && <div className="font-mono">{c.phone}</div>}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Sponsor */}
        {trial.sponsorName && (
          <section className="mb-10">
            <h2 className="text-[11px] uppercase tracking-[0.15em] text-ink-subtle mb-2">
              Sponsor
            </h2>
            <p className="text-base">
              {trial.sponsorName}
              {trial.sponsorClass && (
                <span className="text-ink-subtle text-sm ml-2">
                  ({trial.sponsorClass.toLowerCase()})
                </span>
              )}
            </p>
            {trial.collaborators && trial.collaborators.length > 0 && (
              <p className="text-sm text-ink-muted mt-1">
                In collaboration with: {trial.collaborators.join(", ")}
              </p>
            )}
          </section>
        )}

        {/* Outcomes */}
        {trial.primaryOutcomes && trial.primaryOutcomes.length > 0 && (
          <section className="mb-10">
            <h2 className="font-display text-display-sm mb-3">
              What this trial measures
            </h2>
            <div className="space-y-4">
              {trial.primaryOutcomes.map((o, i) => (
                <div key={i} className="border-l-2 border-ink pl-4">
                  <div className="text-[11px] uppercase tracking-wider text-ink-subtle mb-1">
                    Primary outcome
                  </div>
                  <div className="text-sm font-medium">{o.measure}</div>
                  {o.timeFrame && (
                    <div className="text-xs text-ink-subtle mt-0.5">
                      Measured at: {o.timeFrame}
                    </div>
                  )}
                  {o.description && (
                    <p className="text-sm text-ink-muted mt-1.5 leading-relaxed">
                      {o.description}
                    </p>
                  )}
                </div>
              ))}
              {trial.secondaryOutcomes &&
                trial.secondaryOutcomes.slice(0, 3).map((o, i) => (
                  <div key={`s-${i}`} className="border-l border-rule pl-4">
                    <div className="text-[11px] uppercase tracking-wider text-ink-subtle mb-1">
                      Secondary
                    </div>
                    <div className="text-sm">{o.measure}</div>
                  </div>
                ))}
            </div>
          </section>
        )}

        {/* Footer / source link */}
        <footer className="border-t border-rule pt-6 mt-10 text-sm text-ink-subtle">
          <p>
            Last updated by source: {formatDate(trial.sourceLastUpdated)}.{" "}
            <a
              href={trial.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="link-editorial"
            >
              View original record
            </a>
            .
          </p>
        </footer>
      </article>
    </>
  );
}

function Fact({
  icon,
  label,
  children,
}: {
  icon?: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-[0.15em] text-ink-subtle mb-1.5 flex items-center gap-1.5">
        {icon}
        {label}
      </div>
      <div className="text-base font-medium">{children}</div>
    </div>
  );
}
