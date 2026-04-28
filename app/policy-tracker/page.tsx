import { readFileSync } from "fs";
import { join } from "path";
import { Navbar } from "@/components/Navbar";
import { Scale, Landmark, FileText, Globe } from "lucide-react";

export default function PolicyTrackerPage() {
  let data = { summary: "", categories: [], source: "", last_harvested: "" };
  try {
    const path = join(process.cwd(), "public", "data", "pfas-governance.json");
    data = JSON.parse(readFileSync(path, "utf-8"));
  } catch (e) {}

  return (
    <main className="min-h-screen bg-[var(--bg-main)] text-white">
      <Navbar active="policy-tracker" />

      <div className="mx-auto max-w-4xl px-6 py-12">
        <div className="mb-10 flex items-center gap-3">
          <Scale className="h-7 w-7" style={{ color: "var(--brand-accent)" }} />
          <div>
            <h1 className="text-2xl font-bold">PFAS Governance Tracker</h1>
            <p className="text-sm text-white/40">
              National monitoring of legislative and executive actions on "forever chemicals".
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 mb-8">
          <div className="flex items-start gap-4">
             <div className="rounded-full bg-[var(--brand-accent)]/10 p-3">
               <Landmark className="h-6 w-6 text-[var(--brand-accent)]" />
             </div>
             <div>
               <h2 className="text-xl font-bold mb-2">Policy Summary</h2>
               <p className="text-white/70 leading-relaxed">
                 {data.summary} The tracker monitors over 900 actions across all 50 states, Congress, and multiple federal agencies.
               </p>
             </div>
          </div>
        </div>

        <h3 className="text-sm font-semibold uppercase tracking-wider text-white/30 mb-4">Key Action Categories</h3>
        <div className="grid gap-4 sm:grid-cols-3 mb-12">
          {data.categories.map((cat, i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/5 p-4">
              <FileText className="h-4 w-4 text-[var(--brand-accent)]" />
              <span className="text-sm font-medium">{cat}</span>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
               <Globe className="h-10 w-10 text-white/20" />
               <p className="text-sm text-white/40 max-w-sm">
                 Governance tracking identifies regulatory gaps where high contamination exists but legislative activity remains low.
               </p>
            </div>
            <a 
              href={data.source} 
              target="_blank" 
              className="rounded-lg px-6 py-3 text-sm font-bold bg-white text-[var(--bg-main)] hover:bg-white/90 transition-colors"
            >
              View Full Tracker
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
