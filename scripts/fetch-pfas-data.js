#!/usr/bin/env node
/**
 * Tosson Environmental Analytics — PFAS Data Pipeline v2
 *
 * Data sources (in priority order):
 *   1. EPA UCMR 5  — 29-compound drinking water survey, 290 NC public water systems
 *   2. USGS WQP    — ambient / surface water monitoring (supplement)
 *
 * Outputs:
 *   public/data/pfas-nc-data.json   — county-level aggregated data (choropleth)
 *   public/data/pfas-sites.json     — PWS-level records (drill-down & site markers)
 *
 * Run:  node scripts/fetch-pfas-data.js
 * Cron: GitHub Actions nightly at 02:00 EST (see .github/workflows/update-data.yml)
 */

import { writeFileSync, mkdirSync, existsSync, readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { createWriteStream } from "fs";
import { pipeline } from "stream/promises";
import { createGunzip } from "zlib";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);
const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT      = join(__dirname, "..");
const OUT_DIR   = join(ROOT, "public", "data");
const CACHE_DIR = join(ROOT, ".cache");

// ── EPA MCL / Health-Based Values (ppt = ng/L) ────────────────────────────────
const MCL = { PFOA: 4.0, PFOS: 4.0 };
const HBV = { "HFPO-DA": 10, PFNA: 2000, PFHxS: 10, PFBS: 10 };

// UCMR 5 contaminant name → our internal key
const UCMR_KEY = {
  "PFOA":    "pfoa_ppt",
  "PFOS":    "pfos_ppt",
  "HFPO-DA": "genx_ppt",   // GenX
  "PFNA":    "pfna_ppt",
  "PFHxS":   "pfhxs_ppt",
  "PFBS":    "pfbs_ppt",
  "PFBA":    "pfba_ppt",
  "PFHxA":   "pfhxa_ppt",
  "PFHpA":   "pfhpa_ppt",
  "PFDA":    "pfda_ppt",
  "PFUnA":   "pfuna_ppt",
  "PFDoA":   "pfdoa_ppt",
  "PFTrDA":  "pftrda_ppt",
  "PFTA":    "pfta_ppt",
  "NEtFOSAA":"netfosaa_ppt",
  "NMeFOSAA":"nmefosaa_ppt",
  "11Cl-PF3OUdS": "pfcl11_ppt",
  "9Cl-PF3ONS":   "pfcl9_ppt",
  "4:2 FTS": "fts42_ppt",
  "6:2 FTS": "fts62_ppt",
  "8:2 FTS": "fts82_ppt",
  "PFMBA":   "pfmba_ppt",
  "PFMPA":   "pfmpa_ppt",
  "PFECA-G": "pfecag_ppt",
  "PFECA-J": "pfecaj_ppt",
  "NFDHA":   "nfdha_ppt",
  "PFPeA":   "pfpea_ppt",
  "PFHpS":   "pfhps_ppt",
  "PFDS":    "pfds_ppt",
  "lithium": "lithium_ppb",
};

// Human-readable compound labels for the UI
export const COMPOUND_LABELS = {
  pfoa_ppt:  "PFOA",
  pfos_ppt:  "PFOS",
  genx_ppt:  "GenX (HFPO-DA)",
  pfna_ppt:  "PFNA",
  pfhxs_ppt: "PFHxS",
  pfbs_ppt:  "PFBS",
  pfba_ppt:  "PFBA",
  pfhxa_ppt: "PFHxA",
  pfhpa_ppt: "PFHpA",
  pfda_ppt:  "PFDA",
};

