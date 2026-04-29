#!/usr/bin/env node
/**
 * Tosson Analytics — AI Insights Pipeline
 *
 * Scrapes PFAS / water-quality news from public RSS feeds, then uses the
 * local Gemma 4 model (via llama-cli) OR OpenRouter to write a full editorial 
 * MDX article in Tosson's voice for each new story found.
 *
 * Run:  node scripts/fetch-insights.js
 * Cron: nightly alongside fetch-pfas-data.js
 */

import { writeFileSync, readFileSync, readdirSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);
const HOME         = process.env.HOME || "/home/temitope";
const __dirname    = dirname(fileURLToPath(import.meta.url));
const ROOT         = join(__dirname, "..");
const CONTENT_DIR  = join(ROOT, "content", "insights");

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── Load ~/.hermes/.env ──────────────────────────────────────────────────────
const ENV_PATH = join(HOME, ".hermes", ".env");
if (existsSync(ENV_PATH)) {
  const envText = readFileSync(ENV_PATH, "utf-8");
  for (const line of envText.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const [key, ...vals] = trimmed.split("=");
      const val = vals.join("=").trim().replace(/^["']|["']$/g, "");
      process.env[key.trim()] = val;
    }
  }
}

const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY || "";

// ── Portable Llama Paths ──────────────────────────────────────────────────────
const TERMUX_BASE  = "/data/data/com.termux/files/home/llama.cpp";
const LOCAL_BASE   = join(HOME, "llama.cpp");
const LLAMA_BASE   = existsSync(TERMUX_BASE) ? TERMUX_BASE : LOCAL_BASE;

const LLAMA_CLI    = join(LLAMA_BASE, "build", "bin", "llama-cli");
const MODEL_PATH   = join(LLAMA_BASE, "gemma-4-E4B-it-Q5_K_M.gguf");

mkdirSync(CONTENT_DIR, { recursive: true });

// ── RSS feed sources ──────────────────────────────────────────────────────────
const FEEDS = [
  {
    name: "EPA News",
    url: "https://www.epa.gov/newsreleases/search/rss/region/04",
  },
  {
    name: "NC DEQ News",
    url: "https://deq.nc.gov/news/rss.xml",
  },
  {
    name: "NC Newsline Environment",
    url: "https://ncnewsline.com/category/environment/feed/",
  },
  {
    name: "Cape Fear Public Utility",
    url: "https://www.cfpua.org/rss.aspx?CID=25",
  },
  {
    name: "Environmental Health News",
    url: "https://www.ehn.org/feed",
  },
  {
    name: "WUNC Environment",
    url: "https://www.wunc.org/term/environment/feed",
  },
  {
    name: "NC Health News",
    url: "https://www.northcarolinahealthnews.org/category/environment/feed/",
  },
];

// Keywords to filter for relevance
const PFAS_KEYWORDS = [
  "pfas", "pfoa", "pfos", "genx", "hfpo-da", "forever chemical",
  "1,4-dioxane", "emerging contaminant", "chemours", "cape fear",
  "nc deq", "ucmr", "emc hearing", "water contamination", "nc emc",
  "hb 881", "hb 569", "pfas free", "polluter", "remediation",
  "drinking water", "wastewater", "biosolid", "sludge",
];

function isRelevant(text) {
  const lower = text.toLowerCase();
  return PFAS_KEYWORDS.some((kw) => lower.includes(kw));
}

// ── Parse RSS XML (no external deps) ─────────────────────────────────────────
function parseRSS(xml) {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const get   = (tag) => {
      const m = block.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>|<${tag}[^>]*>([^<]*)</${tag}>`));
      return (m?.[1] ?? m?.[2] ?? "").trim();
    };
    const title   = get("title");
    const link    = get("link") || block.match(/<link>([^<]+)<\/link>/)?.[1]?.trim() || "";
    const pubDate = get("pubDate");
    const desc    = get("description");
    if (title && link) items.push({ title, link, pubDate, desc });
  }
  return items;
}

// ── Fetch a single feed ───────────────────────────────────────────────────────
async function fetchFeed(feed) {
  try {
    const res = await fetch(feed.url, {
      headers: { "User-Agent": "TossonAnalytics/2.0 (research aggregator)" },
      signal:  AbortSignal.timeout(15_000),
    });
    if (!res.ok) { console.warn(`  ⚠ ${feed.name}: HTTP ${res.status}`); return []; }
    const xml  = await res.text();
    const items = parseRSS(xml);
    console.log(`  ✓ ${feed.name}: ${items.length} items`);
    return items.map((i) => ({ ...i, source: feed.name }));
  } catch (err) {
    console.warn(`  ⚠ ${feed.name}: ${err.message}`);
    return [];
  }
}

// ── Slug generation ───────────────────────────────────────────────────────────
function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[^\\w\\s-]/g, "")
    .replace(/\\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60)
    .replace(/-$/, "");
}

function isoDate(pubDate) {
  try {
    const d = pubDate ? new Date(pubDate) : new Date();
    if (isNaN(d.getTime())) return new Date().toISOString().split("T")[0];
    return d.toISOString().split("T")[0];
  } catch {
    return new Date().toISOString().split("T")[0];
  }
}

// ── Get existing slugs to avoid duplicates ────────────────────────────────────
function getExistingSlugs() {
  try {
    return new Set(
      readdirSync(CONTENT_DIR)
        .filter((f) => f.endsWith(".mdx"))
        .map((f) => f.replace(/\.mdx$/, ""))
    );
  } catch {
    return new Set();
  }
}

// ── AI generation ────────────────────────────────────────────────────────────
async function generateArticle(item) {
  const today = new Date().toISOString().split("T")[0];

  const systemPrompt = `You are Dr. Temitope D. Soneye, PhD, founder of Tosson Environmental Analytics LLC. You are a peer-reviewed environmental scientist specialising in PFAS contamination, hydrothermal liquefaction of municipal sludge, GenX destruction technologies, and North Carolina water quality policy.`;

  const userPrompt = `Write a detailed, authoritative editorial article in MDX format based on the following news item. The article should:
- Be written entirely in Markdown (no JSX components — plain MDX)
- Include a YAML frontmatter block at the top
- Be 600–900 words of substantive body text
- Reference the source article and provide expert scientific and regulatory context
- Connect the news to broader NC PFAS policy, EPA MCLs, or municipal water system implications where relevant
- Use proper Markdown headings (## for sections, ### for subsections)
- Be written in first-person expert voice as Dr. Soneye
- Only include real, verifiable facts — do not invent statistics

News item:
Title: ${item.title}
Source: ${item.source}
Published: ${item.pubDate || today}
URL: ${item.link}
Summary: ${item.desc || "(no summary provided)"}

Write the complete MDX file now, starting with the --- frontmatter block. Use this exact frontmatter structure:
---
title: "Article title here"
date: "${today}"
author: "Dr. Temitope D. Soneye, PhD"
tags: ["tag1", "tag2"]
summary: "One sentence summary for the article card."
sourceUrl: "${item.link}"
sourceName: "${item.source}"
---`;

  // 1. Try Local llama-cli
  if (existsSync(LLAMA_CLI) && existsSync(MODEL_PATH)) {
    console.log(`  → Running Gemma 4 for: "${item.title.slice(0, 60)}…"`);
    try {
      const fullPrompt = `<start_of_turn>user\n${systemPrompt}\n\n${userPrompt}\n<end_of_turn>\n<start_of_turn>model\n`;
      const { stdout } = await execFileAsync(
        LLAMA_CLI,
        ["--model", MODEL_PATH, "--prompt", fullPrompt, "--n-predict", "1200", "--temp", "0.7", "--no-display-prompt", "--log-disable", "-c", "4096"],
        { timeout: 300_000, maxBuffer: 10 * 1024 * 1024 }
      );
      const start = stdout.indexOf("---");
      if (start !== -1) return stdout.slice(start).trim();
    } catch (e) { console.warn(`    ⚠ Local Gemma failed: ${e.message}`); }
  }

const OPENROUTER_MODELS = [
  "nvidia/nemotron-3-super-120b-a12b:free",
  "nousresearch/hermes-3-llama-3.1-405b:free",
  "google/gemma-3-12b-it:free",
  "qwen/qwen-2.5-72b-instruct:free",
];

// ... (inside generateArticle)

  // 2. Try OpenRouter Fallback
  if (OPENROUTER_KEY) {
    console.log(`  → Falling back to OpenRouter for: "${item.title.slice(0, 60)}…"`);
    for (const model of OPENROUTER_MODELS) {
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: { "Authorization": `Bearer ${OPENROUTER_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              model,
              messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
              temperature: 0.7,
              max_tokens: 3000
            }),
            signal: AbortSignal.timeout(120_000)
          });
          
          if (res.status === 429) {
             console.warn(`    ⚠ Rate limited on ${model}, waiting...`);
             await sleep(10000);
             continue;
          }

          if (res.ok) {
            const data = await res.json();
            const content = data.choices[0].message.content.trim();
            const mdxStart = content.indexOf("---");
            if (mdxStart !== -1) {
               const mdx = content.slice(mdxStart).trim();
               if (mdx.length > 500) {
                  process.stdout.write(` [${model.split("/")[1].split(":")[0]}] ✓`);
                  return mdx;
               }
            } else if (content.length > 500) {
               return `---\ntitle: "${item.title}"\ndate: "${today}"\nauthor: "Dr. Temitope D. Soneye, PhD"\ntags: ["pfas", "nc"]\nsummary: "${item.title}"\nsourceUrl: "${item.link}"\nsourceName: "${item.source}"\n---\n\n${content}`;
            }
          }
          break; // move to next model if not ok and not 429
        } catch (e) { 
           console.warn(`    ⚠ OpenRouter ${model} failed: ${e.message}`); 
           await sleep(2000);
        }
      }
    }
  }

  return null;
}

