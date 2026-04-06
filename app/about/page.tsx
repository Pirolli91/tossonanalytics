import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/Navbar";
import {
  GraduationCap,
  FlaskConical,
  Building2,
  FileText,
  ArrowRight,
  ExternalLink,
} from "lucide-react";

const PUBLICATIONS = [
  {
    title:
      "Spectral Investigation of Alkaline Hydrothermal Liquefaction Products from PFAS-Laden Municipal Sewage Sludge",
    journal: "Environmental Science & Technology",
    year: "2024",
    tags: ["PFAS", "HTL", "Sludge"],
  },
  {
    title:
      "Hydrothermal Liquefaction of Municipal Sewage Sludge: Energy Recovery and Contaminant Fate",
    journal: "Bioresource Technology",
    year: "2023",
    tags: ["HTL", "Energy", "Wastewater"],
  },
  {
    title:
      "Nanotoxicity of Emerging Energy Storage Nanomaterials in Aquatic Systems",
    journal: "NanoImpact",
    year: "2023",
    tags: ["Nanotoxicology", "Nanomaterials"],
  },
  {
    title:
      "GenX and Ultra-Short Chain PFAS Destruction via Advanced Oxidation Processes",
    journal: "Water Research",
    year: "2024",
    tags: ["GenX", "PFAS", "Remediation"],
  },
];

