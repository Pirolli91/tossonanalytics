"use client";

import { useState, useEffect } from "react";
import { Bell, ExternalLink, Mail, CheckCircle, AlertCircle, Bookmark, ChevronRight, Hash, Clock } from "lucide-react";

interface Props {
  digestHtml: string;
  digestTitle: string;
}

export function RegulatoryWatchClient({ digestHtml, digestTitle }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [activeSection, setActiveSection] = useState("");

  // Table of Contents logic
  const sections = [
    { id: "public-comment", label: "Public Comment" },
    { id: "regulatory-actions", label: "Regulatory Actions" },
    { id: "energy", label: "Energy & Infrastructure" },
    { id: "litigation", label: "Litigation & Enforcement" },
  ];

  // Helper to scroll to section
  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const offset = 100;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = el.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
      setActiveSection(id);
    }
  };

  async function handleSubscribe(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim() }),
      });
      if (res.ok) {
        setStatus("success");
        setMessage("You're on the list! We'll send alerts when key deadlines approach.");
        setName("");
        setEmail("");
      } else {
        const data = await res.json().catch(() => ({}));
        setStatus("error");
        setMessage((data as { error?: string }).error ?? "Something went wrong. Please try again.");
      }
    } catch {
      setStatus("error");
      setMessage("Network error — please try again.");
    }
  }

  return (
    <>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden border-b border-white/5 bg-white/[0.01] px-6 py-20 sm:py-24">
        <div
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(circle at 50% -20%, rgba(16,185,129,0.1) 0%, transparent 50%)",
          }}
        />
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col items-center text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--brand-accent)]/20 bg-[var(--brand-accent)]/5 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--brand-accent)]">
              <Clock className="h-3 w-3" />
              Daily Intelligence Briefing
            </div>
            <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-6xl">
              NC Regulatory <span className="text-[var(--brand-accent)]">Watch</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-white/50 leading-relaxed">
              Consolidated, PhD-level monitoring of North Carolina’s environmental and energy landscape. 
              We track the DEQ, EMC, and NCUC so you can focus on compliance and strategy.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <a
                href="https://temitopesoneye.substack.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand-accent)] px-8 py-4 text-sm font-bold text-[var(--bg-main)] transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                Join 500+ Stakeholders
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Main content + sidebar ── */}
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-12 lg:grid-cols-[240px_1fr_340px]">

          {/* ── Left Nav (TOC) ── */}
          <nav className="hidden lg:block sticky top-24 self-start">
            <p className="mb-6 text-[10px] font-bold uppercase tracking-widest text-white/30">Intelligence Sections</p>
            <div className="flex flex-col gap-1">
              {sections.map((s) => (
                <button
                  key={s.id}
                  onClick={() => scrollTo(s.id)}
                  className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all ${
                    activeSection === s.id 
                      ? "bg-[var(--brand-accent)]/10 text-[var(--brand-accent)]" 
                      : "text-white/40 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Hash className={`h-4 w-4 ${activeSection === s.id ? "opacity-100" : "opacity-30"}`} />
                  {s.label}
                </button>
              ))}
            </div>
          </nav>

          {/* ── Digest ── */}
          <article className="min-w-0">
            <div className="mb-10 border-b border-white/5 pb-10">
              <h2 className="text-3xl font-bold text-white mb-2">{digestTitle}</h2>
              <div className="flex items-center gap-4 text-sm text-white/40 font-medium">
                <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> Updated {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric'})}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-white/10" />
                <span className="flex items-center gap-1.5"><Bookmark className="h-4 w-4" /> 10+ Sources Monitored</span>
              </div>
            </div>

            <div
              className="regulatory-briefing-ui"
              dangerouslySetInnerHTML={{ __html: digestHtml }}
            />
            
            {/* Legend / Methodology */}
            <div className="mt-16 rounded-2xl border border-white/5 bg-white/[0.02] p-8">
              <h3 className="mb-4 text-sm font-bold uppercase tracking-widest text-white/80 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-[var(--brand-accent)]" />
                Analyst Methodology
              </h3>
              <p className="text-sm text-white/40 leading-relaxed">
                Items are curated daily using a proprietary intelligence pipeline targeting high-value NC sources including the NCGA, Haw River Assembly, and NC DEQ. Summaries are synthesized by our AI analyst and verified for strategic relevance to municipal water utilities and environmental consultants.
              </p>
            </div>
          </article>

          {/* ── Sidebar ── */}
          <aside className="flex flex-col gap-8">

            {/* Email Signup Card */}
            <div className="group rounded-2xl border border-white/10 bg-white/[0.03] p-8 transition-colors hover:border-[var(--brand-accent)]/30">
              <div className="mb-6 flex items-center gap-3">
                <div className="rounded-xl bg-[var(--brand-accent)]/10 p-3">
                  <Mail className="h-6 w-6 text-[var(--brand-accent)]" />
                </div>
                <h3 className="text-lg font-bold text-white leading-tight">Executive Briefing</h3>
              </div>
              <p className="mb-6 text-sm text-white/50 leading-relaxed">
                Get alerted the moment key comment deadlines approach or enforcement orders are issued.
              </p>

              {status === "success" ? (
                <div className="flex items-start gap-3 rounded-xl border border-[var(--brand-safe)]/20 bg-[var(--brand-safe)]/5 p-4">
                  <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--brand-safe)]" />
                  <p className="text-sm text-[var(--brand-safe)]/80 leading-snug">{message}</p>
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="flex flex-col gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="reg-name" className="px-1 text-[10px] font-bold uppercase tracking-widest text-white/30">Name</label>
                    <input
                      id="reg-name"
                      type="text"
                      placeholder="e.g. Director, Water Resources"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-xl border border-white/5 bg-white/5 px-4 py-3 text-sm text-white outline-none transition-all focus:bg-white/10 focus:ring-1 focus:ring-[var(--brand-accent)]/50"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="reg-email" className="px-1 text-[10px] font-bold uppercase tracking-widest text-white/30">Business Email</label>
                    <input
                      id="reg-email"
                      type="email"
                      placeholder="name@agency.gov"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full rounded-xl border border-white/5 bg-white/5 px-4 py-3 text-sm text-white outline-none transition-all focus:bg-white/10 focus:ring-1 focus:ring-[var(--brand-accent)]/50"
                    />
                  </div>

                  {status === "error" && (
                    <div className="flex items-start gap-2 rounded-lg bg-[var(--brand-alert)]/10 p-3">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--brand-alert)]" />
                      <p className="text-xs text-[var(--brand-alert)]/90">{message}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={status === "loading"}
                    className="mt-2 w-full rounded-xl bg-[var(--brand-accent)] py-3.5 text-sm font-bold text-[var(--bg-main)] transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
                  >
                    {status === "loading" ? "Processing..." : "Secure My Alerts"}
                  </button>
                </form>
              )}
            </div>

            {/* Substack Promotion */}
            <div className="rounded-2xl border border-[var(--brand-accent)]/20 bg-gradient-to-br from-[var(--brand-accent)]/10 to-transparent p-8">
              <h3 className="text-lg font-bold text-white mb-3">Professional Newsletter</h3>
              <p className="text-sm text-white/60 leading-relaxed mb-6">
                Dr. Soneye’s curated weekly roundup delivered every Monday morning. Join the inner circle of NC environmental leaders.
              </p>
              <a
                href="https://temitopesoneye.substack.com"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2 text-sm font-bold text-[var(--brand-accent)] hover:underline"
              >
                Go to Substack
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </a>
            </div>

            {/* Agency Monitor List */}
            <div className="rounded-2xl border border-white/5 bg-white/[0.01] p-8">
              <h3 className="mb-6 text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">Active Agency Monitor</h3>
              <div className="space-y-4">
                {[
                  { label: "NC DEQ (Primary)", url: "https://deq.nc.gov" },
                  { label: "Environmental Management Comm.", url: "https://deq.nc.gov/about/divisions/water-resources/emc" },
                  { label: "NC Utilities Commission", url: "https://www.ncuc.gov" },
                  { label: "EPA Region 4", url: "https://www.epa.gov/aboutepa/epa-region-4-southeast" },
                  { label: "EPA PFAS Program", url: "https://www.epa.gov/pfas" },
                ].map(({ label, url }) => (
                  <a
                    key={label}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between group"
                  >
                    <span className="text-sm text-white/50 transition-colors group-hover:text-white">{label}</span>
                    <ExternalLink className="h-3.5 w-3.5 text-white/20 group-hover:text-[var(--brand-accent)]" />
                  </a>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
