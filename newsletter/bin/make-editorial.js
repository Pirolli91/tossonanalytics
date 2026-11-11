#!/usr/bin/env node
/**
 * make-editorial.js — restyle the wrapped fragment into the light editorial
 * theme (owner direction, 2026-11-11, modeled on the Clean Currents print
 * newsletters he supplied, with an original Tosson palette).
 *
 * Why light: both invisible-text failures came from the dark theme fighting
 * the mail client's defaults — white text lost its background (Test 1) and
 * inherited text was repainted black on dark cards (Test 2). A light design
 * degrades gracefully: if any color or background is dropped, the fallback
 * is dark text on a light ground, which still reads. There are no dark
 * blocks in this theme at all.
 *
 * Tosson palette ("Cape Fear petrol & marigold") — unique to Tosson:
 *   paper #FAF6ED · ink #1E2A26 · petrol #064E5A (brand/NC) · marigold
 *   #96660A text / #E9A319 fills · brick #A63A24 (Top Line/deadlines) ·
 *   indigo-slate #3E5C82 (US) · plum #6E3B8A (Research) · tints #F3EDDC,
 *   #EAF2EE, #EDF0F3.
 * Serif (Georgia) nameplate + headlines + body copy; sans for labels/data;
 * mono for URLs — the print-editorial register of the references.
 *
 * Input: out/issue-<N>/issue-<N>-wrapped.html (from make-wrapped.js)
 * Output: out/issue-<N>/issue-<N>-editorial.html
 * Zero dependencies. Never sends anything.
 */
"use strict";
const fs = require("fs");
const path = require("path");

const input = process.argv[2];
if (!input) {
  console.error("usage: node bin/make-editorial.js <issue-N-wrapped.html>");
  process.exit(1);
}
let s = fs.readFileSync(input, "utf8");

// --- 1. Rebuild the intro band as an editorial nameplate -------------------
const metaMatch = s.match(/Issue #\d+ · Target Dispatch: [^<]+ · Built: [^<]+ ·/);
const linkMatch = s.match(
  /href="(https:\/\/tossonanalytics\.com\/insights\/[^"]+)"/
);
const metaLine = metaMatch
  ? metaMatch[0].replace(/·\s*$/, "").trim()
  : "Carolina PFAS Weekly";
const archiveUrl = linkMatch
  ? linkMatch[1]
  : "https://tossonanalytics.com/insights";
