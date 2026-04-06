#!/usr/bin/env node
/**
 * Tosson Analytics — County News Pipeline
 *
 * For each of the 100 NC counties:
 *   1. Queries Google News RSS for PFAS / water-quality news
 *   2. Falls back to broader contaminant queries if nothing found
 *   3. Starts llama-server once, sends HTTP requests per county (fast)
 *   4. Writes  public/data/county-news.json
 *
 * Run:       node scripts/fetch-county-news.js
 * Single:    node scripts/fetch-county-news.js --county=Wake
 * No AI:     node scripts/fetch-county-news.js --no-ai
 * Force all: node scripts/fetch-county-news.js --force
 */

import { writeFileSync, readFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath }  from "url";
import { spawn }          from "child_process";

const __dirname  = dirname(fileURLToPath(import.meta.url));
const ROOT       = join(__dirname, "..");
const OUT_FILE   = join(ROOT, "public", "data", "county-news.json");
const LLAMA_SRV  = "/data/data/com.termux/files/home/llama.cpp/build/bin/llama-server";
const MODEL_PATH = "/data/data/com.termux/files/home/llama.cpp/gemma-4-E4B-it-Q5_K_M.gguf";
const SRV_PORT   = 18088;
const SRV_URL    = `http://127.0.0.1:${SRV_PORT}`;

// ── All 100 NC counties ────────────────────────────────────────────────────────
const NC_COUNTIES = [
  { county:"Alamance",     fips:"37001" }, { county:"Alexander",    fips:"37003" },
  { county:"Alleghany",    fips:"37005" }, { county:"Anson",        fips:"37007" },
  { county:"Ashe",         fips:"37009" }, { county:"Avery",        fips:"37011" },
  { county:"Beaufort",     fips:"37013" }, { county:"Bertie",       fips:"37015" },
  { county:"Bladen",       fips:"37017" }, { county:"Brunswick",    fips:"37019" },
  { county:"Buncombe",     fips:"37021" }, { county:"Burke",        fips:"37023" },
  { county:"Cabarrus",     fips:"37025" }, { county:"Caldwell",     fips:"37027" },
  { county:"Camden",       fips:"37029" }, { county:"Carteret",     fips:"37031" },
  { county:"Caswell",      fips:"37033" }, { county:"Catawba",      fips:"37035" },
  { county:"Chatham",      fips:"37037" }, { county:"Cherokee",     fips:"37039" },
  { county:"Chowan",       fips:"37041" }, { county:"Clay",         fips:"37043" },
  { county:"Cleveland",    fips:"37045" }, { county:"Columbus",     fips:"37047" },
  { county:"Craven",       fips:"37049" }, { county:"Cumberland",   fips:"37051" },
  { county:"Currituck",    fips:"37053" }, { county:"Dare",         fips:"37055" },
  { county:"Davidson",     fips:"37057" }, { county:"Davie",        fips:"37059" },
  { county:"Duplin",       fips:"37061" }, { county:"Durham",       fips:"37063" },
  { county:"Edgecombe",    fips:"37065" }, { county:"Forsyth",      fips:"37067" },
  { county:"Franklin",     fips:"37069" }, { county:"Gaston",       fips:"37071" },
  { county:"Gates",        fips:"37073" }, { county:"Graham",       fips:"37075" },
  { county:"Granville",    fips:"37077" }, { county:"Greene",       fips:"37079" },
  { county:"Guilford",     fips:"37081" }, { county:"Halifax",      fips:"37083" },
  { county:"Harnett",      fips:"37085" }, { county:"Haywood",      fips:"37087" },
  { county:"Henderson",    fips:"37089" }, { county:"Hertford",     fips:"37091" },
  { county:"Hoke",         fips:"37093" }, { county:"Hyde",         fips:"37095" },
  { county:"Iredell",      fips:"37097" }, { county:"Jackson",      fips:"37099" },
  { county:"Johnston",     fips:"37101" }, { county:"Jones",        fips:"37103" },
  { county:"Lee",          fips:"37105" }, { county:"Lenoir",       fips:"37107" },
  { county:"Lincoln",      fips:"37109" }, { county:"McDowell",     fips:"37111" },
  { county:"Macon",        fips:"37113" }, { county:"Madison",      fips:"37115" },
  { county:"Martin",       fips:"37117" }, { county:"Mecklenburg",  fips:"37119" },
  { county:"Mitchell",     fips:"37121" }, { county:"Montgomery",   fips:"37123" },
  { county:"Moore",        fips:"37125" }, { county:"Nash",         fips:"37127" },
  { county:"New Hanover",  fips:"37129" }, { county:"Northampton",  fips:"37131" },
  { county:"Onslow",       fips:"37133" }, { county:"Orange",       fips:"37135" },
  { county:"Pamlico",      fips:"37137" }, { county:"Pasquotank",   fips:"37139" },
  { county:"Pender",       fips:"37141" }, { county:"Perquimans",   fips:"37143" },
  { county:"Person",       fips:"37145" }, { county:"Pitt",         fips:"37147" },
  { county:"Polk",         fips:"37149" }, { county:"Randolph",     fips:"37151" },
  { county:"Richmond",     fips:"37153" }, { county:"Robeson",      fips:"37155" },
  { county:"Rockingham",   fips:"37157" }, { county:"Rowan",        fips:"37159" },
  { county:"Rutherford",   fips:"37161" }, { county:"Sampson",      fips:"37163" },
  { county:"Scotland",     fips:"37165" }, { county:"Stanly",       fips:"37167" },
  { county:"Stokes",       fips:"37169" }, { county:"Surry",        fips:"37171" },
  { county:"Swain",        fips:"37173" }, { county:"Transylvania", fips:"37175" },
  { county:"Tyrrell",      fips:"37177" }, { county:"Union",        fips:"37179" },
  { county:"Vance",        fips:"37181" }, { county:"Wake",         fips:"37183" },
  { county:"Warren",       fips:"37185" }, { county:"Washington",   fips:"37187" },
  { county:"Watauga",      fips:"37189" }, { county:"Wayne",        fips:"37191" },
  { county:"Wilkes",       fips:"37193" }, { county:"Wilson",       fips:"37195" },
  { county:"Yadkin",       fips:"37197" }, { county:"Yancey",       fips:"37199" },
];

