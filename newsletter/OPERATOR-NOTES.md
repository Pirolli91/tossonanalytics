# Operator Notes — Newsletter Integration (2026-11-11)

Integration performed by Muse on Temitope's go, after his acceptance of owner
decisions 1–4 (name "Carolina PFAS Weekly"; Buttondown + on-site MDX archive;
Monday 07:30 ET send; paid tier at Issue #10). Decision #5 required no action —
the capability-statement discrepancy in the handover package was disproven.

## Fixes applied to the Gemini package at integration

1. `bin/run-pipeline.js`
   - Output filenames parameterized by issue number (`issue-<N>.html/.mdx/.txt`
     + `issue-<N>-review-package.json` under `out/issue-<N>/`); previously
     hardcoded to `09-sample-issue-0.*`, which would have overwritten/misnamed
     every later issue.
   - `--verify-only` no longer writes `.cache/seen-items.json` (README claimed
     "no file writes"; the code wrote the dedup cache anyway).
   - Default `--out-dir` is now `newsletter/out` (was a stray artifacts path).
2. `registry/04-source-registry.md` — referenced a nonexistent
   `newsletter/lib/registry-gate.js`; now points at `bin/run-pipeline.js`.
3. `data/seed-issue-0.json` — item NC-2026-11-04 (CFPUA) corrected to its cited
   source: CFPUA NewsFlash 1726 is dated **2025-07-10** and documents CFPUA's
   comments against the **2025** rescission proposal. The item no longer claims
   a July 20, 2026 filing; the unverified SELC barrier-wall bundle was removed.
   Data Corner title reworded to "Above-Benchmark" framing. Nothing else in the
   seed was changed (verified field-by-field against the delivered package).
4. `functions/api/subscribe.ts` (site root) — replaced with a merged version:
   Gemini's multi-backend design (D1 → KV → Buttondown → Resend, 503 when
   nothing stores) **plus** the missing double-opt-in confirm/unsubscribe GET
   handler. Tokens are random per-record values stored server-side — the
   package's hardcoded fallback HMAC secret is gone. Error responses use the
   `{ error }` shape the existing signup form reads.

## How weekly production actually works (honest version)

The pipeline does **not** fetch sources. Each week the operator (Muse):
1. Gathers candidate items from the registry sources and hand-authors a
   candidate/seed JSON for the issue (this is the real editorial work).
2. Runs `node newsletter/bin/run-pipeline.js --seed <file>` — the pipeline
   verifies every item against the registry, applies the framing gates, drops
   unverified items, and renders HTML/MDX/TXT + a review package.
3. Temitope approves the review package. Only then is anything sent or the
   archive MDX un-drafted. `--send` hard-refuses (exit 2) by design.

## Archive seeding

Issue #0's MDX sits at `content/insights/2026-11-16-issue-0-carolina-pfas-weekly.mdx`
with `draft: true`. The insights listing, homepage latest-posts, and the
`[slug]` route all respect the draft flag (added 2026-11-11), so it is not
listed, not linked, and 404s if reached directly. To publish an issue archive:
remove `draft: true` from its frontmatter on Temitope's approval and push.

## Remaining go-live wiring (in order)

1. **Buttondown account** (owner step): create the account, then set the
   `BUTTONDOWN_API_KEY` as a Pages environment secret. Until then the
   subscribe endpoint returns an honest 503 — no signup is ever lost
   silently, but none is stored either.
2. **D1 backup store**: database `tosson-subscribers` created 2026-11-11 with
   `newsletter/schema/subscribers.sql` applied. It still needs a **binding**
   named `SUBSCRIBERS_D1` on the Pages project `tossonanalytics`
   (dashboard → Pages → tossonanalytics → Settings → Bindings). The scoped
   API token Muse holds has no Pages permission, so this step is dashboard
   or owner-browser only.
3. **Sending**: issues are created as Buttondown drafts for owner approval;
   the pipeline never sends. Cadence per runbook doc 08 (Wed refresh → Fri
   draft → weekend approval → Mon 07:30 ET send).
