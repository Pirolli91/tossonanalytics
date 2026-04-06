import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Badge } from "@/components/ui/badge";
import {
  FlaskConical,
  MapPin,
  FileBarChart2,
  Building2,
  Droplets,
  CheckCircle,
  ArrowRight,
} from "lucide-react";

const SERVICES = [
  {
    icon: Droplets,
    title: "Municipal Water Assessment",
    badges: ["NC DEQ Aligned", "UCMR 5"],
    accent: "var(--brand-warning)",
    description:
      "End-to-end characterization services for public water systems seeking to satisfy state Emerging Contaminants Study Project requirements under NC DEQ's Division of Water Infrastructure State Revolving Fund.",
    deliverables: [
      "Systematic PFAS sampling at entry points and distribution system",
      "Full 29-compound UCMR 5 panel analysis and reporting",
      "Treatment technology evaluation and cost-benefit analysis",
      "Regulatory compliance gap assessment vs. EPA MCLs",
      "Long-term remediation strategy and SRF funding roadmap",
    ],
  },
  {
    icon: FlaskConical,
    title: "PFAS Remediation Consulting",
    badges: ["PhD-Led", "Peer Reviewed"],
    accent: "#7c3aed",
    description:
      "Applied scientific consulting grounded in Dr. Soneye's peer-reviewed research on PFAS destruction technologies — hydrothermal liquefaction of municipal sludge, GenX advanced oxidation processes, and nanotechnology-driven water treatment.",
    deliverables: [
      "Hydrothermal liquefaction (HTL) feasibility assessment for PFAS-laden biosolids",
      "GenX / ultra-short chain PFAS destruction pathway evaluation",
      "Advanced oxidation process (AOP) design recommendations",
      "Effluent quality modelling and discharge compliance analysis",
      "Research collaboration and co-investigator support for grant applications",
    ],
  },
  {
    icon: FileBarChart2,
    title: "Data Analytics & Visualization",
    badges: ["Live Dashboard", "GeoJSON"],
    accent: "var(--brand-primary)",
    description:
      "Custom data pipelines and interactive choropleth visualizations built on the same infrastructure powering this platform — EPA UCMR 5, USGS WQP, and NC DEQ datasets normalized against regulatory thresholds.",
    deliverables: [
      "Custom interactive PFAS maps for municipal or agency reporting",
      "Automated nightly data ingestion from EPA, USGS, and NC DEQ APIs",
      "Hazard Index and severity scoring for multi-compound exposure",
      "Presentation-ready dashboards for public hearings and council meetings",
      "Data export in GeoJSON, CSV, and Excel formats",
    ],
  },
  {
    icon: Building2,
    title: "Federal & State Contract Support",
    badges: ["HUB Eligible", "NCSBE Pending"],
    accent: "var(--brand-accent)",
    description:
      "Tosson Environmental Analytics holds an active UEI and CAGE code, with HUB eligibility and a pending NCSBE certification. We are positioned for NC DEQ Division of Water Infrastructure SRF contracts and federal environmental consulting vehicles.",
    deliverables: [
      "NAICS 541620 — Environmental Consulting Services",
      "NAICS 541690 — Other Scientific & Technical Consulting",
      "NAICS 541380 — Testing Laboratories & Services",
      "Teaming and subcontracting for prime contractors pursuing PFAS-related SOWs",
      "Expert witness and technical review for regulatory and legal proceedings",
    ],
  },
];

export default function ServicesPage() {
  return (
    <main className="min-h-screen bg-[var(--bg-main)] text-white">
      <Navbar active="services" />

      <div className="mx-auto max-w-5xl px-6 py-12">
        {/* Header */}
        <div className="mb-12">
          <Badge
            className="mb-4 border-0 text-xs"
            style={{ background: "rgba(0,212,170,0.12)", color: "var(--brand-accent)" }}
          >
            HUB Eligible · NCSBE Pending · NAICS 541620 / 541690 / 541380
          </Badge>
          <h1 className="text-3xl font-bold leading-tight lg:text-4xl">
            Services &{" "}
            <span style={{ color: "var(--brand-accent)" }}>Capabilities</span>
          </h1>
          <p className="mt-3 max-w-2xl text-base text-white/55 font-[var(--font-source-sans)] leading-relaxed">
            PhD-led environmental consulting bridging federal contamination data
            with actionable municipal strategy across North Carolina.
          </p>
        </div>

        {/* Service cards */}
        <div className="space-y-6">
          {SERVICES.map((svc) => (
            <div
              key={svc.title}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-7"
            >
              <div className="flex flex-col gap-6 lg:flex-row lg:gap-10">
                <div className="lg:w-64 shrink-0">
                  <svc.icon className="mb-4 h-8 w-8" style={{ color: svc.accent }} />
                  <h2 className="text-lg font-bold leading-snug">{svc.title}</h2>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {svc.badges.map((b) => (
                      <span
                        key={b}
                        className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                        style={{ background: `${svc.accent}20`, color: svc.accent }}
                      >
                        {b}
                      </span>
                    ))}
                  </div>
                  <p className="mt-3 text-sm text-white/50 font-[var(--font-source-sans)] leading-relaxed">
                    {svc.description}
                  </p>
                </div>

                <div className="flex-1 border-t border-white/5 pt-5 lg:border-l lg:border-t-0 lg:pt-0 lg:pl-8">
                  <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-white/30">
                    Deliverables
                  </p>
                  <ul className="space-y-2.5">
                    {svc.deliverables.map((d) => (
                      <li key={d} className="flex items-start gap-2.5">
                        <CheckCircle
                          className="mt-0.5 h-4 w-4 shrink-0"
                          style={{ color: svc.accent }}
                        />
                        <span className="text-sm text-white/65 font-[var(--font-source-sans)]">
                          {d}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div
          className="mt-12 rounded-2xl border border-[var(--brand-accent)]/20 p-8 text-center"
          style={{ background: "rgba(0,212,170,0.04)" }}
        >
          <h2 className="text-xl font-bold">Ready to scope your project?</h2>
          <p className="mt-2 text-sm text-white/50 font-[var(--font-source-sans)]">
            Dr. Soneye responds directly to all initial inquiries. Federal and state procurement
            vehicles welcome.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="mailto:info@tossonanalytics.com"
              className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-opacity hover:opacity-90"
              style={{ background: "var(--brand-accent)", color: "var(--bg-main)" }}
            >
              Contact for Consulting
            </Link>
            <Link
              href="/about#contracting"
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-6 py-3 text-sm font-semibold text-white/70 hover:text-white transition-colors"
            >
              View Credentials <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      <footer className="mt-12 border-t border-white/10 px-6 py-8 text-center text-xs text-white/30">
        <p className="font-semibold text-white/50">Tosson Environmental Analytics LLC</p>
        <p className="mt-1">North Carolina · tossonanalytics.com</p>
      </footer>
    </main>
  );
}
