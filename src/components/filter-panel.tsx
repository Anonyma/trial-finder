"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { ChevronDown, X } from "lucide-react";
import {
  CANCER_TYPES,
  CANCER_GROUPS,
  type CancerGroup,
} from "@/lib/taxonomy/cancer-types";
import {
  MODALITIES,
  MODALITY_GROUPS,
  type ModalityGroup,
} from "@/lib/taxonomy/modalities";
import { cn } from "@/lib/utils";

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

const STATUSES: { value: string; label: string }[] = [
  { value: "recruiting", label: "Recruiting" },
  { value: "not_yet_recruiting", label: "Not yet recruiting" },
  { value: "enrolling_by_invitation", label: "Enrolling by invitation" },
  { value: "active_not_recruiting", label: "Active, not recruiting" },
];

const PHASES = ["PHASE1", "PHASE2", "PHASE3", "PHASE4"];

export function FilterPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const selectedCancers = new Set((searchParams.get("cancer") ?? "").split(",").filter(Boolean));
  const selectedModalities = new Set((searchParams.get("modality") ?? "").split(",").filter(Boolean));
  const selectedStatuses = new Set((searchParams.get("status") ?? "").split(",").filter(Boolean));
  const selectedPhases = new Set((searchParams.get("phase") ?? "").split(",").filter(Boolean));
  const selectedCountries = new Set((searchParams.get("country") ?? "").split(",").filter(Boolean));

  function updateMulti(key: string, values: Set<string>) {
    const params = new URLSearchParams(searchParams.toString());
    if (values.size === 0) {
      params.delete(key);
    } else {
      params.set(key, Array.from(values).join(","));
    }
    params.delete("page");
    startTransition(() => {
      router.push(`/?${params.toString()}`);
    });
  }

  function toggleValue(key: string, set: Set<string>, value: string) {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    updateMulti(key, next);
  }

  function clearAll() {
    startTransition(() => {
      router.push("/");
    });
  }

  const totalSelected =
    selectedCancers.size +
    selectedModalities.size +
    selectedStatuses.size +
    selectedPhases.size +
    selectedCountries.size;

  // Group cancer types by group
  const cancersByGroup: Record<CancerGroup, typeof CANCER_TYPES> = {} as Record<CancerGroup, typeof CANCER_TYPES>;
  for (const ct of CANCER_TYPES) {
    if (!cancersByGroup[ct.group]) cancersByGroup[ct.group] = [];
    cancersByGroup[ct.group].push(ct);
  }

  const modalitiesByGroup: Record<ModalityGroup, typeof MODALITIES> = {} as Record<ModalityGroup, typeof MODALITIES>;
  for (const m of MODALITIES) {
    if (!modalitiesByGroup[m.group]) modalitiesByGroup[m.group] = [];
    modalitiesByGroup[m.group].push(m);
  }

  return (
    <aside className="space-y-1">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs uppercase tracking-[0.15em] text-ink-subtle font-medium">
          Filters
        </h3>
        {totalSelected > 0 && (
          <button
            onClick={clearAll}
            className="text-xs text-accent hover:underline flex items-center gap-1"
          >
            <X size={12} /> Clear all ({totalSelected})
          </button>
        )}
      </div>

      <FilterSection title="Cancer type" defaultOpen>
        <div className="space-y-4">
          {Object.entries(cancersByGroup).map(([group, items]) => (
            <div key={group}>
              <div className="text-[11px] font-medium uppercase tracking-wider text-ink-subtle mb-1.5">
                {CANCER_GROUPS[group as CancerGroup]}
              </div>
              <div className="space-y-1">
                {items.map((ct) => (
                  <CheckboxRow
                    key={ct.id}
                    label={ct.label}
                    checked={selectedCancers.has(ct.id)}
                    onChange={() => toggleValue("cancer", selectedCancers, ct.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Treatment type">
        <div className="space-y-4">
          {Object.entries(modalitiesByGroup).map(([group, items]) => (
            <div key={group}>
              <div className="text-[11px] font-medium uppercase tracking-wider text-ink-subtle mb-1.5">
                {MODALITY_GROUPS[group as ModalityGroup]}
              </div>
              <div className="space-y-1">
                {items.map((m) => (
                  <CheckboxRow
                    key={m.id}
                    label={m.label}
                    checked={selectedModalities.has(m.id)}
                    onChange={() =>
                      toggleValue("modality", selectedModalities, m.id)
                    }
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Status" defaultOpen>
        <div className="space-y-1">
          {STATUSES.map((s) => (
            <CheckboxRow
              key={s.value}
              label={s.label}
              checked={selectedStatuses.has(s.value)}
              onChange={() => toggleValue("status", selectedStatuses, s.value)}
            />
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Phase">
        <div className="space-y-1">
          {PHASES.map((p) => (
            <CheckboxRow
              key={p}
              label={p.replace("PHASE", "Phase ")}
              checked={selectedPhases.has(p)}
              onChange={() => toggleValue("phase", selectedPhases, p)}
            />
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Country">
        <div className="space-y-1">
          {COMMON_COUNTRIES.map((c) => (
            <CheckboxRow
              key={c}
              label={c}
              checked={selectedCountries.has(c)}
              onChange={() => toggleValue("country", selectedCountries, c)}
            />
          ))}
        </div>
      </FilterSection>
    </aside>
  );
}

function FilterSection({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-rule py-3">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between text-left py-1 group"
      >
        <span className="font-display text-base group-hover:text-accent transition-colors">
          {title}
        </span>
        <ChevronDown
          size={16}
          className={cn(
            "text-ink-subtle transition-transform",
            open && "rotate-180"
          )}
        />
      </button>
      {open && <div className="mt-3">{children}</div>}
    </div>
  );
}

function CheckboxRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex items-start gap-2 cursor-pointer text-sm py-0.5 group">
      <span
        className={cn(
          "mt-0.5 inline-flex items-center justify-center w-4 h-4 border shrink-0 transition-colors",
          checked
            ? "bg-ink border-ink"
            : "bg-paper-raised border-rule-strong group-hover:border-ink"
        )}
      >
        {checked && (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path
              d="M2 5L4 7L8 3"
              stroke="#faf8f3"
              strokeWidth="1.5"
              strokeLinecap="square"
            />
          </svg>
        )}
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="sr-only"
      />
      <span
        className={cn(
          "leading-snug",
          checked ? "text-ink" : "text-ink-muted group-hover:text-ink"
        )}
      >
        {label}
      </span>
    </label>
  );
}
