# Tosson Analytics — tossonanalytics.com

North Carolina's PFAS intelligence platform: live contamination dashboards,
regulatory intelligence, and PhD-led remediation consulting. Built by
**Tosson Environmental Analytics** (Dr. Temitope D. Soneye).

Live site: https://tossonanalytics.com

## Stack

- Next.js 16 + React 19 + Tailwind CSS + shadcn/ui
- Leaflet / react-leaflet choropleth maps, Recharts visualizations
- MDX insights articles (`content/insights/`)
- Cloudflare Pages hosting + Pages Functions (`functions/api/`)

## Data pipelines (`scripts/`)

| Script | Source | Output |
|---|---|---|
| `fetch-pfas-data.js` | EPA UCMR 5, USGS Water Quality Portal | `public/data/pfas-nc-data.json`, `pfas-sites.json` |
| `fetch-insights.js` | PFAS/water-quality RSS feeds + editorial AI | `content/insights/*.mdx` |
| `fetch-county-news.js` | Google News RSS per NC county (+ `--no-ai` mode) | `public/data/county-news.json` |
| `refresh-all.sh` | Full pipeline: knowledge harvesters → data → commit → push | — |

```bash
npm run build:full   # data + insights + county news + production build
npm run dev          # local dev server
```

`OPENROUTER_API_KEY` enables the AI editorial steps; the PFAS data fetch
needs no key (public EPA/USGS sources).

## Deployment

Pushes to `master` auto-deploy via Cloudflare Pages. No manual steps.
