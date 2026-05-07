import Link from "next/link";

export function DisclaimerBanner() {
  return (
    <div className="border-y border-rule bg-paper-sunken">
      <div className="container py-3 text-xs text-ink-muted leading-relaxed flex items-start gap-3">
        <span className="text-accent mt-0.5 shrink-0">•</span>
        <p>
          <strong className="text-ink font-medium">
            This is not medical advice.
          </strong>{" "}
          Information here comes from public clinical trial registries and may
          be incomplete, out of date, or contain errors. Always consult your
          oncologist or a qualified clinician before making any treatment
          decisions or contacting a trial site.{" "}
          <Link href="/about#disclaimer" className="link-editorial">
            Read the full disclaimer
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