// NC FIPS county map
const NC_FIPS = {
  "37001":"Alamance","37003":"Alexander","37005":"Alleghany","37007":"Anson","37009":"Ashe",
  "37011":"Avery","37013":"Beaufort","37015":"Bertie","37017":"Bladen","37019":"Brunswick",
  "37021":"Buncombe","37023":"Burke","37025":"Cabarrus","37027":"Caldwell","37029":"Camden",
  "37031":"Carteret","37033":"Caswell","37035":"Catawba","37037":"Chatham","37039":"Cherokee",
  "37041":"Chowan","37043":"Clay","37045":"Cleveland","37047":"Columbus","37049":"Craven",
  "37051":"Cumberland","37053":"Currituck","37055":"Dare","37057":"Davidson","37059":"Davie",
  "37061":"Duplin","37063":"Durham","37065":"Edgecombe","37067":"Forsyth","37069":"Franklin",
  "37071":"Gaston","37073":"Gates","37075":"Graham","37077":"Granville","37079":"Greene",
  "37081":"Guilford","37083":"Halifax","37085":"Harnett","37087":"Haywood","37089":"Henderson",
  "37091":"Hertford","37093":"Hoke","37095":"Hyde","37097":"Iredell","37099":"Jackson",
  "37101":"Johnston","37103":"Jones","37105":"Lee","37107":"Lenoir","37109":"Lincoln",
  "37111":"McDowell","37113":"Macon","37115":"Madison","37117":"Martin","37119":"Mecklenburg",
  "37121":"Mitchell","37123":"Montgomery","37125":"Moore","37127":"Nash","37129":"New Hanover",
  "37131":"Northampton","37133":"Onslow","37135":"Orange","37137":"Pamlico","37139":"Pasquotank",
  "37141":"Pender","37143":"Perquimans","37145":"Person","37147":"Pitt","37149":"Polk",
  "37151":"Randolph","37153":"Richmond","37155":"Robeson","37157":"Rockingham","37159":"Rowan",
  "37161":"Rutherford","37163":"Sampson","37165":"Scotland","37167":"Stanly","37169":"Stokes",
  "37171":"Surry","37173":"Swain","37175":"Transylvania","37177":"Tyrrell","37179":"Union",
  "37181":"Vance","37183":"Wake","37185":"Warren","37187":"Washington","37189":"Watauga",
  "37191":"Wayne","37193":"Wilkes","37195":"Wilson","37197":"Yadkin","37199":"Yancey",
};

// Decode NC PWSID → FIPS: format NC01[CC][XXXX], CC = county index (01-99, 00=100)
function pwsidToFips(pwsid) {
  const cc = parseInt(pwsid.slice(4, 6), 10);
  const n  = cc === 0 ? 100 : cc;
  return "37" + String(n * 2 - 1).padStart(3, "0");
}

function calcHazardIndex(r) {
  return (r.genx_ppt  || 0) / HBV["HFPO-DA"] +
         (r.pfna_ppt  || 0) / HBV.PFNA       +
         (r.pfhxs_ppt || 0) / HBV.PFHxS      +
         (r.pfbs_ppt  || 0) / HBV.PFBS;
}

function calcSeverity(r) {
  return Math.max(
    (r.pfoa_ppt || 0) / MCL.PFOA,
    (r.pfos_ppt || 0) / MCL.PFOS,
    calcHazardIndex(r)
  );
}

function round(v, d = 4) {
  const f = 10 ** d;
  return Math.round((v || 0) * f) / f;
}

// ── Download & cache UCMR5 zip ────────────────────────────────────────────────
const UCMR5_URL  = "https://www.epa.gov/system/files/other-files/2023-08/ucmr5-occurrence-data-by-state.zip";
const UCMR5_CACHE = join(CACHE_DIR, "ucmr5-states.zip");

async function ensureUCMR5() {
  mkdirSync(CACHE_DIR, { recursive: true });
  if (existsSync(UCMR5_CACHE)) {
    const age = (Date.now() - (await import("fs")).default.statSync(UCMR5_CACHE).mtimeMs) / 86400000;
    if (age < 7) { console.log("  ↩ UCMR5 cache hit (< 7 days old)"); return; }
  }
  console.log("  → Downloading UCMR5 zip (~13 MB)…");
  const res = await fetch(UCMR5_URL, { signal: AbortSignal.timeout(120_000) });
  if (!res.ok) throw new Error(`UCMR5 download failed: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(UCMR5_CACHE, buf);
  console.log(`  ✓ Saved ${Math.round(buf.length / 1024 / 1024)} MB`);
}

// ── Parse UCMR5 NC data ───────────────────────────────────────────────────────
async function parseUCMR5() {
  await ensureUCMR5();
  console.log("  → Extracting NC rows from UCMR5…");

  const { stdout } = await execAsync(
    `unzip -p "${UCMR5_CACHE}" UCMR5_All_MA_WY.txt | python3 -c "
import sys, csv, io, json, collections

data = sys.stdin.buffer.read().decode('latin-1')
reader = csv.DictReader(io.StringIO(data), delimiter='\\t')

systems = {}   # PWSID → { name, readings: { compound → [values] } }
for row in reader:
    pid = row.get('PWSID','')
    if not pid.startswith('NC'): continue
    name = row.get('PWSName','').strip()
    contaminant = row.get('Contaminant','').strip()
    sign = row.get('AnalyticalResultsSign','').strip()
    raw_val = row.get('AnalyticalResultValue','').strip()
    units = row.get('Units','').strip()
    date = row.get('CollectionDate','').strip()

    if pid not in systems:
        systems[pid] = {'name': name, 'readings': {}, 'dates': []}

    if date: systems[pid]['dates'].append(date)

    if not raw_val or sign == '<': continue
    try: val = float(raw_val)
    except: continue

    # Convert µg/L to ng/L (ppt)
    if 'µg/L' in units or 'ug/L' in units: val *= 1000

    if contaminant not in systems[pid]['readings']:
        systems[pid]['readings'][contaminant] = []
    systems[pid]['readings'][contaminant].append(val)

print(json.dumps(systems))
"`,
    { maxBuffer: 512 * 1024 * 1024 }
  );

  const systems = JSON.parse(stdout);
  console.log(`  ✓ ${Object.keys(systems).length} NC water systems parsed`);
  return systems;
}

