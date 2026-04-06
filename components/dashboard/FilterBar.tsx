"use client";

import { Layers, Filter } from "lucide-react";

export type CompoundFilter = "severity" | "pfoa" | "pfos" | "genx" | "pfna" | "pfhxs";
export type ThresholdFilter = "all" | "exceeds" | "approaching";
export type LayerFilter = "counties" | "sites" | "both";

interface FilterBarProps {
  compound: CompoundFilter;
  threshold: ThresholdFilter;
  layer: LayerFilter;
  onCompound:  (v: CompoundFilter)  => void;
  onThreshold: (v: ThresholdFilter) => void;
  onLayer:     (v: LayerFilter)     => void;
}

const COMPOUNDS: { value: CompoundFilter; label: string }[] = [
  { value: "severity", label: "Severity Score" },
  { value: "pfoa",     label: "PFOA" },
  { value: "pfos",     label: "PFOS" },
  { value: "genx",     label: "GenX / HFPO-DA" },
  { value: "pfna",     label: "PFNA" },
  { value: "pfhxs",   label: "PFHxS" },
];

const THRESHOLDS: { value: ThresholdFilter; label: string }[] = [
  { value: "all",         label: "All counties" },
  { value: "exceeds",     label: "Exceeds MCL" },
  { value: "approaching", label: "≥ 0.5× MCL" },
];

const LAYERS: { value: LayerFilter; label: string }[] = [
  { value: "counties", label: "Counties" },
  { value: "sites",    label: "Water Systems" },
  { value: "both",     label: "Both" },
];

export function FilterBar({
  compound, threshold, layer,
  onCompound, onThreshold, onLayer,
}: FilterBarProps) {
  return (
    <div className="overflow-x-auto border-b border-white/10 bg-[var(--bg-main)]/95 backdrop-blur-md">
    <div className="flex items-center gap-3 px-3 py-2 sm:px-5 sm:py-2.5 min-w-max">
      <div className="flex items-center gap-1.5 text-xs text-white/40">
        <Filter className="h-3 w-3" />
        <span className="font-semibold uppercase tracking-wider">Filter</span>
      </div>

      {/* Compound selector */}
      <div className="flex items-center gap-1.5">
        <span className="text-[11px] text-white/40">Compound</span>
        <select
          value={compound}
          onChange={e => onCompound(e.target.value as CompoundFilter)}
          className="rounded-lg border border-white/15 bg-white/5 px-2 py-1 text-xs text-white/80 focus:border-[var(--brand-accent)] focus:outline-none"
        >
          {COMPOUNDS.map(c => (
            <option key={c.value} value={c.value} className="bg-[#0e1b30]">
              {c.label}
            </option>
          ))}
        </select>
      </div>

      {/* Threshold filter */}
      <div className="flex items-center gap-1">
        {THRESHOLDS.map(t => (
          <button
            key={t.value}
            onClick={() => onThreshold(t.value)}
            className={`rounded-lg px-3 py-1 text-[11px] font-medium transition-all ${
              threshold === t.value
                ? "text-[#0e1b30]"
                : "border border-white/15 bg-white/5 text-white/55 hover:bg-white/10"
            }`}
            style={threshold === t.value ? { background: "var(--brand-accent)" } : {}}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Layer toggle */}
      <div className="ml-6 flex items-center gap-1.5 sm:ml-auto">
        <Layers className="h-3 w-3 text-white/40" />
        <span className="text-[11px] text-white/40">Layer</span>
        {LAYERS.map(l => (
          <button
            key={l.value}
            onClick={() => onLayer(l.value)}
            className={`rounded-lg px-3 py-1 text-[11px] font-medium transition-all ${
              layer === l.value
                ? "text-[#0e1b30]"
                : "border border-white/15 bg-white/5 text-white/55 hover:bg-white/10"
            }`}
            style={layer === l.value ? { background: "var(--brand-accent)" } : {}}
          >
            {l.label}
          </button>
        ))}
      </div>
    </div>
    </div>
  );
}
