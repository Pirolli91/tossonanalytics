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

export default function PolicyTrackerPage() {
  let policyData: PolicyData = { bills: [], region: "", last_updated: "" };
  let globalData: { summary: string; categories: string[]; actions: FederalAction[] } = { summary: "", categories: [], actions: [] };
  
  try {
    const policyPath = join(process.cwd(), "public", "data", "nc-pfas-policy.json");
    policyData = JSON.parse(readFileSync(policyPath, "utf-8"));
    
    const globalPath = join(process.cwd(), "public", "data", "pfas-governance.json");
    globalData = JSON.parse(readFileSync(globalPath, "utf-8"));
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
