# Deliverable 6 — Newsletter Design System, Brand Alignment & Template Specification

**Prepared for:** Dr. Temitope D. Soneye, PhD ([Tosson Environmental Analytics](https://tossonanalytics.com/)) & Muse (Operator Agent)  
**Date:** Wednesday, November 11, 2026  
**Companion Template Files:**  
- `06-email-template.html` (Reusable parameterized HTML email template — mobile-first, dark-mode safe)  
- `06-archive-issue-template.mdx` (Reusable Next.js `/insights` MDX web-archive template with IDEALS-grade provenance metadata)  
- `09-sample-issue-0.html`, `09-sample-issue-0.mdx`, `09-sample-issue-0.txt` (Populated real Sample Issue #0 outputs)

## 1. Visual Brand System (Extended Directly from Live `tossonanalytics.com`)

Our audit of [https://tossonanalytics.com/](https://tossonanalytics.com/), [https://tossonanalytics.com/dashboard](https://tossonanalytics.com/dashboard), and [https://tossonanalytics.com/regulatory-watch](https://tossonanalytics.com/regulatory-watch) confirmed that Tosson Environmental Analytics uses a dark scientific-intelligence aesthetic built on Tailwind CSS 4 slate surfaces, high-contrast white/slate typography, monospace technical identifiers, and semantic severity accents. The newsletter design system extends this exact visual language into email-safe inline CSS while giving each of the three geographic layers a distinct visual signature:

| Design Token | Hex / Value | Usage in Email (`06-email-template.html`) & Web Archive (`06-archive-issue-template.mdx`) | WCAG Contrast vs. Surface |
| :--- | :--- | :--- | :--- |
| **Outer Canvas (`slate-950`)** | `#0b1120` | Outer email body wrapper and alternating full-bleed callout bands (Deadlines, Private Wells Corner, Research Radar). | Base canvas |
| **Primary Container (`slate-900`)** | `#0f172a` | 680px primary newsletter container and inset metadata/citation boxes. | Base card container |
| **Item Card Surface (`slate-800`)** | `#1e293b` | Individual news/docket/research cards with `1px solid #334155` (`slate-700`) borders. | Base card surface |
| **Primary Headline Text (`slate-50`)** | `#f8fafc` | Issue title, section headers, and linked item headlines (`font-weight: 700–800`). | **16.8:1** on `#0f172a` (AAA) |
| **Body Copy (`slate-200`)** | `#e2e8f0` | 2–4 sentence original summaries and analytical prose (`14px` / `line-height: 1.65`). | **13.4:1** on `#1e293b` (AAA) |
| **Muted / Metadata Text (`slate-400`)** | `#94a3b8` | Source IDs, publication dates, jurisdiction subtitles, and footer notices (`12px`). | **5.8:1** on `#0f172a` (AA) |
| **Layer 1 Accent — North Carolina (`teal-500` / `teal-400`)** | `#14b8a6` / `#2dd4bf` | **North Carolina Layer** top card border (`3px solid #14b8a6`), section divider, Private Wells Corner border, and NC metadata pills. | **8.9:1** (`#2dd4bf` on `#0f172a`) |
| **Layer 2 Accent — United States (`sky-400`)** | `#38bdf8` | **United States Layer** top card border (`3px solid #38bdf8`), Data Corner border, and federal docket links. | **9.4:1** on `#0f172a` (AAA) |
| **Layer 3 Accent — Global (`amber-400`)** | `#fbbf24` | **Global Layer** top card border (`3px solid #fbbf24`) and international regulatory badges. | **11.6:1** on `#0f172a` (AAA) |
| **Top Line Alert Accent (`amber-500`)** | `#f59e0b` / `#fde68a` | **The Top Line** proof-number callout bar (`border-left: 4px solid #f59e0b`). | **13.9:1** (`#fde68a` on `#1e293b`) |
| **Research Radar Accent (`purple-400`)** | `#a855f7` / `#c084fc` | **Research Radar** peer-reviewed paper cards (`border-left: 4px solid #a855f7`) and DOI/PMID links. | **7.8:1** (`#c084fc` on `#0f172a`) |

## 2. Typography & Email Client Compatibility Rules

1. **System Font Stacks (Zero Webfont Blocking in Email Clients):**
   - **Editorial Headings & Prose:** `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif`
   - **Data Figures, Docket Numbers, Dates & Full URLs:** `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`
2. **Mobile-First Single-Column Fluid Table (`max-width: 680px`):**
   - Uses a single-column `680px` fluid table layout (`width: 100%; max-width: 680px`) that collapses cleanly on iOS Mail, Gmail Mobile (Android/iOS), Apple Mail, Outlook, and Hey without horizontal scrolling.
   - All full-URL citations apply `word-break: break-all` and `12px` monospace styling so long Federal Register or NC DEQ URLs never blow out mobile viewports.
3. **Dark-Mode Safe (`color-scheme: dark light`):**
   - Declares `<meta name="color-scheme" content="dark light" />` and `<meta name="supported-color-schemes" content="dark light" />` with explicit inline background and text hex codes on every `<td>` and `<div>` so Gmail and Outlook dark-mode inverters do not flip text into unreadable low-contrast gray.

## 3. Structural Hierarchy & Fixed Section Order

Every issue compiled by `newsletter/bin/run-pipeline.js` enforces the following structural sequence:

1. **Review / Provenance Banner (Draft Review Package Only):** High-visibility orange banner (`#7c2d12` / `#f97316`) reminding the operator and owner that the file is a draft review package and must not be sent without explicit owner approval (§1.5).
2. **Masthead & Permalink Strip:** Publication title, Dr. Soneye's byline and credentials, issue number, target dispatch date, build date, and canonical `tossonanalytics.com/insights/<slug>` web archive permalink.
3. **Standing Section 1 — ⚡ The Top Line:** The week's single most important development, anchored by a monospace `Key Number` proof callout box and full-URL primary sources.
4. **Standing Section 2 — 📅 NC & Federal Deadlines, Hearings & Dockets:** Actionable chronological table with bracketed opportunity/audience tags (`[NC Water Systems]`, `[NC Rulemaking]`, `[MDL Claimants]`, `[NC Utilities]`, borrowed from [PFAS Central Policy](https://pfascentral.org/policy/)), exact dates, instructions, and docket URLs.
5. **Layer 1 — North Carolina Layer (`#14b8a6` Teal Theme — First & Longest):** 4–6 items covering NC DEQ/EMC dockets, Chemours consent-order well testing, municipal utility treatment (CFPUA, Raleigh, Cary, Pittsboro), NC General Assembly legislation, and NC university research. Each card includes:
   - Layer badge + item index + date
   - Declarative action headline
   - Inset NC metadata strip (`NC Scope / Counties`, `Docket/Rule`, `Compounds`, `Benchmark`)
   - 2–4 sentence original summary
   - Highlighted `Why It Matters` box
   - Full clickable URL citation (`source_id`, `source_name`, `https://...`)
6. **Standing Section 3 — 🚰 North Carolina Private Wells Corner:** Dedicated well-owner resource box displaying the verified `2.4M–3.3M` population methodology note inline, free testing pathways (Parsons `(910) 678-1100` across 10 counties), statewide NC DEQ PFAS Alternate Water Program (`$3,500` Bernard Allen Fund reimbursement / free RO), and EPA Method `533`/`537.1` lab guidance.
7. **Standing Section 4 — 📊 Tosson Data Corner:** One metric/chart finding from Tosson's live NC UCMR 5 tracker ([https://tossonanalytics.com/dashboard](https://tossonanalytics.com/dashboard)), strictly framed as an occurrence/screening comparison against MCL benchmarks per §1.3.
8. **Layer 2 — United States Layer (`#38bdf8` Sky Blue Theme — Second):** 2–4 items covering EPA drinking-water rules, Federal Register notices, D.C. Circuit / MDL litigation, ATSDR/NIEHS guidance, and comparative state primacy actions (e.g., Illinois `91 FR 61847`).
9. **Layer 3 — Global Layer (`#fbbf24` Amber Theme — Last & Shortest):** 1–2 high-signal international items (ECHA REACH universal PFAS restriction, EU PFHxA/AFFF bans, OECD fluoropolymer reports) with clear supply-chain or regulatory relevance for NC/US readers.
10. **Standing Section 5 — 🔬 Research Radar (`#a855f7` Purple Theme):** 2–3 peer-reviewed papers with full bibliographic metadata (`Authors`, `Journal`, `Year`, `DOI`, `PMID`, `Full URL`), a plain-language summary, and an explicit **Scope & Claim Boundary (§1.3)** box stating what the paper supports and what it does *not* claim.
11. **Standing Section 6 — 🔭 What to Watch Next Week:** 3–4 forward-looking bullet points for the coming 7 days.
12. **Footer & CAN-SPAM / Screening Disclaimer:** Physical mailing address (`3118 Hannaford Drive, Mebane, NC 27302`), business contact (`temitope.soneye@tossonllc.com`), standing UCMR 5 / private-well screening disclaimer (§1.3), guardrail verification badge, and one-click `{{ unsubscribe_url }}` link.
