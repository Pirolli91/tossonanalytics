"use client";

import dynamic from "next/dynamic";
import { useState, useEffect, useMemo } from "react";
import { DataPanel, type SiteData } from "@/components/dashboard/DataPanel";
import { FilterBar, type CompoundFilter, type ThresholdFilter, type LayerFilter } from "@/components/dashboard/FilterBar";
import { MapLegend } from "@/components/dashboard/MapLegend";
import type { CountyData } from "@/components/dashboard/PFASMap";
import Link from "next/link";
import { Droplets, RefreshCw, ArrowLeft } from "lucide-react";

const PFASMap = dynamic(
  () => import("@/components/dashboard/PFASMap").then(m => m.PFASMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center text-white/40 text-sm">
        Loading map…
      </div>
    ),
  }
);

export default function DashboardPage() {
  const [counties, setCounties]   = useState<CountyData[]>([]);
  const [sites, setSites]         = useState<SiteData[]>([]);
  const [selected, setSelected]   = useState<CountyData | null>(null);
  const [lastFetched, setLast]    = useState("");
  const [loading, setLoading]     = useState(true);

  const [compound,  setCompound]  = useState<CompoundFilter>("severity");
  const [threshold, setThreshold] = useState<ThresholdFilter>("all");
  const [layer,     setLayer]     = useState<LayerFilter>("counties");

  useEffect(() => {
    Promise.all([
      fetch("/data/pfas-nc-data.json").then(r => r.json()),
      fetch("/data/pfas-sites.json").then(r => r.json()).catch(() => []),
    ]).then(([c, s]) => {
      setCounties(c);
      setSites(s);
      setLast(new Date().toLocaleTimeString());
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filteredCounties = useMemo(() => {
    if (threshold === "exceeds")     return counties.filter(c => c.exceedsMCL);
    if (threshold === "approaching") return counties.filter(c => c.severityScore >= 0.5);
    return counties;
  }, [counties, threshold]);

  const exceedsCount = counties.filter(c => c.exceedsMCL).length;
  const maxSeverity  = counties.length ? Math.max(...counties.map(c => c.severityScore)) : 0;
  const worstCounty  = counties[0]?.county ?? "—";

  return (
    <div className="flex h-[100dvh] flex-col bg-[var(--bg-main)] text-white overflow-hidden">

      {/* ── Top bar ── */}
      <header className="shrink-0 border-b border-white/10 bg-[var(--bg-main)]/90 backdrop-blur-md">
        <div className="flex items-center justify-between gap-2 px-3 py-2 sm:px-5 sm:py-3">
          <div className="flex items-center gap-2 min-w-0">
            <Link href="/" className="text-white/40 hover:text-white transition-colors shrink-0">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <Droplets className="h-4 w-4 shrink-0" style={{ color: "var(--brand-accent)" }} />
            <h1 className="text-xs font-bold truncate sm:text-sm">
              <span className="hidden sm:inline">Tosson Analytics — </span>
              <span style={{ color: "var(--brand-accent)" }}>Live PFAS Dashboard</span>
            </h1>
          </div>
          <div className="hidden items-center gap-1.5 lg:flex">
            {["EPA UCMR 5", "USGS WQP", "NC DEQ"].map(src => (
              <span key={src} className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-white/40">
                {src}
              </span>
            ))}
          </div>
          <div className="flex shrink-0 items-center gap-1.5 text-[10px] text-white/30 sm:text-[11px]">
            <RefreshCw className="h-3 w-3" />
            {loading ? "Loading…" : `Updated ${lastFetched}`}
          </div>
        </div>

        {!loading && (
          <div className="overflow-x-auto border-t border-white/5">
            <div className="flex items-center gap-x-3 gap-y-1 whitespace-nowrap px-3 py-1.5 text-[10px] sm:px-5 sm:py-2 sm:text-[11px]">
              <span className="text-white/30">{counties.length} counties</span>
              <span className="text-white/15">·</span>
              <span style={{ color: "#e74c3c" }}>{exceedsCount} exceed MCL</span>
              <span className="text-white/15">·</span>
              <span className="text-white/30">{sites.length} water systems</span>
              <span className="text-white/15 hidden sm:inline">·</span>
              <span className="text-white/30 hidden sm:inline">Worst: {worstCounty} ({maxSeverity.toFixed(1)}×)</span>
              <span className="text-white/15 hidden sm:inline">·</span>
              <span className="text-white/30 hidden sm:inline">MCL: 4 ppt PFOA/PFOS</span>
            </div>
          </div>
        )}
      </header>

      {/* ── Filter bar ── */}
      {!loading && (
        <FilterBar
          compound={compound}   onCompound={setCompound}
          threshold={threshold} onThreshold={setThreshold}
          layer={layer}         onLayer={setLayer}
        />
      )}

      {/* ── Map + Panel ── */}
      {/* Desktop: side-by-side. Mobile: map on top, panel as bottom sheet */}
      <div className="flex flex-1 overflow-hidden flex-col md:flex-row">

        {/* Map */}
        <div className={`relative transition-all duration-300 ${
          selected
            ? "h-[45vh] md:h-auto md:flex-1"
            : "flex-1"
        }`}>
          {!loading ? (
            <>
              <PFASMap
                data={filteredCounties}
                onCountySelect={setSelected}
                selectedFips={selected?.fips ?? null}
              />
              <MapLegend />
            </>
          ) : (
            <div className="flex h-full items-center justify-center text-white/30 text-sm">
              Fetching PFAS data…
            </div>
          )}
        </div>

        {/* Panel — side on desktop, bottom sheet on mobile */}
        <aside
          className={`
            shrink-0 border-white/10 bg-[#12243f]/90 backdrop-blur-md overflow-y-auto transition-all duration-300
            border-t md:border-t-0 md:border-l
            ${selected
              ? "h-[55vh] md:h-auto md:w-80 xl:w-96"
              : "h-0 md:h-auto md:w-64"
            }
          `}
        >
          <DataPanel
            county={selected}
            sites={sites}
            onClose={() => setSelected(null)}
          />
        </aside>
      </div>
    </div>
  );
}
