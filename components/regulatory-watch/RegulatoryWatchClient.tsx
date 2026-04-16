"use client";

import { useState } from "react";
import { Bell, ExternalLink, Mail, CheckCircle, AlertCircle } from "lucide-react";

interface Props {
  digestHtml: string;
  digestTitle: string;
}

export function RegulatoryWatchClient({ digestHtml, digestTitle }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

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
      <section className="relative overflow-hidden border-b border-white/10 px-6 py-16 sm:py-20">
        <div
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(0,212,170,0.08) 0%, transparent 70%)",
          }}
        />
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[var(--brand-accent)]/30 bg-[var(--brand-accent)]/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[var(--brand-accent)]">
            <Bell className="h-3 w-3" />
            Daily Digest
          </div>
          <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
            NC Environmental &amp; Energy
            <br />
            <span style={{ color: "var(--brand-accent)" }}>Regulatory Watch</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-white/60 sm:text-lg">
            Daily monitoring of NC DEQ, EMC, NCUC, and EPA actions affecting North Carolina —
            public comment windows, rulemaking, enforcement actions, and energy filings.
          </p>
          <a
            href="https://tossonenvironmental.substack.com"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold transition-opacity hover:opacity-90"
            style={{ background: "var(--brand-accent)", color: "var(--bg-main)" }}
          >
            Subscribe to Weekly Newsletter
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </section>

      {/* ── Main content + sidebar ── */}
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid gap-10 lg:grid-cols-[1fr_320px] lg:gap-12 xl:grid-cols-[1fr_360px]">

          {/* ── Digest ── */}
          <article>
            <header className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white/90 sm:text-2xl">{digestTitle}</h2>
                <p className="mt-1 text-sm text-white/40">Updated daily by the Regulatory Intelligence Team</p>
              </div>
            </header>

            <div
              className="regulatory-digest prose"
              dangerouslySetInnerHTML={{ __html: digestHtml }}
            />
          </article>

          {/* ── Sidebar ── */}
          <aside className="flex flex-col gap-6">

            {/* Email Signup Card */}
            <div
              className="rounded-xl border border-white/10 p-6"
              style={{ background: "var(--bg-card)" }}
            >
              <div className="mb-4 flex items-center gap-2">
                <Mail className="h-5 w-5" style={{ color: "var(--brand-accent)" }} />
                <h3 className="font-semibold text-white">Get Alerts in Your Inbox</h3>
              </div>
              <p className="mb-5 text-sm text-white/60 leading-relaxed">
                Receive email alerts when key comment deadlines approach, rulemaking actions drop,
                or enforcement orders are issued.
              </p>

              {status === "success" ? (
                <div className="flex items-start gap-3 rounded-lg border border-[var(--brand-safe)]/30 bg-[var(--brand-safe)]/10 p-4">
                  <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--brand-safe)]" />
                  <p className="text-sm text-[var(--brand-safe)]">{message}</p>
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="flex flex-col gap-3">
                  <div>
                    <label htmlFor="reg-name" className="mb-1.5 block text-xs font-medium text-white/50">
                      Name
                    </label>
                    <input
                      id="reg-name"
                      type="text"
                      placeholder="Your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/30 outline-none transition-colors focus:border-[var(--brand-accent)]/60 focus:bg-white/8"
                    />
                  </div>
                  <div>
                    <label htmlFor="reg-email" className="mb-1.5 block text-xs font-medium text-white/50">
                      Email <span className="text-[var(--brand-accent)]">*</span>
                    </label>
                    <input
                      id="reg-email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/30 outline-none transition-colors focus:border-[var(--brand-accent)]/60 focus:bg-white/8"
                    />
                  </div>

                  {status === "error" && (
                    <div className="flex items-start gap-2 rounded-lg border border-[var(--brand-alert)]/30 bg-[var(--brand-alert)]/10 p-3">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--brand-alert)]" />
                      <p className="text-xs text-[var(--brand-alert)]">{message}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={status === "loading"}
                    className="mt-1 w-full rounded-lg px-4 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
                    style={{ background: "var(--brand-accent)", color: "var(--bg-main)" }}
                  >
                    {status === "loading" ? "Subscribing…" : "Subscribe for Alerts"}
                  </button>
                </form>
              )}
            </div>

            {/* Newsletter CTA */}
            <div
              className="rounded-xl border border-[var(--brand-accent)]/20 p-6"
              style={{ background: "rgba(0,212,170,0.05)" }}
            >
              <h3 className="font-semibold text-white">Weekly Newsletter</h3>
              <p className="mt-2 mb-4 text-sm text-white/60 leading-relaxed">
                Get a curated weekly roundup of NC environmental and energy regulatory
                developments delivered to your inbox every Monday.
              </p>
              <a
                href="https://tossonenvironmental.substack.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--brand-accent)]/40 px-4 py-2.5 text-sm font-semibold text-[var(--brand-accent)] transition-colors hover:bg-[var(--brand-accent)]/10"
              >
                Subscribe on Substack
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>

            {/* Key Agencies */}
            <div
              className="rounded-xl border border-white/10 p-6"
              style={{ background: "var(--bg-card)" }}
            >
              <h3 className="mb-4 font-semibold text-white">Agencies We Monitor</h3>
              <ul className="flex flex-col gap-2 text-sm text-white/60">
                {[
                  { label: "NC DEQ", url: "https://deq.nc.gov" },
                  { label: "Environmental Management Commission", url: "https://deq.nc.gov/about/divisions/water-resources/emc" },
                  { label: "NC Utilities Commission", url: "https://www.ncuc.gov" },
                  { label: "EPA Region 4", url: "https://www.epa.gov/aboutepa/epa-region-4-southeast" },
                  { label: "EPA PFAS Program", url: "https://www.epa.gov/pfas" },
                ].map(({ label, url }) => (
                  <li key={label}>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 transition-colors hover:text-[var(--brand-accent)]"
                    >
                      <ExternalLink className="h-3 w-3 shrink-0 opacity-50" />
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
