import { readFileSync } from "fs";
import { join } from "path";
import { Navbar } from "@/components/Navbar";
import { Scale, Landmark, FileText, AlertCircle, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Bill {
  id: string;
  status: string;
  impact: string;
  summary: string;
  url: string;
  title?: string;
  last_action?: string;
  last_action_date?: string;
}

interface FederalAction {
  title: string;
  jurisdiction: string;
  status: string;
  date: string;
  summary: string;
  url: string;
}

interface PolicyData {
  bills: Bill[];
  region: string;
  last_updated: string;
}

interface PfEvent {
  id: string;
  event_date: string;
  published_date: string;
  event_type: string;
  title: string;
  jurisdiction: string;
  status: string;
  status_basis: string;
  entities: string[];
  summary: string;
  source_urls: string[];
  compound_ids: string[];
  amount_usd: number | null;
}

const EVENT_TYPE_META: Record<string, { label: string; classes: string }> = {
  claim_correction: { label: "Claim correction", classes: "bg-amber-400/10 text-amber-300 border-amber-400/20" },
  guidance_rescission: { label: "Guidance rescission", classes: "bg-orange-400/10 text-orange-300 border-orange-400/20" },
  settlement: { label: "Settlement", classes: "bg-emerald-400/10 text-emerald-300 border-emerald-400/20" },
  enforcement_notice: { label: "Enforcement notice", classes: "bg-rose-400/10 text-rose-300 border-rose-400/20" },
};

function formatMoney(usd: number | null): string | null {
  if (!usd) return null;
  if (usd >= 1_000_000) return `$${(usd / 1_000_000).toLocaleString()} million`;
  return `$${usd.toLocaleString()}`;
}

function EventsTimeline({ events }: { events: PfEvent[] }) {
  if (events.length === 0) return null;
  return (
    <section className="mb-12">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <FileText className="h-6 w-6 text-[var(--brand-accent)]" />
          <h2 className="text-xl font-bold">Events Timeline — September 2026</h2>
        </div>
        <p className="text-sm text-white/40 max-w-3xl">
          Dated policy and enforcement events, verified against primary sources. Measurements are never
          changed by news — each card is labeled by what it is: guidance, settlement, allegation, or correction.
          Detections measure occurrence; they do not establish production origin.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {events.map((event) => {
          const meta = EVENT_TYPE_META[event.event_type] ?? { label: event.event_type, classes: "bg-white/5 text-white/60 border-white/10" };
          const money = formatMoney(event.amount_usd);
          const reportedDifferently = event.published_date && event.published_date !== event.event_date;
          return (
            <article key={event.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${meta.classes}`}>
                  {meta.label}
                </span>
                <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs font-semibold text-white/60">
                  {event.status}
                </span>
                {money && (
                  <span className="inline-flex items-center rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-0.5 text-xs font-bold text-emerald-300">
                    {money}
                  </span>
                )}
              </div>
              <h3 className="font-bold text-white/90 leading-snug mb-1">{event.title}</h3>
              <p className="text-[11px] text-white/35 mb-3">
                Event date: {event.event_date}
                {reportedDifferently ? ` · Reported: ${event.published_date}` : ""}
                {" · "}{event.jurisdiction}
              </p>
              <p className="text-sm text-white/70 leading-relaxed mb-3">{event.summary}</p>
              <p className="text-[11px] text-white/30 mb-4" title={event.status_basis}>
                {event.status_basis}
              </p>
              <div className="flex flex-wrap gap-3">
                {event.source_urls.map((url, i) => (
                  <a
                    key={url}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-white/40 hover:text-[var(--brand-accent)] transition-colors"
                  >
                    Source {event.source_urls.length > 1 ? i + 1 : ""} <ExternalLink className="h-3 w-3" />
                  </a>
                ))}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default function PolicyTrackerPage() {
  let policyData: PolicyData = { bills: [], region: "", last_updated: "" };
  let globalData: { summary: string; categories: string[]; actions: FederalAction[] } = { summary: "", categories: [], actions: [] };
  let events: PfEvent[] = [];
  
  try {
    const policyPath = join(process.cwd(), "public", "data", "nc-pfas-policy.json");
    policyData = JSON.parse(readFileSync(policyPath, "utf-8"));
    
    const globalPath = join(process.cwd(), "public", "data", "pfas-governance.json");
    globalData = JSON.parse(readFileSync(globalPath, "utf-8"));

    const eventsPath = join(process.cwd(), "public", "data", "pfas-events.json");
    const eventsRaw = JSON.parse(readFileSync(eventsPath, "utf-8"));
    if (Array.isArray(eventsRaw.events)) events = eventsRaw.events;
  } catch (e) {}

  return (
    <main className="min-h-screen bg-[var(--bg-main)] text-white">
      <Navbar active="policy-tracker" />

      <div className="mx-auto max-w-5xl px-6 py-12">
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-2">
            <Scale className="h-8 w-8 text-[var(--brand-accent)]" />
            <h1 className="text-3xl font-bold">Policy & Governance Tracker</h1>
          </div>
          <p className="text-white/40 max-w-2xl">
            Monitoring the legislative landscape for &quot;forever chemicals&quot; from the NC General Assembly to federal regulatory actions.
          </p>
          {policyData.last_updated && (
            <p className="mt-3 text-xs text-white/30">
              Data current as of {policyData.last_updated} · {policyData.bills.length} items tracked
            </p>
          )}
        </div>

        <EventsTimeline events={events} />

        <div className="grid gap-8 lg:grid-cols-3">
          {/* NC Bills Column */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Landmark className="h-5 w-5 text-[var(--brand-accent)]" />
                <h2 className="text-lg font-bold">NC Legislative Activity</h2>
              </div>
              <Badge variant="outline" className="border-white/10 text-white/40">
                Region: {policyData.region}
              </Badge>
            </div>

            <div className="space-y-4">
              {policyData.bills.map((bill: Bill) => (
                <div key={bill.id} className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xl font-bold text-[var(--brand-accent)]">{bill.id}</span>
                      <Badge className="bg-white/5 text-white/60 border-white/10">{bill.status}</Badge>
                    </div>
                    <Badge className="bg-[var(--brand-accent)]/10 text-[var(--brand-accent)] border-0">
                      Impact: {bill.impact}
                    </Badge>
                  </div>
                  {bill.title && (
                    <h3 className="font-semibold text-white/90 mb-2">{bill.title}</h3>
                  )}
                  <p className="text-sm text-white/70 leading-relaxed mb-4">
                    {bill.summary}
                  </p>
                  {(bill.last_action || bill.last_action_date) && (
                    <p className="text-xs text-white/35 mb-4">
                      Last action{bill.last_action_date ? ` · ${bill.last_action_date}` : ""}: {bill.last_action}
                    </p>
                  )}
                  <a 
                    href={bill.url} 
                    target="_blank" 
                    className="inline-flex items-center gap-2 text-xs font-bold text-white/40 hover:text-[var(--brand-accent)] transition-colors"
                  >
                    View Official Bill Text <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* Federal/Global Context */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <div className="flex items-center gap-2 mb-4 text-[var(--brand-accent)]">
                <FileText className="h-5 w-5" />
                <h2 className="font-bold text-sm uppercase tracking-wider">National Trends</h2>
              </div>
              <p className="text-sm text-white/60 leading-relaxed mb-6">
                {globalData.summary}
              </p>
              <div className="space-y-2">
                {globalData.categories.map((cat: string) => (
                  <div key={cat} className="flex items-center gap-2 text-xs text-white/40 bg-white/5 rounded-md px-3 py-2">
                    <div className="h-1 w-1 rounded-full bg-[var(--brand-accent)]" />
                    {cat}
                  </div>
                ))}
              </div>
            </div>

            {globalData.actions.length > 0 && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                <div className="flex items-center gap-2 mb-4 text-[var(--brand-accent)]">
                  <Landmark className="h-5 w-5" />
                  <h2 className="font-bold text-sm uppercase tracking-wider">Federal &amp; Global</h2>
                </div>
                <div className="space-y-5">
                  {globalData.actions.map((action: FederalAction) => (
                    <div key={action.title} className="border-b border-white/5 pb-4 last:border-0 last:pb-0">
                      <a href={action.url} target="_blank" rel="noreferrer" className="font-semibold text-sm text-white/85 hover:text-[var(--brand-accent)] transition-colors">
                        {action.title}
                      </a>
                      <p className="mt-1 text-[11px] text-white/35">
                        {action.jurisdiction} · {action.date} · {action.status}
                      </p>
                      <p className="mt-2 text-xs text-white/55 leading-relaxed">
                        {action.summary}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-[var(--brand-accent)]/20 bg-[var(--brand-accent)]/5 p-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-[var(--brand-accent)] shrink-0" />
                <div>
                  <h3 className="font-bold text-sm mb-1">Regulatory Gap Alert</h3>
                  <p className="text-xs text-white/50 leading-relaxed">
                    Identify regions where contamination detections exist without corresponding legislative protections.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
