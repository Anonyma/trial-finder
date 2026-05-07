import type { Metadata } from "next";
import { Fraunces, Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  axes: ["opsz", "SOFT", "WONK"],
});

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Trial Finder — Find a Cancer Clinical Trial",
  description:
    "A free, independent search tool for cancer clinical trials worldwide. Filter by cancer type, treatment, and location. Updated daily.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  ),
  openGraph: {
    title: "Trial Finder",
    description:
      "Find a cancer clinical trial. Free, independent, updated daily.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${geist.variable} ${geistMono.variable}`}
    >
      <body className="min-h-screen flex flex-col">
        <header className="border-b border-rule bg-paper relative z-10">
          <div className="container flex items-center justify-between py-5">
            <Link href="/" className="flex items-baseline gap-2 group">
              <span className="wordmark text-2xl">Trial Finder</span>
              <span className="text-[10px] uppercase tracking-[0.2em] text-ink-subtle group-hover:text-accent transition-colors">
                / Cancer
              </span>
            </Link>
            <nav className="flex items-center gap-8 text-sm">
              <Link href="/" className="link-editorial">
                Browse
              </Link>
              <Link href="/match" className="link-editorial">
                Find a match
              </Link>
              <Link href="/about" className="link-editorial">
                About
              </Link>
            </nav>
          </div>
        </header>

        <main className="flex-1 relative z-10">{children}</main>

        <footer className="border-t border-rule bg-paper-sunken relative z-10 mt-24">
          <div className="container py-12 grid md:grid-cols-3 gap-12">
            <div>
              <div className="wordmark text-xl mb-3">Trial Finder</div>
              <p className="text-sm text-ink-muted leading-relaxed max-w-prose">
                A free, independent search tool for cancer clinical trials worldwide.
                Information is aggregated from public registries and updated daily.
                Not a substitute for medical advice.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-3 uppercase tracking-wider text-ink-subtle">
                Sources
              </h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a
                    href="https://clinicaltrials.gov"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link-editorial"
                  >
                    ClinicalTrials.gov
                  </a>
                </li>
                <li>
                  <a
                    href="https://trialsearch.who.int"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link-editorial"
                  >
                    WHO ICTRP
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.anzctr.org.au"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link-editorial"
                  >
                    ANZCTR (Australia/NZ)
                  </a>
                </li>
                <li>
                  <a
                    href="http://www.chictr.org.cn"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link-editorial"
                  >
                    ChiCTR (China)
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-3 uppercase tracking-wider text-ink-subtle">
                Important
              </h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/about#disclaimer" className="link-editorial">
                    Medical disclaimer
                  </Link>
                </li>
                <li>
                  <Link href="/about" className="link-editorial">
                    How this works
                  </Link>
                </li>
                <li>
                  <Link href="/about#privacy" className="link-editorial">
                    Privacy
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-rule">
            <div className="container py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-ink-subtle">
              <span>
                Designed by{" "}
                <a
                  href="https://popvax.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-editorial"
                >
                  PopVax
                </a>
              </span>
              <span className="font-mono text-[10px]">
                Updated daily · No accounts · No tracking
              </span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
