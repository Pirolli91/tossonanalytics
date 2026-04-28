import { readFileSync } from "fs";
import { join } from "path";
import { Navbar } from "@/components/Navbar";
import { Activity, Beaker, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function ToxicologyPage() {
  let data = { findings: [], source: "", last_harvested: "" };
  try {
    const path = join(process.cwd(), "public", "data", "pfas-tox-db.json");
    data = JSON.parse(readFileSync(path, "utf-8"));
  } catch (e) {}

  return (
    <main className="min-h-screen bg-[var(--bg-main)] text-white">
      <Navbar active="toxicology" />

      <div className="mx-auto max-w-4xl px-6 py-12">
        <div className="mb-10 flex items-center gap-3">
          <Activity className="h-7 w-7" style={{ color: "var(--brand-accent)" }} />
          <div>
            <h1 className="text-2xl font-bold">PFAS-TOX Database</h1>
            <p className="text-sm text-white/40">
              Systematic evidence map of health outcomes associated with PFAS exposure.
            </p>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
           <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
             <div className="flex items-center gap-2 mb-4 text-[var(--brand-accent)]">
               <ShieldAlert className="h-5 w-5" />
               <h2 className="font-bold">Key Health Risks</h2>
             </div>
             <ul className="space-y-4">
               {data.findings.map((finding, i) => (
                 <li key={i} className="text-sm text-white/70 leading-relaxed border-l-2 border-white/10 pl-4">
                   {finding}
                 </li>
               ))}
             </ul>
           </div>

           <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
             <div className="flex items-center gap-2 mb-4 text-[var(--brand-accent)]">
               <Beaker className="h-5 w-5" />
               <h2 className="font-bold">Database Context</h2>
             </div>
             <p className="text-sm text-white/50 leading-relaxed">
               This database tracks over 1,000 in vitro, animal, and human studies. Research has established "probable links" between PFOA exposure and several serious health conditions.
             </p>
             <div className="mt-6 space-y-3">
               <div className="flex justify-between text-xs text-white/30">
                 <span>Source:</span>
                 <a href={data.source} target="_blank" className="hover:text-white underline">PFAS Project Lab</a>
               </div>
               <div className="flex justify-between text-xs text-white/30">
                 <span>Last Updated:</span>
                 <span>{data.last_harvested}</span>
               </div>
             </div>
           </div>
        </div>

        <div className="mt-12 rounded-2xl bg-[var(--brand-accent)]/10 border border-[var(--brand-accent)]/20 p-8 text-center">
          <h3 className="text-lg font-bold mb-2">Scientific Advocacy</h3>
          <p className="text-sm text-white/60 max-w-2xl mx-auto">
            The data suggests a synergistic effect between industrial toxins and environmental changes. Tosson Analytics provides PhD-level analysis to help interpret these complex toxicological findings for municipal and legal stakeholders.
          </p>
        </div>
      </div>
    </main>
  );
}
