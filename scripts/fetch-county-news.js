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

// ── Knowledge report parser (nc-pfas-scout output) ───────────────────────────
const KNOWLEDGE_FILE = join(
  process.env.HOME || "/root",
  "knowledge", "nc-pfas-report.md"
);

/**
 * Parse articles from the nc-pfas-scout markdown report.
 * Handles two formats:
 *   • Title — Source\n  📎 URL\n  ↳ Snippet
 *   • Title\n  📎 URL\n  ↳ Snippet
 */
function parseKnowledgeReport(text) {
  const articles = [];
  // Match bullet blocks: • title [— source] \n  📎 url \n  ↳ snippet
  const re = /•\s+(.+?)(?:\s+[—–-]\s+([^\n]+?))?\s*\n\s+📎\s+(https?:\/\/\S+)\s*\n\s+↳\s+([^\n]+)/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    const title   = m[1].trim().replace(/\*\*/g, "");
    const source  = (m[2] ?? "").trim() || inferSource(m[3].trim());
    const url     = m[3].trim();
    const snippet = m[4].trim();
    articles.push({ title, source, url, snippet, date: new Date().toISOString().split("T")[0] });
  }
  return articles;
}

function inferSource(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "").split(".")[0];
  } catch { return "Report"; }
}

/**
 * Return knowledge articles relevant to a given county.
 * An article matches if the county name appears in its title or snippet,
 * OR if it references a place known to be in that county.
 */
const COUNTY_ALIASES = {
  "New Hanover": ["wilmington", "new hanover"],
  "Cumberland":  ["fayetteville", "cumberland", "fayetteville works"],
  "Bladen":      ["bladen", "elizabethtown"],
  "Robeson":     ["robeson", "lumberton"],
  "Sampson":     ["sampson", "clinton"],
  "Hoke":        ["hoke", "raeford"],
  "Harnett":     ["harnett", "lillington"],
  "Chatham":     ["chatham", "pittsboro"],
  "Brunswick":   ["brunswick", "bolivia"],
  "Pender":      ["pender", "burgaw"],
  "Duplin":      ["duplin", "kenansville"],
};

function knowledgeArticlesForCounty(county, articles) {
  const aliases = COUNTY_ALIASES[county] ?? [county.toLowerCase()];
  return articles.filter(a => {
    const hay = (a.title + " " + a.snippet).toLowerCase();
    return aliases.some(alias => hay.includes(alias));
  });
}