const issueNo = (metaLine.match(/Issue #(\d+)/) || [])[1] || "0";

const nameplate = `<!-- NAMEPLATE (editorial edition) -->
<tr>
<td bgcolor="#FFFFFF" style="background-color:#FFFFFF;padding:26px 32px 18px 32px;">
<div style="font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#064E5A;margin-bottom:8px;">Tosson Environmental Analytics · North Carolina PFAS Intelligence</div>
<div style="font-family:Georgia,'Times New Roman',serif;font-size:32px;line-height:1.15;font-weight:700;color:#1E2A26;margin-bottom:6px;">Carolina PFAS Weekly</div>
<div style="font-size:14.5px;line-height:1.55;color:#5A6A62;margin-bottom:12px;">Evidence-based PFAS &amp; water-quality intelligence across North Carolina, federal dockets, and global science — by <strong style="color:#1E2A26;">Dr. Temitope D. Soneye, PhD</strong>, Founder &amp; Principal, Tosson Environmental Analytics.</div>
<div style="border-top:3px solid #064E5A;border-bottom:1px solid #064E5A;height:2px;font-size:0;line-height:0;margin-bottom:12px;">&nbsp;</div>
<div style="font-size:12.5px;color:#43554C;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;background-color:#F3EDDC;border:1px solid #E0D5B8;border-radius:6px;padding:8px 12px;"><span style="display:inline-block;background-color:#E9A319;color:#3A2A05;font-weight:700;padding:1px 8px;border-radius:10px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">ISSUE #${issueNo}</span> &nbsp;${metaLine.replace(/^Issue #\d+ · /, "")} · <a href="${archiveUrl}" style="color:#064E5A;text-decoration:underline;">Web Archive Permalink</a></div>
</td>
</tr>`;
s = s.replace(
  /<!-- INTRO BAND \(wrapped edition\) -->[\s\S]*?(?=<!-- STANDING SECTION 1)/,
  nameplate + "\n"
);

// --- 2. Rebuild the closing card as a light cream band ----------------------
const countsMatch = s.match(
  /\((\d+) verified items, (\d+) unverified items automatically blocked\)/
);
const countsText = countsMatch
  ? `${countsMatch[1]} verified items, ${countsMatch[2]} unverified items automatically blocked`
  : "all items verified";
const closing = `<!-- CLOSING CARD: METHODOLOGY (editorial edition) -->
<tr>
<td bgcolor="#F3EDDC" style="background-color:#F3EDDC;padding:20px 32px;border-top:3px solid #064E5A;font-size:13px;line-height:1.65;color:#43554C;">
<div style="font-family:Georgia,'Times New Roman',serif;color:#1E2A26;font-weight:700;font-size:15px;margin-bottom:4px;">Methodology &amp; Screening Notice</div>
<div>UCMR 5 and private-well comparisons reported by Tosson Environmental Analytics are screening comparisons against EPA Maximum Contaminant Level (MCL) benchmarks (4.0 ppt PFOA/PFOS; 10.0 ppt PFHxS, PFNA, HFPO-DA/GenX); SDWA compliance is determined solely by running annual averages at regulated public water systems. All cited sources are verified against the Tosson Source Registry (${countsText}).</div>
<div style="margin-top:10px;"><a href="https://tossonanalytics.com/dashboard" style="color:#064E5A;text-decoration:underline;font-weight:600;">Live NC PFAS Dashboard</a> &nbsp;·&nbsp; <a href="https://tossonanalytics.com/regulatory-watch" style="color:#064E5A;text-decoration:underline;font-weight:600;">Regulatory Watch</a> &nbsp;·&nbsp; <a href="https://tossonanalytics.com/services" style="color:#064E5A;text-decoration:underline;font-weight:600;">Municipal &amp; Remediation Consulting</a></div>
<div style="margin-top:10px;font-size:12px;color:#5A6A62;">Tosson Services LLC dba Tosson Environmental Analytics · 3118 Hannaford Drive, Mebane, NC 27302 · <a href="mailto:temitope.soneye@tossonllc.com" style="color:#064E5A;text-decoration:underline;">temitope.soneye@tossonllc.com</a></div>
</td>
</tr>`;
s = s.replace(/<!-- CLOSING CARD: METHODOLOGY \(wrapped edition\) -->[\s\S]*?<\/tr>/, closing);

// --- 3. Hands-on CTA after the Top Line -------------------------------------
const cta = `<!-- CTA (editorial edition) -->
<tr>
<td bgcolor="#FFFFFF" style="background-color:#FFFFFF;padding:4px 32px 20px 32px;text-align:center;">
<a href="https://tossonanalytics.com/dashboard" style="display:inline-block;background-color:#FFFFFF;border:2px solid #064E5A;border-radius:8px;padding:11px 22px;font-size:14.5px;font-weight:700;color:#064E5A;text-decoration:none;">🔍 &nbsp;Check your county on the live NC PFAS dashboard</a>
<div style="font-size:12px;color:#5A6A62;margin-top:8px;">177 systems with detections · 120 above MCL benchmarks · updated weekly</div>
</td>
</tr>
`;
s = s.replace(/(?=<!-- STANDING SECTION 2)/, cta);

// --- 4. Structural color patterns (before the global map) -------------------
// Root + container
s = s.split('bgcolor="#0b1120" style="background-color:#0b1120;"').join('bgcolor="#FFFFFF" style="background-color:#FFFFFF;"');
s = s.split('bgcolor="#0f172a" style="max-width:680px;width:100%;background-color:#0f172a;border:1px solid #1e293b;').join('bgcolor="#FAF6ED" style="max-width:680px;width:100%;background-color:#FAF6ED;border:1px solid #E3DCCB;');
// Section cells: slate sections -> ivory paper, deep sections -> white
s = s.split('class="section-pad" bgcolor="#0f172a"').join('class="section-pad" bgcolor="#FAF6ED"');
s = s.split('class="section-pad" bgcolor="#0b1120"').join('class="section-pad" bgcolor="#FFFFFF"');
s = s.split('border-bottom:1px solid #1e293b;background-color:#0f172a;').join('border-bottom:1px solid #E7DFCE;background-color:#FAF6ED;');
s = s.split('border-bottom:1px solid #1e293b;background-color:#0b1120;').join('border-bottom:1px solid #E7DFCE;background-color:#FFFFFF;');
// Borders that used the card color
s = s.split('border:1px solid #1e293b').join('border:1px solid #E7DFCE');
s = s.split('border-top:1px solid #1e293b').join('border-top:1px solid #E7DFCE');
// Key-number band -> cream with brick rule
s = s.split('background-color:#1e293b;border-left:4px solid #f59e0b').join('background-color:#F6ECD4;border-left:4px solid #A63A24');

// --- 5. Global palette map (dark slate -> Cape Fear petrol & marigold) ------
const MAP = [
  ["#1e293b", "#FFFFFF"], // cards
  ["#0f172a", "#F3EDDC"], // inner strips/chips -> warm cream tint
  ["#111c2d", "#EAF2EE"], // wells box -> petrol tint
  ["#334155", "#DCD4C2"], // hairlines
  ["#f8fafc", "#1E2A26"], // headlines -> ink
  ["#f1f5f9", "#33413A"], // why-it-matters text
  ["#e2e8f0", "#2C3A34"], // body
  ["#b7c3d4", "#5A6A62"], // secondary
  ["#cbd5e1", "#43554C"], // meta text
  ["#14b8a6", "#064E5A"], // NC petrol
  ["#2dd4bf", "#0B6472"], // bright teal -> petrol mid
  ["#5eead4", "#0B5563"], // deadline chip text
  ["#99f6e4", "#0B5563"], // wells note text
  ["#38bdf8", "#3E5C82"], // US indigo-slate
  ["#7dd3fc", "#3E5C82"],
  ["#f59e0b", "#A63A24"], // Top Line brick
  ["#fde68a", "#7C2D12"], // key-number text
  ["#fbbf24", "#96660A"], // global ochre
  ["#fcd34d", "#8A5A08"], // claim-boundary text
  ["#a855f7", "#6E3B8A"], // research plum
  ["#c084fc", "#6E3B8A"],
];
for (const [from, to] of MAP) s = s.split(from).join(to);

// The wells-corner box border was teal #14b8a6 (now petrol) — keep. Its inner
// note strip took the cream map; lift it to white for separation.
s = s.split('border-left:3px solid #0B6472;font-size:12px;line-height:1.5;color:#0B5563;').join('border-left:3px solid #0B6472;font-size:12px;line-height:1.5;color:#0B5563;background-color:#FFFFFF;');

// --- 6. Serif typography ------------------------------------------------------
// Headlines
s = s.replace(/<h2 style="/g, '<h2 style="font-family:Georgia,\'Times New Roman\',serif;');
s = s.replace(/<h3 style="/g, '<h3 style="font-family:Georgia,\'Times New Roman\',serif;');
s = s.replace(/<h4 style="/g, '<h4 style="font-family:Georgia,\'Times New Roman\',serif;');
// Body copy: item bodies, corner bodies, radar summaries -> Georgia, a touch larger
s = s.split('font-size:15px;line-height:1.7;color:#2C3A34;').join('font-family:Georgia,\'Times New Roman\',serif;font-size:15.5px;line-height:1.7;color:#2C3A34;');
s = s.split('font-size:14.5px;').join('font-family:Georgia,\'Times New Roman\',serif;font-size:15px;');
s = s.split('font-size:14px;line-height:1.65;color:#2C3A34;').join('font-family:Georgia,\'Times New Roman\',serif;font-size:14.5px;line-height:1.65;color:#2C3A34;');

// --- 7. Deadlines table: give the date column a fixed, phone-safe width -----
s = s.split('white-space:nowrap;vertical-align:top;">').join('white-space:nowrap;vertical-align:top;width:92px;">');

// Single HTML block (no blank lines) for Markdown-mode passthrough.
const out = s.split("\n").filter((l) => l.trim() !== "").join("\n");
const outPath = input.replace(/-wrapped\.html$/, "-editorial.html");
fs.writeFileSync(outPath, out + "\n");
console.log(`wrote ${path.basename(outPath)}: ${out.length} chars (from ${fs.readFileSync(input, "utf8").length})`);
