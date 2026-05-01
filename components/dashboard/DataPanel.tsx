"use client";

import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, ReferenceLine,
  Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import {
  X, AlertTriangle, CheckCircle, Info,
  ChevronDown, ChevronUp, Droplets, Building2,
} from "lucide-react";
import type { CountyData } from "./PFASMap";

export interface SiteData {
  pwsid: string;
  name: string;
  fips: string;
  county: string;
  pfoa_ppt?: number;
  pfos_ppt?: number;
  genx_ppt?: number;
  pfna_ppt?: number;
  pfhxs_ppt?: number;
  pfbs_ppt?: number;
  hazardIndex: number;
  severityScore: number;
  exceedsMCL: boolean;
  sampleCount: number;
  lastSampled?: string;
  source?: string;
}

interface DataPanelProps {
  county: CountyData | null;
  sites: SiteData[];
  onClose: () => void;
  onSiteSelect?: (site: SiteData | null) => void;
}

const MCL_LIMITS: Record<string, number> = {
  PFOA: 4, PFOS: 4, GenX: 10, PFNA: 10, PFHxS: 10,
};

function barColor(value: number, limit: number) {
  const r = value / limit;
  if (r >= 1) return "#e74c3c";
  if (r >= 0.5) return "#f39c12";
  return "#27ae60";
}

function SeverityBadge({ score, exceeds }: { score: number; exceeds: boolean }) {
  const bg   = exceeds ? "rgba(231,76,60,0.15)"  : "rgba(39,174,96,0.15)";
  const text = exceeds ? "#e74c3c" : "#27ae60";
  const Icon = exceeds ? AlertTriangle : CheckCircle;
  return (
    <div className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold" style={{ background: bg, color: text }}>
      <Icon className="h-4 w-4 shrink-0" />
      {exceeds ? `Exceeds EPA MCL — ${score.toFixed(2)}× limit` : `Below EPA MCL — ${score.toFixed(3)}× limit`}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
      <Info className="h-10 w-10 text-white/20" />
      <p className="text-sm font-semibold text-white/50">Select a county on the map</p>
      <p className="text-xs text-white/30">
        Click any county to view PFAS measurements from EPA UCMR 5 and NC DEQ data, with drill-down into individual water systems.
      </p>
    </div>
  );
}

function SiteCard({ site, onSelect }: { site: SiteData; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      className="w-full rounded-xl border border-white/10 bg-white/[0.03] p-3 text-left transition-all hover:border-white/20 hover:bg-white/[0.06]"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-white/85">{site.name}</p>
          <p className="text-[10px] text-white/35 mt-0.5">{site.pwsid}</p>
        </div>
        <span
          className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold"
          style={{
            background: site.exceedsMCL ? "rgba(231,76,60,0.2)" : "rgba(39,174,96,0.15)",
            color:      site.exceedsMCL ? "#e74c3c" : "#27ae60",
          }}
        >
          {site.severityScore.toFixed(2)}×
        </span>
      </div>
      <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-white/40">
        {site.pfoa_ppt ? <span>PFOA: <strong className="text-white/65">{site.pfoa_ppt} ppt</strong></span> : null}
        {site.genx_ppt ? <span>GenX: <strong className="text-white/65">{site.genx_ppt} ppt</strong></span> : null}
        {site.lastSampled ? <span className="ml-auto">{site.lastSampled}</span> : null}
      </div>
    </button>
  );
}