function loadKnowledgeArticles() {
  try {
    if (!existsSync(KNOWLEDGE_FILE)) return [];
    const text = readFileSync(KNOWLEDGE_FILE, "utf-8");
    const articles = parseKnowledgeReport(text);
    if (articles.length) console.log(`  📋 Knowledge report: ${articles.length} curated articles loaded`);
    return articles;
  } catch (e) {
    console.warn("  ⚠ Could not read knowledge report:", e.message);
    return [];
  }
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

async function fetchCountyNews(county, knowledgeArticles = []) {
  const seen = new Set();
  const results = [];

  // 1. Seed with curated knowledge articles first (highest quality)
  const curated = knowledgeArticlesForCounty(county, knowledgeArticles);
  for (const a of curated) {
    if (seen.has(a.url)) continue;
    seen.add(a.url);
    results.push(a);
  }

  // 2. Fill remaining slots from Google News RSS
  const queries = [
    `PFAS "${county} County" "North Carolina"`,
    `"water contamination" OR "drinking water" OR "water quality" "${county} County" NC`,
    `"${county} County" "North Carolina" contamination OR "water treatment" OR "DEQ" OR "EPA"`,
  ];
  for (let i = 0; i < queries.length; i++) {
    if (results.length >= 6) break;
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

  return results.slice(0, 6);
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

// ── AI provider cascade ────────────────────────────────────────────────────────
// Priority: 1. Gemma 4 (local llama-server)  2. Blockrun local  3. OpenRouter
const BLOCKRUN_URL  = "http://127.0.0.1:8402/v1";
const BLOCKRUN_KEY  = process.env.BLOCKRUN_API_KEY || "x402-proxy-handles-auth";
const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY || "";

// Models to try on OpenRouter when local is unavailable
const OPENROUTER_MODELS = [
  "qwen/qwen3-30b-a3b:free",
  "qwen/qwen-2.5-72b-instruct:free",
  "google/gemma-3-12b-it:free",
];

function buildPrompt(county, articles) {
  const articleList = articles
    .map((a, i) => `${i + 1}. "${a.title}" (${a.source}, ${a.date})\n   ${a.snippet || a.title}`)
    .join("\n\n");
  return [
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
}

function trimToSentence(text) {
  const last = Math.max(text.lastIndexOf("."), text.lastIndexOf("!"), text.lastIndexOf("?"));
  return last > 60 ? text.slice(0, last + 1).trim() : text.trim();
}

async function callChatAPI({ url, apiKey, model, messages, timeoutMs = 240_000 }) {
  const headers = { "Content-Type": "application/json" };
  if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;
  const body = { messages, max_tokens: 280, temperature: 0.65, top_p: 0.9 };
  if (model) body.model = model;
  const res = await fetch(`${url}/chat/completions`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() ?? "";
}

async function generateAnalysis(county, articles) {
  const messages = buildPrompt(county, articles);

  // 1. Try local Gemma 4 via llama-server
  if (serverProc) {
    try {
      const text = await callChatAPI({ url: SRV_URL, messages });
      if (text) return trimToSentence(text);
    } catch (err) {
      console.warn(`    ⚠ Gemma local error for ${county}: ${err.message.slice(0, 60)}`);
    }
  }

  // 2. Try blockrun local API
  try {
    const text = await callChatAPI({
      url: BLOCKRUN_URL, apiKey: BLOCKRUN_KEY,
      model: "premium", messages, timeoutMs: 60_000,
    });
    if (text) { process.stdout.write(" [blockrun]"); return trimToSentence(text); }
  } catch { /* fall through */ }

  // 3. Try OpenRouter with Qwen / Gemma free models
  if (OPENROUTER_KEY) {
    for (const model of OPENROUTER_MODELS) {
      try {
        const text = await callChatAPI({
          url: "https://openrouter.ai/api/v1", apiKey: OPENROUTER_KEY,
          model, messages, timeoutMs: 45_000,
        });
        if (text) { process.stdout.write(` [${model.split("/")[1]}]`); return trimToSentence(text); }
      } catch { /* try next */ }
    }
  }

  return "";
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
  const hasLocalGemma   = existsSync(LLAMA_SRV) && existsSync(MODEL_PATH);
  const hasBlockrun     = await fetch(`${BLOCKRUN_URL}/models`, { signal: AbortSignal.timeout(2000) }).then(r => r.ok).catch(() => false);
  const hasOpenRouter   = !!OPENROUTER_KEY;
  const noAI            = args.includes("--no-ai") || (!hasLocalGemma && !hasBlockrun && !hasOpenRouter);
  const force       = args.includes("--force");

  console.log("🗺  Tosson Analytics — County News Pipeline");
  const aiProvider = noAI ? "disabled" : hasLocalGemma ? "Gemma 4 (local)" : hasBlockrun ? "Blockrun (local)" : "OpenRouter (Qwen/Gemma free)";
  console.log(`   AI analysis : ${aiProvider}`);
  if (onlyCounty) console.log(`   County      : ${onlyCounty}`);
  console.log();

  mkdirSync(join(ROOT, "public", "data"), { recursive: true });
  const existing = loadExisting();
  const knowledgeArticles = loadKnowledgeArticles();

  const targets = onlyCounty
    ? NC_COUNTIES.filter(c => c.county.toLowerCase() === onlyCounty.toLowerCase())
    : NC_COUNTIES;

  // Counties that have new knowledge articles need a refresh even if recently updated
  const countiesWithNewKnowledge = new Set(
    knowledgeArticles.flatMap(a =>
      NC_COUNTIES
        .filter(({ county }) => knowledgeArticlesForCounty(county, [a]).length > 0)
        .map(({ county }) => county)
    )
  );

  // Determine which counties actually need processing
  const toProcess = force
    ? targets
    : targets.filter(c =>
        isStale(existing.counties[c.county]) || countiesWithNewKnowledge.has(c.county)
      );

  const staleCount = toProcess.length;
  const freshCount = targets.length - staleCount;
  console.log(`   ${staleCount} to update, ${freshCount} already fresh\n`);

  if (staleCount === 0) {
    console.log("ℹ️  All counties are up to date. Use --force to refresh all.");
    return;
  }

  // Start local Gemma server if available
  let serverReady = false;
  if (!noAI && hasLocalGemma) {
    serverReady = await startServer();
    if (!serverReady) console.warn("  ⚠ llama-server failed — will fall back to blockrun/OpenRouter\n");
  }

  let processed = 0;

  try {
    for (let i = 0; i < toProcess.length; i++) {
      const { county, fips } = toProcess[i];

      process.stdout.write(`  [${String(i + 1).padStart(3)}/${staleCount}] ${county.padEnd(16)} `);

      // Scrape news
      const articles = await fetchCountyNews(county, knowledgeArticles);
      process.stdout.write(`${articles.length} article${articles.length !== 1 ? "s" : ""}`);

      // AI analysis (tries Gemma → blockrun → OpenRouter)
      let analysis = "";
      if (!noAI && articles.length > 0) {
        process.stdout.write(" → AI…");
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