const PFAS_KEYWORDS = [
  "pfas","pfoa","pfos","genx","hfpo-da","forever chemical","1,4-dioxane",
  "emerging contaminant","chemours","cape fear","water contamination",
  "drinking water","wastewater","biosolid","contaminant","pollutant",
  "water quality","epa","deq","groundwater","remediation","treatment plant",
];

function isRelevant(text) {
  const l = text.toLowerCase();
  return PFAS_KEYWORDS.some(k => l.includes(k));
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── RSS parser ─────────────────────────────────────────────────────────────────
function parseRSS(xml) {
  const items = [];
  const re = /<item>([\s\S]*?)<\/item>/g;
  let m;
  while ((m = re.exec(xml)) !== null) {
    const b = m[1];
    const get = (tag) => {
      const t = b.match(new RegExp(
        `<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>|<${tag}[^>]*>([^<]*)</${tag}>`
      ));
      return (t?.[1] ?? t?.[2] ?? "").trim();
    };
    const linkMatch = b.match(/<link>([^<]+)<\/link>/);
    const link   = linkMatch?.[1]?.trim() || get("link");
    const title  = get("title");
    const pubDate= get("pubDate");
    const desc   = get("description").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    const srcMatch = b.match(/<source[^>]*>([^<]*)<\/source>/);
    const source = srcMatch?.[1]?.trim() || "News";
    if (title && link) items.push({ title, url: link, pubDate, snippet: desc.slice(0, 280), source });
  }
  return items;
}

function isoDate(pubDate) {
  try {
    const d = pubDate ? new Date(pubDate) : new Date();
    return isNaN(d.getTime()) ? new Date().toISOString().split("T")[0] : d.toISOString().split("T")[0];
  } catch { return new Date().toISOString().split("T")[0]; }
}

// ── Google News RSS ────────────────────────────────────────────────────────────
async function fetchGoogleNews(query, retries = 2) {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; TossonAnalytics/2.0)" },
        signal: AbortSignal.timeout(12_000),
      });
      if (!res.ok) return [];
      const xml = await res.text();
      return parseRSS(xml).map(a => ({ ...a, date: isoDate(a.pubDate) }));
    } catch {
      if (i < retries) await sleep(2000 * (i + 1));
    }
  }
  return [];
}

