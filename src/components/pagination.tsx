"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function Pagination({
  currentPage,
  totalPages,
}: {
  currentPage: number;
  totalPages: number;
}) {
  const searchParams = useSearchParams();
  if (totalPages <= 1) return null;

  function buildUrl(page: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (page === 1) params.delete("page");
    else params.set("page", String(page));
    return `/?${params.toString()}`;
  }

  // Build a compressed page list: 1 ... current-1 current current+1 ... last
  const pages: (number | "ellipsis")[] = [];
  const window = 1;
  const showPages = new Set<number>([1, totalPages]);
  for (let i = currentPage - window; i <= currentPage + window; i++) {
    if (i >= 1 && i <= totalPages) showPages.add(i);
  }
  const sorted = Array.from(showPages).sort((a, b) => a - b);
  let prev = 0;
  for (const p of sorted) {
    if (p - prev > 1) pages.push("ellipsis");
    pages.push(p);
    prev = p;
  }

  return (
    <nav className="flex items-center justify-center gap-1 mt-12 text-sm">
      <PageLink
        href={buildUrl(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        ariaLabel="Previous page"
      >
        <ChevronLeft size={14} />
      </PageLink>

      {pages.map((p, i) =>
        p === "ellipsis" ? (
          <span key={`ellipsis-${i}`} className="px-2 text-ink-subtle">
            …
          </span>
        ) : (
          <PageLink
            key={p}
            href={buildUrl(p)}
            active={p === currentPage}
            ariaLabel={`Page ${p}`}
          >
            {p}
          </PageLink>
        )
      )}

      <PageLink
        href={buildUrl(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        ariaLabel="Next page"
      >
        <ChevronRight size={14} />
      </PageLink>
    </nav>
  );
}

function PageLink({
  href,
  children,
  active = false,
  disabled = false,
  ariaLabel,
}: {
  href: string;
  children: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
  ariaLabel?: string;
}) {
  if (disabled) {
    return (
      <span
        aria-label={ariaLabel}
        aria-disabled="true"
        className="min-w-[2rem] h-8 inline-flex items-center justify-center text-ink-faint cursor-not-allowed"
      >
        {children}
      </span>
    );
  }
  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      className={cn(
        "min-w-[2rem] h-8 inline-flex items-center justify-center px-2 transition-colors border",
        active
          ? "bg-ink text-paper border-ink"
          : "border-transparent text-ink-muted hover:text-ink hover:border-rule-strong"
      )}
    >
      {children}
    </Link>
  );
}
