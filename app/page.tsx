import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { StatsCounter } from "@/components/home/StatsCounter";
import {
  FlaskConical,
  MapPin,
  FileBarChart2,
  ShieldCheck,
  BookOpen,
  ArrowRight,
  Building2,
  Droplets,
} from "lucide-react";

// ─── Service cards data ────────────────────────────────────────────────────────
const SERVICES = [
  {
    icon: Building2,
    title: "Federal & State Contracting",
    badges: ["HUB Eligible", "NCSBE Pending"],
    description:
      "Active UEI & CAGE identifiers. NAICS 541620, 541690, 541380. Positioned for NC DEQ Division of Water Infrastructure State Revolving Fund contracts.",
    href: "/about#contracting",
    accent: "var(--brand-accent)",
  },
  {
    icon: FileBarChart2,
    title: "Data Analytics & Visualization",
    badges: ["Live Dashboard", "GeoJSON"],
    description:
      "Interactive choropleth maps of PFAS contamination across all 100 NC counties, normalized against EPA Maximum Contaminant Levels.",
    href: "/dashboard",
    accent: "var(--brand-primary)",
  },
  {
    icon: FlaskConical,
    title: "PFAS Remediation Research",
    badges: ["PhD-Led", "Peer Reviewed"],
    description:
      "Hydrothermal liquefaction of municipal sludge, GenX destruction technologies, and nanotechnology-driven water treatment solutions.",
    href: "/about#research",
    accent: "#7c3aed",
  },
  {
    icon: Droplets,
    title: "Municipal Water Assessment",
    badges: ["NC DEQ Aligned", "UCMR 5"],
    description:
      "End-to-end characterization services for public water systems seeking to satisfy state Emerging Contaminants Study Project requirements.",
    href: "/services",
    accent: "var(--brand-warning)",
  },
];

// ─── Regulatory alert banner ───────────────────────────────────────────────────
const ALERT = {
  label: "Regulatory Update — March 2026",
  body: "NC Environmental Management Commission initiates public hearings on proposed rules 15A NCAC 02b.0512 and 02H.0923, requiring industrial facilities and municipal WWTPs to monitor for 1,4-dioxane, PFOA, PFOS, and GenX.",
  href: "/insights/nc-emc-hearings-march-2026",
};