async function fetchCountyNews(county) {
  const queries = [
    `PFAS "${county} County" "North Carolina"`,
    `"water contamination" OR "drinking water" OR "water quality" "${county} County" NC`,
    `"${county} County" "North Carolina" contamination OR "water treatment" OR "DEQ" OR "EPA"`,
  ];
  const seen = new Set();
  const results = [];
  for (let i = 0; i < queries.length; i++) {
    if (results.length >= 5) break;
    const items = await fetchGoogleNews(queries[i]);
    for (const item of items) {
      if (seen.has(item.url)) continue;
      if (!isRelevant(item.title + " " + item.snippet)) continue;
      seen.add(item.url);
      results.push(item);
      if (results.length >= 6) break;
    }
    if (i < queries.length - 1) await sleep(700);
  }
  return results.slice(0, 5);
}

// ── llama-server lifecycle ─────────────────────────────────────────────────────
let serverProc = null;

async function startServer() {
  console.log("  → Starting llama-server (loading Gemma 4)…");
  serverProc = spawn(
    LLAMA_SRV,
    [
      "--model",     MODEL_PATH,
      "--port",      String(SRV_PORT),
      "--ctx-size",  "4096",
      "-rea",        "off",       // disable chain-of-thought / thinking
      "--log-disable",
      "-np",         "1",         // 1 slot
    ],
    { stdio: ["ignore", "ignore", "ignore"] }
  );

  serverProc.on("error", err => console.error("  ✗ llama-server error:", err.message));

  // Wait until /health returns ok (up to 120s)
  for (let i = 0; i < 40; i++) {
    await sleep(3000);
    try {
      const r = await fetch(`${SRV_URL}/health`, { signal: AbortSignal.timeout(2000) });
      if (r.ok) {
        const j = await r.json();
        if (j.status === "ok" || j.status === "no slot available yet" || j.slots_idle !== undefined) {
          console.log("  ✓ llama-server ready\n");
          return true;
        }
      }
    } catch { /* still starting */ }
  }
  console.warn("  ⚠ llama-server did not become ready in 120s");
  return false;
}

function stopServer() {
  if (serverProc) { serverProc.kill("SIGTERM"); serverProc = null; }
}

// ── Gemma 4 via HTTP ───────────────────────────────────────────────────────────
async function generateAnalysis(county, articles) {
  const articleList = articles
    .map((a, i) => `${i + 1}. "${a.title}" (${a.source}, ${a.date})\n   ${a.snippet}`)
    .join("\n\n");

  const messages = [
    {
      role: "user",
      content:
        `You are Dr. Temitope D. Soneye, PhD, founder of Tosson Environmental Analytics LLC ` +
        `and a leading PFAS expert in North Carolina.\n\n` +
        `Write a concise 2-3 sentence expert analysis of the current PFAS and water quality ` +
        `situation in ${county} County, NC, based on these recent news articles. ` +
        `Reference specific details. Be direct, authoritative, and scientific. ` +
        `Flowing prose only — no bullet points.\n\n` +
        `Articles:\n${articleList}\n\n` +
        `Write ONLY the 2-3 sentence paragraph. Nothing else.`,
    },
  ];

  try {
    const res = await fetch(`${SRV_URL}/v1/chat/completions`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages,
        max_tokens:      280,
        temperature:     0.65,
        top_p:           0.9,
        repeat_penalty:  1.1,
      }),
      signal: AbortSignal.timeout(240_000),
    });

    if (!res.ok) {
      console.warn(`    ⚠ Server HTTP ${res.status} for ${county}`);
      return "";
    }

    const data = await res.json();
    let text = data.choices?.[0]?.message?.content?.trim() ?? "";

    // Cut at last complete sentence
    const last = Math.max(text.lastIndexOf("."), text.lastIndexOf("!"), text.lastIndexOf("?"));
    if (last > 60) text = text.slice(0, last + 1);
    return text.trim();
  } catch (err) {
    console.warn(`    ⚠ Gemma HTTP error for ${county}: ${err.message.slice(0, 80)}`);
    return "";
  }
}

