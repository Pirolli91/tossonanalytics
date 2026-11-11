#!/usr/bin/env node
/**
 * make-wrapped.js — build the Buttondown "wrapped" email fragment for an issue.
 *
 * Why: Buttondown's raw-HTML Naked mode is paywalled (Professional, $79/mo).
 * On lower tiers the pipeline HTML is pasted into Markdown mode, where
 * Buttondown wraps it in its own light template. In that context the document
 * shell (html/head/body) and the outer layout tables do not reliably survive,
 * and every section that relied on an ancestor's background loses it — light
 * text (#f8fafc / #e2e8f0 / #94a3b8) lands on white and disappears.
 *
 * This transformer takes the pipeline's standalone issue-N.html and emits
 * issue-N-wrapped.html, a body-only fragment in which:
 *   1. The shell, SAMPLE banner, masthead and footer rows are removed
 *      (Buttondown supplies header, subscribe line, address, unsubscribe).
 *      The masthead's issue line is re-homed in a slim self-contained intro
 *      band; the footer's methodology notice is re-homed in a closing card.
 *   2. EVERY section cell carries its own background-color AND bgcolor
 *      attribute, and major inner cards get bgcolor attributes too, so no
 *      text depends on an ancestor's background.
 *   3. Typography is upgraded for the wrapped context: secondary text
 *      #94a3b8 -> #b7c3d4, body copy 13-14px -> 14-15px, line-heights up.
 *   4. Blank lines are removed so the fragment is a single HTML block for
 *      Markdown-mode passthrough (blank lines split HTML blocks).
 *
 * Usage: node bin/make-wrapped.js out/issue-0/issue-0.html
 * Output: out/issue-0/issue-0-wrapped.html (next to the input)
 * Zero dependencies. Never sends anything.
 */
"use strict";
const fs = require("fs");
const path = require("path");

const input = process.argv[2];
if (!input) {
  console.error("usage: node bin/make-wrapped.js <issue-N.html>");
  process.exit(1);
}
const html = fs.readFileSync(input, "utf8");

// --- 1. Isolate the container-table rows ---------------------------------
const firstMarker = html.indexOf("<!-- SAMPLE REVIEW BANNER");
const containerClose = html.lastIndexOf("</table>\n      </td>");
if (firstMarker === -1 || containerClose === -1) {
  console.error("could not locate container rows in the pipeline HTML");
  process.exit(1);
}
const rowsRegion = html.slice(firstMarker, containerClose);

// Split into chunks, each starting at an HTML comment marker.
const chunks = rowsRegion
  .split(/(?=<!-- )/)
  .map((c) => c.trim())
  .filter((c) => c.startsWith("<!--"));
const byMarker = (needle) => chunks.find((c) => c.includes(needle));
const keepOrder = [
  "STANDING SECTION 1",
  "STANDING SECTION 2",
  "LAYER 1:",
  "STANDING SECTION 3",
  "STANDING SECTION 4",
  "LAYER 2:",
  "LAYER 3:",
  "STANDING SECTION 5",
  "STANDING SECTION 6",
];
const kept = keepOrder.map((m) => {
  const c = byMarker(m);
  if (!c) {
    console.error(`missing section chunk: ${m}`);
    process.exit(1);
  }
  return c;
});

// --- 2. Re-home the masthead meta line + footer methodology notice --------
const masthead = byMarker("MASTHEAD") || "";
const metaMatch = masthead.match(
  /Issue #\d+ · Target Dispatch: [^<]+ · Built: [^<]+ ·/
);
const linkMatch = masthead.match(
  /href="(https:\/\/tossonanalytics\.com\/insights\/[^"]+)"/
);
const metaLine = metaMatch ? metaMatch[0].replace(/·\s*$/, "").trim() : "";
const archiveUrl = linkMatch ? linkMatch[1] : "https://tossonanalytics.com/insights";

const footer = byMarker("FOOTER") || "";
const countsMatch = footer.match(
  /\((\d+) verified items, (\d+) unverified items automatically blocked\)/
);
const countsText = countsMatch
  ? `${countsMatch[1]} verified items, ${countsMatch[2]} unverified items automatically blocked`
  : "all items verified";

const introBand = `<!-- INTRO BAND (wrapped edition) -->
<tr>
<td bgcolor="#0f172a" style="background-color:#0f172a;padding:22px 32px 18px 32px;border-bottom:2px solid #14b8a6;">
<div style="font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#2dd4bf;margin-bottom:6px;">TOSSON ENVIRONMENTAL ANALYTICS · NORTH CAROLINA PFAS INTELLIGENCE</div>
<div style="font-size:21px;line-height:1.25;font-weight:800;color:#f8fafc;margin-bottom:6px;">Carolina PFAS Weekly</div>
<div style="font-size:14px;line-height:1.55;color:#b7c3d4;margin-bottom:10px;">Evidence-based PFAS &amp; water-quality intelligence across North Carolina, federal dockets, and global science — by <strong style="color:#f8fafc;">Dr. Temitope D. Soneye, PhD</strong> (Founder &amp; Principal, Tosson Environmental Analytics).</div>
<div style="font-size:12.5px;color:#cbd5e1;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;background-color:#0b1120;border:1px solid #334155;border-radius:6px;padding:8px 12px;">${metaLine} · <a href="${archiveUrl}" style="color:#2dd4bf;text-decoration:underline;">Web Archive Permalink</a></div>
</td>
</tr>`;

