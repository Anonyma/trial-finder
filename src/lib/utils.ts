import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(input: string | Date | null | undefined): string {
  if (!input) return "—";
  const d = typeof input === "string" ? new Date(input) : input;
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatPhase(phase: string | null | undefined): string {
  if (!phase) return "—";
  return phase
    .replace(/PHASE/gi, "Phase ")
    .replace(/_/g, "/")
    .replace(/\s+/g, " ")
    .replace(/Phase NA/gi, "Not Applicable")
    .trim();
}

export function formatStatus(status: string): {
  label: string;
  color: string;
} {
  const map: Record<string, { label: string; color: string }> = {
    recruiting: { label: "Recruiting", color: "text-recruiting" },
    not_yet_recruiting: { label: "Not Yet Recruiting", color: "text-not-yet" },
    enrolling_by_invitation: {
      label: "Enrolling by Invitation",
      color: "text-not-yet",
    },
    active_not_recruiting: {
      label: "Active (Not Recruiting)",
      color: "text-completed",
    },
    completed: { label: "Completed", color: "text-completed" },
    suspended: { label: "Suspended", color: "text-warning" },
    terminated: { label: "Terminated", color: "text-warning" },
    withdrawn: { label: "Withdrawn", color: "text-warning" },
    unknown: { label: "Unknown", color: "text-ink-subtle" },
  };
  return map[status] ?? { label: status, color: "text-ink-subtle" };
}

export function pluralize(n: number, singular: string, plural?: string): string {
  return n === 1 ? `${n} ${singular}` : `${n} ${plural ?? singular + "s"}`;
}