function SiteDetail({ site, onBack }: { site: SiteData; onBack: () => void }) {
  const chartData = [
    { name: "PFOA",  value: site.pfoa_ppt  || 0, limit: 4  },
    { name: "PFOS",  value: site.pfos_ppt  || 0, limit: 4  },
    { name: "GenX",  value: site.genx_ppt  || 0, limit: 10 },
    { name: "PFNA",  value: site.pfna_ppt  || 0, limit: 10 },
    { name: "PFHxS", value: site.pfhxs_ppt || 0, limit: 10 },
  ];

  return (
    <div className="flex flex-col gap-4">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white transition-colors"
      >
        ← Back to {site.county} County
      </button>

      <div>
        <div className="flex items-center gap-2 mb-1">
          <Building2 className="h-4 w-4" style={{ color: "var(--brand-accent)" }} />
          <h3 className="text-sm font-bold leading-tight">{site.name}</h3>
        </div>
        <p className="text-[10px] text-white/35">{site.pwsid} · {site.sampleCount} samples · Last: {site.lastSampled ?? "N/A"}</p>
      </div>

      <SeverityBadge score={site.severityScore} exceeds={site.exceedsMCL} />

      <div className="grid grid-cols-2 gap-2">
        {[
          { label: "Severity",     value: site.severityScore.toFixed(3) + "×", color: site.exceedsMCL ? "#e74c3c" : "#27ae60" },
          { label: "Hazard Index", value: site.hazardIndex.toFixed(4),          color: site.hazardIndex >= 1 ? "#e74c3c" : "#f39c12" },
          { label: "GenX (ppt)",   value: (site.genx_ppt ?? 0).toString(),      color: "var(--brand-accent)" },
          { label: "Source",       value: site.source ?? "EPA UCMR 5",          color: "rgba(255,255,255,0.5)" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
            <p className="text-[10px] text-white/40 uppercase tracking-wide">{label}</p>
            <p className="mt-1 text-sm font-bold truncate" style={{ color }}>{value}</p>
          </div>
        ))}
      </div>

      <div>
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-white/40">
          PFAS vs EPA MCL
        </p>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 9 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: "rgba(14,27,48,0.95)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, color: "#fff", fontSize: 11 }}
                formatter={(v) => [typeof v === "number" ? `${v.toFixed(2)} ppt` : String(v)]}
              />
              <ReferenceLine y={4} stroke="#e74c3c" strokeDasharray="4 2" />
              <Bar dataKey="value" radius={[4,4,0,0]}>
                {chartData.map(e => (
                  <Cell key={e.name} fill={barColor(e.value, e.limit)} fillOpacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export function DataPanel({ county, sites, onClose, onSiteSelect }: DataPanelProps) {
  const [showSites, setShowSites] = useState(false);
  const [selectedSite, setSelectedSite] = useState<SiteData | null>(null);

  if (!county) return <EmptyState />;

  const countySites = sites.filter(s => s.fips === county.fips)
    .sort((a, b) => b.severityScore - a.severityScore);

  const chartData = [
    { name: "PFOA",  value: county.pfoa_ppt,  limit: 4  },
    { name: "PFOS",  value: county.pfos_ppt,  limit: 4  },
    { name: "GenX",  value: county.genx_ppt,  limit: 10 },
    { name: "PFNA",  value: county.pfna_ppt,  limit: 10 },
    { name: "PFHxS", value: county.pfhxs_ppt, limit: 10 },
  ];

  if (selectedSite) {
    return (
      <div className="flex h-full flex-col gap-4 overflow-y-auto p-5">
        <SiteDetail site={selectedSite} onBack={() => setSelectedSite(null)} />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold">{county.county} County</h2>
          <p className="text-xs text-white/40">
            FIPS {county.fips} · {county.pwsCount} water system{county.pwsCount !== 1 ? "s" : ""} · {county.source ?? "EPA UCMR 5"}
          </p>
        </div>
        <button onClick={onClose} className="shrink-0 rounded-lg p-1.5 text-white/40 hover:bg-white/10 hover:text-white transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>

      <SeverityBadge score={county.severityScore} exceeds={county.exceedsMCL} />

      {/* Key metrics */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: "Severity Score", value: county.severityScore.toFixed(3) + "×", color: county.exceedsMCL ? "#e74c3c" : "#27ae60" },
          { label: "Hazard Index",   value: county.hazardIndex.toFixed(4),          color: county.hazardIndex >= 1 ? "#e74c3c" : "#f39c12" },
          { label: "GenX (ppt)",     value: county.genx_ppt.toFixed(1),             color: "var(--brand-accent)" },
          { label: "Last Updated",   value: county.lastUpdated,                     color: "rgba(255,255,255,0.5)" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
            <p className="text-[10px] text-white/40 uppercase tracking-wide">{label}</p>
            <p className="mt-1 text-sm font-bold" style={{ color }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div>
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-white/40">
          County Max Concentrations vs MCL
        </p>
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 9 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: "rgba(14,27,48,0.95)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, color: "#fff", fontSize: 11 }}
                formatter={(v) => [typeof v === "number" ? `${v.toFixed(2)} ppt` : String(v)]}
              />
              <ReferenceLine y={4} stroke="#e74c3c" strokeDasharray="4 2"
                label={{ value: "MCL 4ppt", fill: "#e74c3c", fontSize: 9, position: "insideTopRight" }} />
              <Bar dataKey="value" radius={[4,4,0,0]}>
                {chartData.map(e => (
                  <Cell key={e.name} fill={barColor(e.value, e.limit)} fillOpacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Hazard Index breakdown */}
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-white/40">
          EPA Hazard Index Breakdown
        </p>
        <div className="space-y-2 text-xs">
          {[
            { label: "GenX ÷ 10 ppt",    v: county.genx_ppt  / 10 },
            { label: "PFNA ÷ 2000 ppt",  v: county.pfna_ppt  / 2000 },
            { label: "PFHxS ÷ 10 ppt",   v: county.pfhxs_ppt / 10 },
            { label: "PFBS ÷ 10 ppt",    v: county.pfbs_ppt ? county.pfbs_ppt / 10 : 0 },
          ].map(({ label, v }) => (
            <div key={label} className="flex justify-between">
              <span className="text-white/50">{label}</span>
              <span className={v >= 0.3 ? "font-bold text-[#f39c12]" : "text-white/70"}>{v.toFixed(4)}</span>
            </div>
          ))}
          <div className="flex justify-between border-t border-white/10 pt-2 font-bold mt-1">
            <span className="text-white/70">HI Total</span>
            <span style={{ color: county.hazardIndex >= 1 ? "#e74c3c" : "#27ae60" }}>
              {county.hazardIndex.toFixed(4)}
            </span>
          </div>
        </div>
      </div>

      {/* Water system drill-down */}
      {countySites.length > 0 && (
        <div>
          <button
            onClick={() => setShowSites(s => !s)}
            className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 transition-colors hover:bg-white/[0.06]"
          >
            <div className="flex items-center gap-2">
              <Droplets className="h-4 w-4" style={{ color: "var(--brand-accent)" }} />
              <span className="text-sm font-semibold">
                {countySites.length} Water System{countySites.length !== 1 ? "s" : ""}
              </span>
              <span className="text-[11px] text-white/40">
                ({countySites.filter(s => s.exceedsMCL).length} exceed MCL)
              </span>
            </div>
            {showSites ? <ChevronUp className="h-4 w-4 text-white/40" /> : <ChevronDown className="h-4 w-4 text-white/40" />}
          </button>

          {showSites && (
            <div className="mt-2 space-y-2">
              {countySites.map(site => (
                <SiteCard
                  key={site.pwsid}
                  site={site}
                  onSelect={() => setSelectedSite(site)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <p className="text-[10px] text-white/25 font-[var(--font-source-sans)]">
        Data: EPA UCMR 5 (29 PFAS compounds) · NC DEQ · USGS WQP.
        MCL: 4.0 ppt PFOA/PFOS (EPA April 10, 2024). Updated nightly.
      </p>
    </div>
  );
}