// ── Write MDX file ────────────────────────────────────────────────────────────
function writeMDX(slug, content) {
  const path = join(CONTENT_DIR, `${slug}.mdx`);
  writeFileSync(path, content, "utf-8");
  console.log(`    ✓ Written: content/insights/${slug}.mdx`);
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log("📰 Tosson Analytics — AI Insights Pipeline\n");

  // 1. Collect RSS items
  console.log("📡 Fetching RSS feeds…");
  const allItems = (await Promise.all(FEEDS.map(fetchFeed))).flat();
  console.log(`   Total items: ${allItems.length}\n`);

  // 2. Filter for relevance
  const relevant = allItems.filter((i) => isRelevant(i.title + " " + (i.desc || "")));
  console.log(`🔍 Relevant items (PFAS keywords): ${relevant.length}\n`);

  if (relevant.length === 0) {
    console.log("ℹ️  No new relevant items today.");
    return;
  }

  // 3. Deduplicate against existing slugs
  const existing = getExistingSlugs();
  const toProcess = [];
  for (const item of relevant) {
    const date  = isoDate(item.pubDate);
    const base  = `${date}-${slugify(item.title)}`;
    if (!existing.has(base)) toProcess.push({ ...item, slug: base });
  }

  console.log(`✏️  New articles to generate: ${toProcess.length}\n`);
  if (toProcess.length === 0) {
    console.log("ℹ️  All relevant items already published.");
    return;
  }

  // 4. Cap at 3 articles per run for speed
  const batch = toProcess.slice(0, 3);

  let written = 0;
  for (let i = 0; i < batch.length; i++) {
    const item = batch[i];
    console.log(`\n[${i + 1}/${batch.length}] "${item.title.slice(0, 70)}"`);
    const mdx = await generateArticle(item);
    if (mdx) {
      writeMDX(item.slug, mdx);
      written++;
    }
    await new Promise((r) => setTimeout(r, 2000));
  }

  console.log(`\n✅ Done — ${written} new article(s) written to content/insights/`);
}

main().catch((err) => {
  console.error("❌ Pipeline failed:", err);
  process.exit(1);
});
