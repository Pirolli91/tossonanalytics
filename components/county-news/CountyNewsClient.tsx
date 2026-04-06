"use client";

import { useEffect, useState, useMemo } from "react";
import { ExternalLink, Search, MapPin, Newspaper, AlertCircle, RefreshCw, FlaskConical } from "lucide-react";

interface Article {
  title: string;
  url: string;
  snippet: string;
  source: string;
  date: string;
}

interface CountyEntry {
  county: string;
  fips: string;
  lastUpdated: string;
  analysis: string;
  articles: Article[];
}

interface CountyNewsData {
  generated: string;
  counties: Record<string, CountyEntry>;
}

const ALL_COUNTIES = [
  "Alamance","Alexander","Alleghany","Anson","Ashe","Avery","Beaufort","Bertie",
  "Bladen","Brunswick","Buncombe","Burke","Cabarrus","Caldwell","Camden","Carteret",
  "Caswell","Catawba","Chatham","Cherokee","Chowan","Clay","Cleveland","Columbus",
  "Craven","Cumberland","Currituck","Dare","Davidson","Davie","Duplin","Durham",
  "Edgecombe","Forsyth","Franklin","Gaston","Gates","Graham","Granville","Greene",
  "Guilford","Halifax","Harnett","Haywood","Henderson","Hertford","Hoke","Hyde",
  "Iredell","Jackson","Johnston","Jones","Lee","Lenoir","Lincoln","McDowell",
  "Macon","Madison","Martin","Mecklenburg","Mitchell","Montgomery","Moore","Nash",
  "New Hanover","Northampton","Onslow","Orange","Pamlico","Pasquotank","Pender",
  "Perquimans","Person","Pitt","Polk","Randolph","Richmond","Robeson","Rockingham",
  "Rowan","Rutherford","Sampson","Scotland","Stanly","Stokes","Surry","Swain",
  "Transylvania","Tyrrell","Union","Vance","Wake","Warren","Washington","Watauga",
  "Wayne","Wilkes","Wilson","Yadkin","Yancey",
];

function formatDate(iso: string) {
  try {
    return new Date(iso + "T12:00:00Z").toLocaleDateString("en-US", {
      year: "numeric", month: "short", day: "numeric",
    });
  } catch { return iso; }
}

function timeAgo(iso: string) {
  try {
    const diff = (Date.now() - new Date(iso).getTime()) / 3_600_000;
    if (diff < 1)   return "just now";
    if (diff < 24)  return `${Math.floor(diff)}h ago`;
    const days = Math.floor(diff / 24);
    if (days < 7)   return `${days}d ago`;
    return `${Math.floor(days / 7)}w ago`;
  } catch { return ""; }
}

// ── Article Card ───────────────────────────────────────────────────────────────
function ArticleCard({ article, index }: { article: Article; index: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition-all hover:border-white/20 hover:bg-white/[0.05]">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <span
          className="inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold shrink-0"
          style={{ background: "rgba(0,212,170,0.12)", color: "var(--brand-accent)" }}
        >
          {article.source}
        </span>
        <span className="text-[11px] text-white/35 shrink-0">{formatDate(article.date)}</span>
      </div>

      {/* Title */}
      <h3 className="text-sm font-bold text-white/90 leading-snug mb-2">
        {article.title}
      </h3>

      {/* CTA link */}
      <p className="text-xs text-white/45 font-[var(--font-source-sans)]">
        Additional information can be found{" "}
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold underline underline-offset-2 decoration-dotted transition-colors"
          style={{ color: "var(--brand-accent)" }}
        >
          here
          <ExternalLink className="inline-block ml-0.5 h-2.5 w-2.5 relative -top-px" />
        </a>
        .
      </p>
    </div>
  );
}

