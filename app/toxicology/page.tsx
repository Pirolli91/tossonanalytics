import { readFileSync } from "fs";
import { join } from "path";
import { Navbar } from "@/components/Navbar";
import { Activity, Beaker, GraduationCap, ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function ToxicologyPage() {
  let researchData = { papers: [] };
  let toxData = { findings: [] };
  
  try {
    const researchPath = join(process.cwd(), "public", "data", "tosson-research-feed.json");
    researchData = JSON.parse(readFileSync(researchPath, "utf-8"));
    
    const toxPath = join(process.cwd(), "public", "data", "pfas-tox-db.json");
    toxData = JSON.parse(readFileSync(toxPath, "utf-8"));
  } catch (e) {}

  return (
    <main className="min-h-screen bg-[var(--bg-main)] text-white">
      <Navbar active="toxicology" />

      <div className="mx-auto max-w-5xl px-6 py-12">
        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex items-center gap-3">
            <Activity className="h-8 w-8 text-[var(--brand-accent)]" />
            <div>
              <h1 className="text-3xl font-bold">Compound Intelligence</h1>
              <p className="text-white/40 max-w-xl mt-1">
                Bridging the gap between global toxicological data and local contamination events in North Carolina.
              </p>
            </div>
          </div>
          <Badge className="bg-white/5 text-[var(--brand-accent)] border-white/10 px-4 py-1.5 h-fit">
            Updated: {new Date().toLocaleDateString()}
          </Badge>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Recent Research Column */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <GraduationCap className="h-5 w-5 text-[var(--brand-accent)]" />
              <h2 className="text-lg font-bold">Latest Scientific Findings (2024-2026)</h2>
            </div>
            
            <div className="space-y-4">
              {researchData.papers.map((paper: any) => (
                <div key={paper.id} className="group rounded-2xl border border-white/5 bg-white/[0.02] p-6 transition-all hover:bg-white/[0.04] hover:border-white/10">
                  <div className="flex justify-between items-start gap-4 mb-3">
                    <h3 className="font-bold leading-tight group-hover:text-[var(--brand-accent)] transition-colors">
                      {paper.title}
                    </h3>
                    <Badge className="bg-[var(--brand-accent)]/10 text-[var(--brand-accent)] border-0 shrink-0">
                      {paper.year}
                    </Badge>
                  </div>
                  <p className="text-sm text-white/50 leading-relaxed line-clamp-3 mb-4">
                    {paper.summary}
                  </p>
                  <a 
                    href={paper.url} 
                    target="_blank" 
                    className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--brand-accent)] hover:underline"
                  >
                    View Study on PubMed <ArrowUpRight className="h-3 w-3" />
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* Core Toxicity Summary */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-white/10 bg-[var(--brand-accent)]/[0.03] p-6">
              <div className="flex items-center gap-2 mb-4 text-[var(--brand-accent)]">
                <Beaker className="h-5 w-5" />
                <h2 className="font-bold">Established Risks</h2>
              </div>
              <ul className="space-y-4">
                {toxData.findings.map((finding: string, i: number) => (
                  <li key={i} className="text-sm text-white/70 leading-relaxed flex gap-3">
                    <span className="text-[var(--brand-accent)] font-bold">•</span>
                    {finding}
                  </li>
                ))}
              </ul>
              <div className="mt-8 pt-6 border-t border-white/5">
                <p className="text-xs text-white/30 italic">
                  Note: These outcomes are associated primarily with long-chain PFAS (PFOA/PFOS). Tosson Analytics is actively monitoring emerging data on GenX and other short-chain variants specific to NC watersheds.
                </p>
              </div>
            </div>

            <div className="rounded-2xl bg-white/5 p-6 border border-white/5">
              <h3 className="font-bold text-sm mb-2">Request Analysis</h3>
              <p className="text-xs text-white/40 mb-4">
                Need a tailored toxicological risk assessment for a specific water system or legal case?
              </p>
              <button className="w-full py-2.5 rounded-lg bg-[var(--brand-accent)] text-[var(--bg-main)] text-xs font-bold">
                Consult Dr. Soneye
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