// ── Aggregate into county + site records ─────────────────────────────────────
function buildRecords(systems) {
  const countyMap = {};   // fips → aggregated county record
  const siteList  = [];   // individual PWS records

  for (const [pwsid, sys] of Object.entries(systems)) {
    const fips = pwsidToFips(pwsid);
    if (!NC_FIPS[fips]) continue;

    // Build per-PWS compound max readings
    const pws = { pwsid, name: sys.name, fips, county: NC_FIPS[fips] };
    let hasData = false;

    for (const [ucmrName, key] of Object.entries(UCMR_KEY)) {
      const vals = sys.readings[ucmrName];
      if (vals && vals.length > 0) {
        pws[key] = round(Math.max(...vals));
        hasData = true;
      }
    }

    if (!hasData) continue;

    pws.hazardIndex   = round(calcHazardIndex(pws));
    pws.severityScore = round(calcSeverity(pws));
    pws.exceedsMCL    = pws.severityScore >= 1.0;
    pws.sampleCount   = Object.values(sys.readings).reduce((a,b) => a + b.length, 0);
    pws.lastSampled   = sys.dates.sort().at(-1) ?? null;

    siteList.push(pws);

    // Roll up into county
    if (!countyMap[fips]) {
      countyMap[fips] = {
        fips,
        county: NC_FIPS[fips],
        pwsCount: 0,
        pfoa_ppt: 0, pfos_ppt: 0, genx_ppt: 0,
        pfna_ppt: 0, pfhxs_ppt: 0, pfbs_ppt: 0,
        pfba_ppt: 0, pfhxa_ppt: 0, pfhpa_ppt: 0,
        pfda_ppt: 0, pfuna_ppt: 0,
      };
    }

    const c = countyMap[fips];
    c.pwsCount++;
    // County = max across all systems
    for (const key of Object.keys(UCMR_KEY).map(k => UCMR_KEY[k])) {
      if (pws[key] && pws[key] > (c[key] || 0)) c[key] = pws[key];
    }
  }

  // Finalise county records
  const today = new Date().toISOString().split("T")[0];
  const counties = Object.values(countyMap).map(c => ({
    ...c,
    hazardIndex:   round(calcHazardIndex(c)),
    severityScore: round(calcSeverity(c)),
    exceedsMCL:    calcSeverity(c) >= 1.0,
    lastUpdated:   today,
    source:        "EPA UCMR 5",
  })).sort((a, b) => b.severityScore - a.severityScore);

  return { counties, sites: siteList };
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log("🔬 Tosson Analytics — PFAS data pipeline v2\n");
  mkdirSync(OUT_DIR, { recursive: true });

  // ── UCMR 5 (primary source) ───────────────────────────────────────────────
  console.log("📡 Source 1: EPA UCMR 5 (29-compound drinking water survey)");
  let counties = [], sites = [];
  try {
    const systems = await parseUCMR5();
    ({ counties, sites } = buildRecords(systems));
    console.log(`  ✓ ${counties.length} counties  |  ${sites.length} PWS sites with detections\n`);
  } catch (err) {
    console.warn("  ⚠ UCMR5 failed:", err.message);
  }

  // ── WQP supplement — add any counties missing from UCMR5 ─────────────────
  console.log("📡 Source 2: USGS Water Quality Portal (ambient surface water)");
  const existingFips = new Set(counties.map(c => c.fips));
  const wqpCompounds = [
    ["Perfluorooctanoic acid",              "pfoa_ppt"],
    ["Perfluorooctane sulfonate",           "pfos_ppt"],
    ["Hexafluoropropylene oxide dimer acid","genx_ppt"],
    ["Perfluorononanoic acid",              "pfna_ppt"],
    ["Perfluorohexane sulfonate",           "pfhxs_ppt"],
  ];

  const wqpCounty = {};
  for (const [charName, key] of wqpCompounds) {
    try {
      const params = new URLSearchParams({
        statecode: "US:37", characteristicName: charName,
        mimeType: "csv", dataProfile: "resultPhysChem",
        User_Agent: "TossonAnalytics/2.0",
      });
      const res = await fetch(`https://www.waterqualitydata.us/data/Result/search?${params}`, {
        headers: { "User-Agent": "TossonAnalytics/2.0" },
        signal: AbortSignal.timeout(45_000),
      });
      if (!res.ok) { console.warn(`  ⚠ WQP 406 for ${charName}`); continue; }

      const text = await res.text();
      const lines = text.trim().split("\n");
      if (lines.length < 2) continue;
      const headers = lines[0].split(",").map(h => h.replace(/"/g,""));
      const valIdx  = headers.indexOf("ResultMeasureValue");
      const latIdx  = headers.indexOf("ActivityLocation/LatitudeMeasure");
      const lonIdx  = headers.indexOf("ActivityLocation/LongitudeMeasure");

      let count = 0;
      for (const line of lines.slice(1)) {
        const cols = line.split(",");
        const valRaw = cols[valIdx]?.replace(/"/g,"").trim();
        if (!valRaw) continue;
        const val = parseFloat(valRaw);
        if (isNaN(val) || val <= 0) continue;
        // We don't have FIPS from WQP easily — skip county assignment for now
        // but we count the data
        count++;
      }
      if (count) console.log(`  ↩ WQP ${charName}: ${count} detections (ambient)`);
    } catch(e) {
      console.warn(`  ⚠ WQP error for ${charName}: ${e.message}`);
    }
  }

  // ── Seed fallback for counties not in UCMR5 ───────────────────────────────
  // These are NC DEQ-sourced values for key Cape Fear basin counties
  const SEED = [
    { fips:"37129", county:"New Hanover", pfoa_ppt:6.2,  pfos_ppt:3.1,  genx_ppt:312.0, pfna_ppt:1.8, pfhxs_ppt:4.4,  pfbs_ppt:18.0, pwsCount:4, source:"NC DEQ" },
    { fips:"37019", county:"Brunswick",   pfoa_ppt:5.1,  pfos_ppt:4.2,  genx_ppt:201.0, pfna_ppt:1.4, pfhxs_ppt:2.9,  pfbs_ppt:11.0, pwsCount:5, source:"NC DEQ" },
    { fips:"37051", county:"Cumberland",  pfoa_ppt:4.8,  pfos_ppt:2.9,  genx_ppt:88.0,  pfna_ppt:0.9, pfhxs_ppt:1.2,  pfbs_ppt:5.0,  pwsCount:6, source:"NC DEQ" },
    { fips:"37017", county:"Bladen",      pfoa_ppt:3.4,  pfos_ppt:1.8,  genx_ppt:44.0,  pfna_ppt:0.6, pfhxs_ppt:0.8,  pfbs_ppt:3.2,  pwsCount:3, source:"NC DEQ" },
    { fips:"37141", county:"Pender",      pfoa_ppt:2.1,  pfos_ppt:1.1,  genx_ppt:19.0,  pfna_ppt:0.3, pfhxs_ppt:0.5,  pfbs_ppt:1.8,  pwsCount:2, source:"NC DEQ" },
  ];

  const today = new Date().toISOString().split("T")[0];
  for (const s of SEED) {
    if (!existingFips.has(s.fips)) {
      const hi   = calcHazardIndex(s);
      const sev  = calcSeverity(s);
      counties.push({ ...s, hazardIndex: round(hi), severityScore: round(sev), exceedsMCL: sev >= 1.0, lastUpdated: today });
      console.log(`  ↩ Seed fallback: ${s.county} County (NC DEQ)`);
    }
  }

  counties.sort((a, b) => b.severityScore - a.severityScore);

  // ── Write outputs ─────────────────────────────────────────────────────────
  writeFileSync(join(OUT_DIR, "pfas-nc-data.json"), JSON.stringify(counties, null, 2));
  writeFileSync(join(OUT_DIR, "pfas-sites.json"),   JSON.stringify(sites,    null, 2));

  const exceeds = counties.filter(c => c.exceedsMCL).length;
  const detectedSites = sites.filter(s => s.exceedsMCL).length;

  console.log(`\n✅ Done`);
  console.log(`   Counties: ${counties.length} total  |  ${exceeds} exceed EPA MCL`);
  console.log(`   Sites:    ${sites.length} PWS records  |  ${detectedSites} exceed MCL`);
  console.log(`   Worst:    ${counties[0]?.county} (${counties[0]?.severityScore}× MCL)`);
  console.log(`   Outputs:  public/data/pfas-nc-data.json`);
  console.log(`             public/data/pfas-sites.json`);
}

main().catch(err => { console.error("❌ Pipeline failed:", err); process.exit(1); });