// ── Main client component ──────────────────────────────────────────────────────
export function CountyNewsClient() {
  const [data, setData]             = useState<CountyNewsData | null>(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");
  const [selected, setSelected]     = useState("Wake");
  const [search, setSearch]         = useState("");
  const [showDropdown, setDropdown] = useState(false);

  // Fetch county-news.json once
  useEffect(() => {
    fetch("/data/county-news.json")
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d: CountyNewsData) => { setData(d); setLoading(false); })
      .catch(err => { setError(err.message); setLoading(false); });
  }, []);

  const filteredCounties = useMemo(() =>
    ALL_COUNTIES.filter(c => c.toLowerCase().includes(search.toLowerCase())),
  [search]);

  const entry: CountyEntry | null = data?.counties[selected] ?? null;
  const articles = entry?.articles ?? [];
  const hasArticles = articles.length > 0;

  const selectCounty = (c: string) => {
    setSelected(c);
    setSearch("");
    setDropdown(false);
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-white/30">
        <RefreshCw className="h-6 w-6 animate-spin mb-3" />
        <p className="text-sm">Loading county news data…</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-white/30">
        <AlertCircle className="h-6 w-6 mb-3" style={{ color: "var(--brand-alert)" }} />
        <p className="text-sm">Could not load county news. Run <code className="text-xs bg-white/10 px-1.5 py-0.5 rounded">npm run fetch:county-news</code> first.</p>
      </div>
    );
  }

  const dataAge = data.generated ? timeAgo(data.generated) : "unknown";
  const countiesWithNews = Object.values(data.counties).filter(c => c.articles?.length > 0).length;

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">

      {/* ── Page header ── */}
      <div className="mb-10">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span
            className="inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold"
            style={{ background: "rgba(0,212,170,0.12)", color: "var(--brand-accent)" }}
          >
            {countiesWithNews} counties with active news
          </span>
          <span
            className="inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold"
            style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)" }}
          >
            Updated {dataAge}
          </span>
          <span
            className="inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold"
            style={{ background: "rgba(124,58,237,0.15)", color: "#a78bfa" }}
          >
            Gemma 4 · AI analysis
          </span>
        </div>
        <h1 className="text-3xl font-bold leading-tight lg:text-4xl">
          PFAS & Contaminant News{" "}
          <span style={{ color: "var(--brand-accent)" }}>by County</span>
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-white/45 font-[var(--font-source-sans)] leading-relaxed">
          Real-time PFAS, water quality, and environmental contaminant news for all 100 North
          Carolina counties — sourced daily and analysed by Gemma 4 in Dr. Soneye&apos;s voice.
        </p>
      </div>

      {/* ── County selector ── */}
      <div className="mb-8">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-white/30">
          Select County
        </p>

        <div className="relative max-w-sm">
          {/* Trigger button */}
          <button
            onClick={() => setDropdown(!showDropdown)}
            className="flex w-full items-center justify-between gap-3 rounded-xl border border-white/15 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white transition-colors hover:border-white/25 hover:bg-white/[0.07]"
          >
            <span className="flex items-center gap-2">
              <MapPin className="h-4 w-4 shrink-0" style={{ color: "var(--brand-accent)" }} />
              {selected} County
            </span>
            <span className="text-white/40 text-xs">
              {showDropdown ? "▲" : "▼"}
            </span>
          </button>

          {/* Dropdown panel */}
          {showDropdown && (
            <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-xl border border-white/15 bg-[#12243f] shadow-2xl overflow-hidden">
              {/* Search within dropdown */}
              <div className="p-2 border-b border-white/10">
                <div className="flex items-center gap-2 rounded-lg bg-white/[0.06] px-3 py-2">
                  <Search className="h-3.5 w-3.5 text-white/30 shrink-0" />
                  <input
                    autoFocus
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search county…"
                    className="flex-1 bg-transparent text-sm text-white placeholder-white/30 outline-none"
                  />
                </div>
              </div>
              {/* County list */}
              <div className="max-h-60 overflow-y-auto">
                {filteredCounties.length === 0 ? (
                  <p className="px-4 py-3 text-xs text-white/30">No matches</p>
                ) : (
                  filteredCounties.map(c => {
                    const hasNews = (data.counties[c]?.articles?.length ?? 0) > 0;
                    return (
                      <button
                        key={c}
                        onClick={() => selectCounty(c)}
                        className={`flex w-full items-center justify-between px-4 py-2.5 text-sm text-left transition-colors hover:bg-white/[0.07] ${
                          c === selected ? "bg-white/[0.08] font-semibold" : ""
                        }`}
                      >
                        <span>{c} County</span>
                        {hasNews && (
                          <span
                            className="rounded-full w-1.5 h-1.5 shrink-0"
                            style={{ background: "var(--brand-accent)" }}
                            title="Has recent news"
                          />
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* County pills — quick access to Cape Fear Basin hot counties */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {["New Hanover","Brunswick","Cumberland","Bladen","Pender","Wake","Mecklenburg","Durham","Guilford"].map(c => (
            <button
              key={c}
              onClick={() => selectCounty(c)}
              className="rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all"
              style={
                c === selected
                  ? { borderColor: "var(--brand-accent)", color: "var(--brand-accent)", background: "rgba(0,212,170,0.08)" }
                  : { borderColor: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.45)" }
              }
            >
              {c}
            </button>
          ))}
          <span className="self-center text-[10px] text-white/20 ml-1">quick select</span>
        </div>
      </div>

      {/* ── Selected county panel ── */}
      <div>
        {/* County title row */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <MapPin className="h-5 w-5" style={{ color: "var(--brand-accent)" }} />
            <h2 className="text-xl font-bold">{selected} County</h2>
            <span className="text-sm text-white/40">·</span>
            <span className="text-sm text-white/40">{hasArticles ? `${articles.length} article${articles.length !== 1 ? "s" : ""}` : "no recent news"}</span>
          </div>
          {entry?.lastUpdated && (
            <span className="text-[11px] text-white/25">{timeAgo(entry.lastUpdated)}</span>
          )}
        </div>

        {/* Gemma analysis card */}
        {entry?.analysis && (
          <div
            className="mb-6 rounded-2xl border border-[var(--brand-accent)]/20 p-5"
            style={{ background: "rgba(0,212,170,0.04)" }}
          >
            <div className="flex items-center gap-2 mb-3">
              <FlaskConical className="h-4 w-4" style={{ color: "var(--brand-accent)" }} />
              <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--brand-accent)" }}>
                Expert Analysis · Dr. Soneye / Gemma 4
              </span>
            </div>
            <p className="text-sm text-white/70 font-[var(--font-source-sans)] leading-relaxed">
              {entry.analysis}
            </p>
          </div>
        )}

        {/* Articles */}
        {hasArticles ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {articles.map((a, i) => (
              <ArticleCard key={a.url + i} article={a} index={i} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-10 text-center">
            <Newspaper className="mx-auto mb-3 h-8 w-8 text-white/20" />
            <p className="text-sm font-semibold text-white/40">
              No recent PFAS-related news found for {selected} County
            </p>
            <p className="mt-1 text-xs text-white/25 font-[var(--font-source-sans)]">
              This county may not have had recent reportable contaminant events.
              Check the{" "}
              <a href="/dashboard" className="underline" style={{ color: "var(--brand-accent)" }}>
                live dashboard
              </a>{" "}
              for measured PFAS levels.
            </p>
          </div>
        )}
      </div>

      {/* Data attribution */}
      <p className="mt-10 text-center text-[10px] text-white/20 font-[var(--font-source-sans)]">
        News sourced via Google News RSS · AI analysis by Gemma 4 (gemma-4-E4B-it-Q5_K_M) ·
        Data refreshed nightly · Always verify articles at the source
      </p>
    </div>
  );
}