export default function Home() {
  return (
    <main className="min-h-screen bg-[var(--bg-main)] text-white">
      {/* ── Nav ── */}
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-[var(--bg-main)]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <Droplets
              className="h-6 w-6"
              style={{ color: "var(--brand-accent)" }}
            />
            <span className="text-lg font-bold tracking-tight">
              Tosson<span style={{ color: "var(--brand-accent)" }}>Analytics</span>
            </span>
          </Link>
          <div className="hidden items-center gap-6 text-sm font-medium text-white/70 sm:flex">
            <Link href="/dashboard" className="hover:text-white transition-colors">
              Dashboard
            </Link>
            <Link href="/about" className="hover:text-white transition-colors">
              About
            </Link>
            <Link href="/insights" className="hover:text-white transition-colors">
              Insights
            </Link>
            <Link
              href="/about#contracting"
              className="rounded-lg px-4 py-2 text-sm font-semibold transition-colors"
              style={{
                background: "var(--brand-accent)",
                color: "var(--bg-main)",
              }}
            >
              Work With Us
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Regulatory alert strip ── */}
      <div
        className="border-b border-[var(--brand-warning)]/30 px-6 py-2 text-center text-xs"
        style={{ background: "rgba(243,156,18,0.08)", color: "var(--brand-warning)" }}
      >
        <strong>{ALERT.label}:</strong>{" "}
        <Link href={ALERT.href} className="underline underline-offset-2">
          {ALERT.body}
        </Link>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-10">
        {/* ════ BENTO GRID ════════════════════════════════════════════════════ */}
        <div className="grid auto-rows-auto grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">

          {/* ── [1] Hero card — spans 2 cols ── */}
          <div className="relative col-span-1 overflow-hidden rounded-2xl md:col-span-2 lg:col-span-2">
            {/* Background gradient */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(135deg, var(--brand-primary) 0%, #162d4a 60%, var(--bg-main) 100%)",
              }}
            />
            {/* Glassmorphism overlay */}
            <div className="absolute inset-0 backdrop-blur-[1px] bg-white/5" />
            {/* Content */}
            <div className="relative z-10 flex flex-col justify-between gap-8 p-8 min-h-[320px]">
              <div>
                <div className="mb-4 flex flex-wrap gap-2">
                  <Badge
                    className="border-0 text-xs font-semibold"
                    style={{ background: "rgba(0,212,170,0.15)", color: "var(--brand-accent)" }}
                  >
                    HUB Eligible
                  </Badge>
                  <Badge
                    className="border-0 text-xs font-semibold"
                    style={{ background: "rgba(243,156,18,0.15)", color: "var(--brand-warning)" }}
                  >
                    NCSBE Application Pending
                  </Badge>
                  <Badge
                    className="border-0 text-xs font-semibold"
                    style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)" }}
                  >
                    NAICS 541620 · 541690 · 541380
                  </Badge>
                </div>
                <h1 className="text-3xl font-bold leading-tight tracking-tight lg:text-4xl">
                  North Carolina&apos;s PFAS{" "}
                  <span style={{ color: "var(--brand-accent)" }}>
                    Intelligence Platform
                  </span>
                </h1>
                <p className="mt-3 max-w-lg text-base text-white/65 font-[var(--font-source-sans)]">
                  Live contamination dashboards, regulatory intelligence, and
                  PhD-led remediation consulting — bridging federal data with
                  municipal action across all 100 NC counties.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90"
                  style={{ background: "var(--brand-accent)", color: "var(--bg-main)" }}
                >
                  <MapPin className="h-4 w-4" />
                  View Live Dashboard
                </Link>
                <Link
                  href="/about"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-5 py-2.5 text-sm font-semibold text-white/80 backdrop-blur-sm transition-colors hover:border-white/40 hover:text-white"
                >
                  About Dr. Soneye
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>

          {/* ── [2] Credentials card — 1 col ── */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <ShieldCheck
              className="mb-4 h-8 w-8"
              style={{ color: "var(--brand-accent)" }}
            />
            <h2 className="text-lg font-bold">Contractor Credentials</h2>
            <p className="mt-1 text-xs text-white/50 font-[var(--font-source-sans)]">
              Verified federal & state identifiers
            </p>
            <dl className="mt-4 space-y-3 text-sm">
              {[
                { term: "UEI", detail: "Active — SAM.gov registered" },
                { term: "CAGE Code", detail: "Active — federal procurement ready" },
                { term: "HUB Status", detail: "Eligible — NC DOA certified track" },
                { term: "NCSBE", detail: "Application pending (≤90-day review)" },
                { term: "eVP Portal", detail: "Registered — SWUC in review" },
              ].map(({ term, detail }) => (
                <div key={term} className="flex items-start justify-between gap-2">
                  <dt className="font-semibold text-white/80 shrink-0">{term}</dt>
                  <dd className="text-right text-white/50 text-xs">{detail}</dd>
                </div>
              ))}
            </dl>
            <Link
              href="/about#contracting"
              className="mt-5 inline-flex items-center gap-1 text-xs font-semibold"
              style={{ color: "var(--brand-accent)" }}
            >
              Full credentials <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {/* ── [3] Stats counter — full width ── */}
          <div className="col-span-1 md:col-span-2 lg:col-span-3">
            <StatsCounter />
          </div>

          {/* ── [4] Service cards — 2 per row on md, each 1 col ── */}
          {SERVICES.map((svc) => (
            <Link
              key={svc.title}
              href={svc.href}
              className="group rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-all hover:border-white/20 hover:bg-white/[0.06]"
            >
              <svc.icon
                className="mb-4 h-7 w-7 transition-transform group-hover:scale-110"
                style={{ color: svc.accent }}
              />
              <h3 className="text-base font-bold">{svc.title}</h3>
              <div className="mt-2 flex flex-wrap gap-1">
                {svc.badges.map((b) => (
                  <span
                    key={b}
                    className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                    style={{
                      background: `${svc.accent}20`,
                      color: svc.accent,
                    }}
                  >
                    {b}
                  </span>
                ))}
              </div>
              <p className="mt-3 text-sm text-white/55 font-[var(--font-source-sans)] leading-relaxed">
                {svc.description}
              </p>
              <span
                className="mt-4 inline-flex items-center gap-1 text-xs font-semibold"
                style={{ color: svc.accent }}
              >
                Learn more <ArrowRight className="h-3 w-3" />
              </span>
            </Link>
          ))}

          {/* ── [5] Map teaser card — spans 2 cols ── */}
          <div
            className="relative col-span-1 overflow-hidden rounded-2xl border border-white/10 md:col-span-2"
            style={{ minHeight: 200 }}
          >
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(135deg, #162d4a 0%, #0e1b30 100%)",
              }}
            />
            <div className="relative z-10 flex h-full flex-col justify-between p-8">
              <div>
                <MapPin
                  className="mb-3 h-7 w-7"
                  style={{ color: "var(--brand-accent)" }}
                />
                <h2 className="text-xl font-bold">
                  Live PFAS Dashboard — North Carolina
                </h2>
                <p className="mt-2 text-sm text-white/55 font-[var(--font-source-sans)]">
                  Interactive choropleth map updated nightly from USGS WQP,
                  EPA UCMR 5, and NC DEQ datasets. Severity scores normalized
                  against 4.0 ppt MCL thresholds.
                </p>
              </div>
              <Link
                href="/dashboard"
                className="mt-6 inline-flex w-fit items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold"
                style={{ background: "var(--brand-primary)", color: "#fff" }}
              >
                Open Dashboard <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* ── [6] Insights card — 1 col ── */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <BookOpen
              className="mb-4 h-7 w-7"
              style={{ color: "var(--brand-warning)" }}
            />
            <h2 className="text-base font-bold">Latest Insights</h2>
            <div className="mt-4 space-y-4">
              {[
                {
                  date: "Mar 2026",
                  title: "NC EMC Initiates Hearings on PFOA, PFOS & GenX Rules",
                  href: "/insights/nc-emc-hearings-march-2026",
                },
                {
                  date: "Mar 2026",
                  title: "Cape Fear TFA Levels Reach 2,000 ppt Near Chemours",
                  href: "/insights",
                },
                {
                  date: "Feb 2026",
                  title: "NC HB 881: PFAS Free NC Act — What It Means",
                  href: "/insights",
                },
              ].map((post) => (
                <Link
                  key={post.title}
                  href={post.href}
                  className="block group"
                >
                  <span className="text-[10px] text-white/40">{post.date}</span>
                  <p className="mt-0.5 text-sm font-medium text-white/80 group-hover:text-white transition-colors leading-snug">
                    {post.title}
                  </p>
                </Link>
              ))}
            </div>
            <Link
              href="/insights"
              className="mt-5 inline-flex items-center gap-1 text-xs font-semibold"
              style={{ color: "var(--brand-warning)" }}
            >
              All insights <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

        </div>

        {/* ── Footer ── */}
        <footer className="mt-16 border-t border-white/10 pt-8 pb-4">
          <div className="flex flex-col items-center gap-2 text-center text-xs text-white/30">
            <p className="font-semibold text-white/50">
              Tosson Environmental Analytics LLC
            </p>
            <p>
              Dr. Temitope D. Soneye, PhD — NC A&T / Joint School of
              Nanoscience & Nanoengineering
            </p>
            <p>tossonanalytics.com · North Carolina, USA</p>
          </div>
        </footer>
      </div>
    </main>
  );
}