// ── Persistence helpers ────────────────────────────────────────────────────────
function loadExisting() {
  try {
    return existsSync(OUT_FILE)
      ? JSON.parse(readFileSync(OUT_FILE, "utf-8"))
      : { generated: "", counties: {} };
  } catch { return { generated: "", counties: {} }; }
}

function isStale(entry) {
  if (!entry?.lastUpdated) return true;
  return (Date.now() - new Date(entry.lastUpdated).getTime()) / 3_600_000 > 23;
}

// ── Main ───────────────────────────────────────────────────────────────────────
async function main() {
  const args        = process.argv.slice(2);
  const onlyCounty  = args.find(a => a.startsWith("--county="))?.split("=")[1];
  const noAI        = args.includes("--no-ai") || !existsSync(LLAMA_SRV) || !existsSync(MODEL_PATH);
  const force       = args.includes("--force");

  console.log("🗺  Tosson Analytics — County News Pipeline");
  console.log(`   AI analysis : ${noAI ? "disabled (--no-ai or model not found)" : "Gemma 4 via llama-server"}`);
  if (onlyCounty) console.log(`   County      : ${onlyCounty}`);
  console.log();

  mkdirSync(join(ROOT, "public", "data"), { recursive: true });
  const existing = loadExisting();

  const targets = onlyCounty
    ? NC_COUNTIES.filter(c => c.county.toLowerCase() === onlyCounty.toLowerCase())
    : NC_COUNTIES;

  // Determine which counties actually need processing
  const toProcess = force
    ? targets
    : targets.filter(c => isStale(existing.counties[c.county]));

  const staleCount = toProcess.length;
  const freshCount = targets.length - staleCount;
  console.log(`   ${staleCount} to update, ${freshCount} already fresh\n`);

  if (staleCount === 0) {
    console.log("ℹ️  All counties are up to date. Use --force to refresh all.");
    return;
  }

  // Start Gemma server once if AI is enabled
  let serverReady = false;
  if (!noAI) {
    serverReady = await startServer();
    if (!serverReady) console.warn("  ⚠ Continuing without AI analysis\n");
  }

  let processed = 0;

  try {
    for (let i = 0; i < toProcess.length; i++) {
      const { county, fips } = toProcess[i];

      process.stdout.write(`  [${String(i + 1).padStart(3)}/${staleCount}] ${county.padEnd(16)} `);

      // Scrape news
      const articles = await fetchCountyNews(county);
      process.stdout.write(`${articles.length} article${articles.length !== 1 ? "s" : ""}`);

      // AI analysis
      let analysis = "";
      if (serverReady && articles.length > 0) {
        process.stdout.write(" → Gemma…");
        analysis = await generateAnalysis(county, articles);
        process.stdout.write(analysis ? " ✓" : " (empty)");
      }
      process.stdout.write("\n");

      existing.counties[county] = { county, fips, lastUpdated: new Date().toISOString(), analysis, articles };
      processed++;

      // Save incrementally every 10 counties (crash-safe)
      if (processed % 10 === 0) {
        existing.generated = new Date().toISOString();
        writeFileSync(OUT_FILE, JSON.stringify(existing, null, 2));
      }

      if (i < toProcess.length - 1) await sleep(1000);
    }
  } finally {
    stopServer();
  }

  existing.generated = new Date().toISOString();
  writeFileSync(OUT_FILE, JSON.stringify(existing, null, 2));

  console.log(`\n✅  Done — ${processed} counties updated`);
  console.log(`   Output: public/data/county-news.json`);
}

process.on("SIGINT",  () => { stopServer(); process.exit(0); });
process.on("SIGTERM", () => { stopServer(); process.exit(0); });

main().catch(err => { stopServer(); console.error("❌ Pipeline failed:", err); process.exit(1); });
