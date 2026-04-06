"use client";

const LEVELS = [
  { color: "#e74c3c", label: "> 10× MCL",       range: "Extreme" },
  { color: "#e67e22", label: "5–10× MCL",        range: "Critical" },
  { color: "#f39c12", label: "1–5× MCL",         range: "Exceeds MCL" },
  { color: "#f1c40f", label: "0.5–1× MCL",       range: "Approaching" },
  { color: "#27ae60", label: "< 0.5× MCL",       range: "Safe" },
  { color: "#1e3a5f", label: "No data",           range: "" },
];

export function MapLegend() {
  return (
    <div className="absolute bottom-6 left-4 z-[1000] rounded-xl border border-white/10 bg-[var(--bg-main)]/90 p-3 backdrop-blur-md">
      <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-white/50">
        Severity vs EPA MCL
      </p>
      <div className="space-y-1.5">
        {LEVELS.map(({ color, label, range }) => (
          <div key={label} className="flex items-center gap-2">
            <span
              className="inline-block h-3 w-4 rounded-sm shrink-0"
              style={{ background: color }}
            />
            <span className="text-[11px] text-white/70">{label}</span>
            {range && (
              <span className="text-[10px] text-white/35">— {range}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