const closingCard = `<!-- CLOSING CARD: METHODOLOGY (wrapped edition) -->
<tr>
<td bgcolor="#090d16" style="background-color:#090d16;padding:20px 32px;font-size:13px;line-height:1.65;color:#b7c3d4;">
<div style="color:#f8fafc;font-weight:700;margin-bottom:4px;">Methodology &amp; Screening Notice</div>
<div>UCMR 5 and private-well comparisons reported by Tosson Environmental Analytics are screening comparisons against EPA Maximum Contaminant Level (MCL) benchmarks (4.0 ppt PFOA/PFOS; 10.0 ppt PFHxS, PFNA, HFPO-DA/GenX); SDWA compliance is determined solely by running annual averages at regulated public water systems. All cited sources are verified against the Tosson Source Registry (${countsText}).</div>
<div style="margin-top:10px;"><a href="https://tossonanalytics.com/dashboard" style="color:#38bdf8;text-decoration:underline;">Live NC PFAS Dashboard</a> &nbsp;·&nbsp; <a href="https://tossonanalytics.com/regulatory-watch" style="color:#38bdf8;text-decoration:underline;">Regulatory Watch</a> &nbsp;·&nbsp; <a href="https://tossonanalytics.com/services" style="color:#38bdf8;text-decoration:underline;">Municipal &amp; Remediation Consulting</a></div>
</td>
</tr>`;

// --- 3. Per-section background hardening ----------------------------------
function hardenSection(chunk) {
  // Give the section-pad td its own background + bgcolor attribute.
  return chunk.replace(
    /<td class="section-pad" style="([^"]*)">/,
    (m, style) => {
      const bg = /background-color:(#[0-9a-fA-F]{6})/.exec(style);
      const color = bg ? bg[1] : "#0f172a";
      const newStyle = bg ? style : `${style}background-color:#0f172a;`;
      return `<td class="section-pad" bgcolor="${color}" style="${newStyle}">`;
    }
  );
}

// Add bgcolor attributes to inner elements that already carry a
// background-color in their inline style (cards, boxes, tables, chips).
function addBgcolorAttrs(s) {
  return s.replace(
    /<(div|table|span|td)([^>]*?) style="([^"]*?)background-color:(#[0-9a-fA-F]{6})([^"]*?)"/g,
    (m, tag, pre, before, color, after) => {
      if (/bgcolor=/.test(m)) return m;
      return `<${tag}${pre} bgcolor="${color}" style="${before}background-color:${color}${after}"`;
    }
  );
}

// --- 4. Typography upgrades (generator tokens are consistent) -------------
function upgradeType(s) {
  const swaps = [
    // layer subtitles: 13px muted -> 14px brighter
    ["font-size:13px;color:#94a3b8", "font-size:14px;color:#b7c3d4"],
    // layer item body copy: 14px -> 15px, looser leading
    [
      "font-size:14px;line-height:1.65;color:#e2e8f0",
      "font-size:15px;line-height:1.7;color:#e2e8f0",
    ],
    // deadlines body cell: 13px -> 14px
    [
      "font-size:13px;line-height:1.55;color:#e2e8f0",
      "font-size:14px;line-height:1.6;color:#e2e8f0",
    ],
    // radar summaries + watch items: 13px -> 14px
    [
      "font-size:13px;line-height:1.6;color:#e2e8f0",
      "font-size:14px;line-height:1.65;color:#e2e8f0",
    ],
    // wells corner + data corner bodies: 13.5px -> 14.5px
    ["font-size:13.5px", "font-size:14.5px"],
    // docket/source microtext: 11px -> 12px where it carries source lines
    ["font-size:11px;word-break:break-all", "font-size:12px;word-break:break-all"],
    // global secondary-text brightening (remaining muted slate)
    ["color:#94a3b8", "color:#b7c3d4"],
  ];
  for (const [from, to] of swaps) s = s.split(from).join(to);
  return s;
}

// --- 5. Assemble ------------------------------------------------------------
let body = [introBand, ...kept.map(hardenSection), closingCard].join("\n");
body = addBgcolorAttrs(body);
body = upgradeType(body);

const fragment = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#0b1120" style="background-color:#0b1120;">
<tr>
<td align="center" style="padding:8px 4px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#0f172a" style="max-width:680px;width:100%;background-color:#0f172a;border:1px solid #1e293b;border-radius:12px;overflow:hidden;">
${body}
</table>
</td>
</tr>
</table>`;

// Remove blank lines: one single HTML block for Markdown passthrough.
const singleBlock = fragment
  .split("\n")
  .filter((l) => l.trim() !== "")
  .join("\n");

const outPath = input.replace(/\.html$/, "-wrapped.html");
fs.writeFileSync(outPath, singleBlock + "\n");
console.log(
  `wrote ${path.basename(outPath)}: ${singleBlock.length} chars (from ${html.length})`
);