const NAICS = [
  { code: "541620", desc: "Environmental Consulting Services" },
  { code: "541690", desc: "Other Scientific & Technical Consulting" },
  { code: "541380", desc: "Testing Laboratories & Services" },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[var(--bg-main)] text-white">
      <Navbar active="about" />

      <div className="mx-auto max-w-7xl px-6 py-12">

        {/* ── Hero: Photo + Bio ── */}
        <section className="grid gap-10 lg:grid-cols-[340px_1fr] lg:gap-16">

          {/* Photo card */}
          <div className="flex flex-col gap-6">
            <div className="relative overflow-hidden rounded-2xl border border-white/10">
              <Image
                src="/images/dr-soneye.jpg"
                alt="Dr. Temitope D. Soneye"
                width={680}
                height={800}
                className="w-full object-cover object-top"
                style={{ maxHeight: 420 }}
                priority
              />
              {/* Gradient overlay at bottom */}
              <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[var(--bg-main)] to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <p className="text-sm font-bold">Dr. Temitope D. Soneye</p>
                <p className="text-xs text-white/50">PhD · Environmental Nanotechnology</p>
              </div>
            </div>

            {/* Quick-contact */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/40">
                Contact & Engagement
              </p>
              <Link
                href="mailto:temitope.soneye@tossonllc.com"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90"
                style={{ background: "var(--brand-accent)", color: "var(--bg-main)" }}
              >
                Contact for Consulting
              </Link>
              <Link
                href="#contracting"
                className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/20 px-4 py-2.5 text-sm font-semibold text-white/70 hover:text-white transition-colors"
              >
                View Contractor Credentials
              </Link>
            </div>
          </div>

          {/* Bio */}
          <div className="flex flex-col gap-6">
            <div>
              <div className="mb-4 flex flex-wrap gap-2">
                <Badge className="border-0 text-xs" style={{ background: "rgba(0,212,170,0.15)", color: "var(--brand-accent)" }}>
                  PhD — Environmental Nanotechnology
                </Badge>
                <Badge className="border-0 text-xs" style={{ background: "rgba(26,82,118,0.4)", color: "#7ec8e3" }}>
                  NC A&T · JSNN
                </Badge>
                <Badge className="border-0 text-xs" style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }}>
                  Auburn University Affiliate
                </Badge>
              </div>
              <h1 className="text-3xl font-bold leading-tight lg:text-4xl">
                Dr. Temitope<br />
                <span style={{ color: "var(--brand-accent)" }}>Damilotun Soneye</span>
              </h1>
              <p className="mt-1 text-sm text-white/40">
                Founder & Principal Scientist · Tosson Environmental Analytics LLC
              </p>
            </div>

            <div className="space-y-4 text-sm leading-relaxed text-white/65 font-[var(--font-source-sans)]">
              <p>
                Dr. Soneye holds a Doctor of Philosophy from{" "}
                <strong className="text-white/85">
                  North Carolina Agricultural and Technical State University
                </strong>{" "}
                and the{" "}
                <strong className="text-white/85">
                  Joint School of Nanoscience and Nanoengineering (JSNN)
                </strong>
                , complemented by research affiliations with Auburn University.
                His doctoral work sits at the intersection of energy recovery,
                advanced water treatment, and environmental nanotechnology.
              </p>
              <p>
                His published research portfolio establishes deep empirical
                authority in the precise contaminants this platform tracks —
                including pioneering investigations into the{" "}
                <strong className="text-white/85">
                  hydrothermal liquefaction of municipal sewage sludge
                </strong>
                , spectral characterization of PFAS destruction byproducts, and
                the nanotoxicity of emerging energy storage materials in aquatic
                systems.
              </p>
              <p>
                This technical depth positions Tosson Environmental Analytics
                beyond simple data aggregation. The firm operates as an{" "}
                <strong className="text-white/85">
                  elite scientific consultancy
                </strong>{" "}
                capable of interpreting complex molecular contamination data,
                advising municipal governments on remediation strategy, and
                executing sophisticated chemical mitigation protocols —
                particularly for GenX and ultra-short chain PFAS variants
                affecting the Cape Fear River basin.
              </p>
            </div>

            {/* Affiliations */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                { name: "NC A&T State University", role: "PhD Institution", icon: GraduationCap },
                { name: "Joint School of Nanoscience", role: "JSNN — Research", icon: FlaskConical },
                { name: "Auburn University", role: "Research Affiliate", icon: GraduationCap },
              ].map(({ name, role, icon: Icon }) => (
                <div
                  key={name}
                  className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4"
                >
                  <Icon className="mt-0.5 h-5 w-5 shrink-0" style={{ color: "var(--brand-accent)" }} />
                  <div>
                    <p className="text-xs font-bold text-white/85 leading-snug">{name}</p>
                    <p className="text-[11px] text-white/40">{role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Research Publications ── */}
        <section className="mt-16">
          <div className="mb-6 flex items-center gap-3">
            <FileText className="h-6 w-6" style={{ color: "var(--brand-accent)" }} />
            <h2 className="text-xl font-bold">Selected Publications</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {PUBLICATIONS.map((pub) => (
              <div
                key={pub.title}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
              >
                <p className="text-sm font-semibold text-white/90 leading-snug">
                  {pub.title}
                </p>
                <p className="mt-2 text-xs text-white/40">
                  {pub.journal} · {pub.year}
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {pub.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                      style={{ background: "rgba(0,212,170,0.1)", color: "var(--brand-accent)" }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Contractor Credentials ── */}
        <section id="contracting" className="mt-16 scroll-mt-20">
          <div className="mb-6 flex items-center gap-3">
            <Building2 className="h-6 w-6" style={{ color: "var(--brand-accent)" }} />
            <h2 className="text-xl font-bold">Federal & State Contractor Credentials</h2>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Federal identifiers */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <h3 className="mb-4 text-sm font-bold text-white/70 uppercase tracking-wider">
                Federal Identifiers
              </h3>
              <dl className="space-y-4">
                {[
                  { term: "Unique Entity ID (UEI)", detail: "Active — SAM.gov registered", status: "active" },
                  { term: "CAGE Code", detail: "Active — federal procurement ready", status: "active" },
                  { term: "SAM.gov Registration", detail: "Current — annual renewal maintained", status: "active" },
                ].map(({ term, detail, status }) => (
                  <div key={term} className="flex items-start justify-between gap-4 border-b border-white/5 pb-4 last:border-0 last:pb-0">
                    <dt className="text-sm font-semibold text-white/80">{term}</dt>
                    <dd className="text-right">
                      <span
                        className="inline-block rounded-full px-2 py-0.5 text-[10px] font-bold"
                        style={{ background: status === "active" ? "rgba(39,174,96,0.2)" : "rgba(243,156,18,0.2)", color: status === "active" ? "#27ae60" : "#f39c12" }}
                      >
                        {status === "active" ? "Active" : "Pending"}
                      </span>
                      <p className="mt-0.5 text-xs text-white/40">{detail}</p>
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* NC State certifications */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <h3 className="mb-4 text-sm font-bold text-white/70 uppercase tracking-wider">
                NC State Certifications
              </h3>
              <dl className="space-y-4">
                {[
                  { term: "HUB Status", detail: "NC DOA Historically Underutilized Business — eligible track", status: "active" },
                  { term: "NCSBE Certification", detail: "NC Small Business Enterprise — application submitted, ≤90-day review via eVP", status: "pending" },
                  { term: "SWUC", detail: "Statewide Uniform Certification — in review", status: "pending" },
                ].map(({ term, detail, status }) => (
                  <div key={term} className="flex items-start justify-between gap-4 border-b border-white/5 pb-4 last:border-0 last:pb-0">
                    <dt className="text-sm font-semibold text-white/80">{term}</dt>
                    <dd className="text-right">
                      <span
                        className="inline-block rounded-full px-2 py-0.5 text-[10px] font-bold"
                        style={{ background: status === "active" ? "rgba(39,174,96,0.2)" : "rgba(243,156,18,0.2)", color: status === "active" ? "#27ae60" : "#f39c12" }}
                      >
                        {status === "active" ? "Eligible" : "Pending"}
                      </span>
                      <p className="mt-0.5 text-xs text-white/40">{detail}</p>
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* NAICS codes */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 lg:col-span-2">
              <h3 className="mb-4 text-sm font-bold text-white/70 uppercase tracking-wider">
                NAICS Classification Codes
              </h3>
              <div className="grid gap-3 sm:grid-cols-3">
                {NAICS.map(({ code, desc }) => (
                  <div
                    key={code}
                    className="rounded-xl border border-white/10 bg-white/[0.04] p-4"
                  >
                    <p className="text-lg font-bold tabular-nums" style={{ color: "var(--brand-accent)" }}>
                      {code}
                    </p>
                    <p className="mt-1 text-xs text-white/55">{desc}</p>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-xs text-white/30 font-[var(--font-source-sans)]">
                NCSBE eligibility criteria: NC-headquartered, ≤100 employees, for-profit,
                annual net income ≤$1,500,000 after COGS. Eligible for NC DEQ Division of
                Water Infrastructure State Revolving Fund — Emerging Contaminants Study
                Projects (rolling 2026 funding rounds).
              </p>
            </div>
          </div>
        </section>

      </div>

      {/* Footer */}
      <footer className="mt-16 border-t border-white/10 px-6 py-8 text-center text-xs text-white/30">
        <p className="font-semibold text-white/50">Tosson Environmental Analytics LLC</p>
        <p className="mt-1">North Carolina · tossonanalytics.com</p>
      </footer>
    </main>
  );
}
