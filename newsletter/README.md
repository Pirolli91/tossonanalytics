# Deliverable 5 — Tosson Newsletter Guardrail Pipeline (`newsletter/`) — README & Technical Guide

**Prepared for:** Dr. Temitope D. Soneye, PhD ([Tosson Environmental Analytics](https://tossonanalytics.com/)) & Muse (Operator Agent)  
**Date:** Wednesday, November 11, 2026  
**Runtime Requirements:** Node.js $\ge 18.0.0$ on Linux VM (zero external npm dependencies required; uses native Node `fs`, `path`, `crypto`, `https`, `url`).

## 1. Directory Structure (Drop-In for `pirolli91/tossonanalytics`)

```text
tossonanalytics/
├── functions/
│   └── api/
│       └── subscribe.ts                         # Fixed Cloudflare Pages subscribe endpoint (D1 + KV + Buttondown/Resend, zero silent loss)
└── newsletter/
    ├── package.json                             # NPM scripts for weekly build & guardrail self-tests
    ├── .env.example                             # Environment variables template (no secrets committed)
    ├── README.md                                # Operator & developer documentation
    ├── registry/
    │   ├── sources.json                         # Machine-readable 28-source verified registry
    │   ├── 04-source-registry.csv               # CSV export of verified registry
    │   └── 04-excluded-sources-log.md           # Log of unverified/excluded sources kept out of pipeline
    ├── data/
    │   └── seed-issue-0.json                    # Verified Issue #0 dataset + intentional negative test item (EXCL-01)
    ├── templates/
    │   ├── 06-email-template.html               # Mobile-first, dark-mode-safe HTML email template
    │   └── 06-archive-issue-template.mdx        # Next.js /insights MDX archive template
    └── bin/
        └── run-pipeline.js                      # Deterministic guardrail, deduplication, scorer & review-package builder
```

## 2. Exact Run Commands for Muse

### A. Build & Verify Sample Issue #0 (Idempotent End-to-End Run)
```bash
node newsletter/bin/run-pipeline.js \
  --issue 0 \
  --date 2026-11-16 \
  --seed newsletter/data/seed-issue-0.json \
  --registry newsletter/registry/sources.json \
  --out-dir artifacts/file_generation/ttl=63d/output
```

### B. Run Guardrail Verification Self-Test Only (Dry Run, No File Writes)
```bash
node newsletter/bin/run-pipeline.js \
  --issue 0 \
  --date 2026-11-16 \
  --seed newsletter/data/seed-issue-0.json \
  --verify-only
```

### C. Verify Hard Approval Gate (Confirm `--send` Refuses to Execute)
```bash
node newsletter/bin/run-pipeline.js --send
# Expected: Exits immediately with status code 2 and FATAL event "APPROVAL_GATE_VIOLATION"
```

## 3. Built-In Guardrail Gates (How the Code Enforces §1.1–§1.5)

| Gate | Implementation in `run-pipeline.js` | Failure / Drop Behavior |
| :--- | :--- | :--- |
| **1. Master Rule License Gate (§1.1)** | `loadAndValidateRegistry()` + `verifySourceRef()` check every item, deadline, data corner, private wells source, and research radar paper against `newsletter/registry/sources.json`. Requires `verified: true`, a valid `https://` `verification_url`, and `license_status` in `["FREE_TO_USE_PUBLIC_DOMAIN", "FREE_TO_USE_CC", "USE_BY_CITING"]`. | Unverified items (such as `UNVERIFIED-GUARDRAIL-TEST-01` citing `EXCL-01`) are **automatically dropped** before template assembly and recorded in `review_package.dropped_items`. |
| **2. Prohibited Label Gate (§1.1 & §7)** | Scans all assembled HTML, MDX, and plain-text outputs for `"reuse terms unverified"` (case-insensitive). | Halts immediately with exit code `3` (`FORBIDDEN_LABEL_DETECTED`) and writes no output files. |
| **3. UCMR 5 & Wells Framing Gate (§1.3 & Appendix C)** | `checkTextFraming()` scans every headline, summary, and callout for prohibited compliance/violation claims (`"violation"` paired with UCMR 5 or private wells), outdated `"two million"` NC well-user claims without the canonical `2.4M–3.3M` range, and self-referential AI prompt leakage (`"tossonanalytics.com should track"`). | Halts immediately with exit code `4` (`FRAMING_OR_CITATION_GATE_FAILED`) and logs the offending item and rule in structured JSON. |
| **4. Full-URL Citation & Canonical Link Gate (§1.3)** | `verifySourceRef()` rejects any missing URL, non-HTTPS URL, or opaque `news.google.com/rss/articles/...` redirect URL. | Drops the item and logs the rejection in `dropped_items`. |
| **5. Layer Order & Proportion Gate (§2 & §6)** | Enforces fixed ordering (`NC` $\rightarrow$ `US` $\rightarrow$ `GLOBAL`) and verifies `NC.length > US.length >= GLOBAL.length`. | Halts with exit code `4` if layer proportions are violated. |
| **6. Cross-Week Deduplication (§5.5)** | `computeFingerprint()` hashes normalized URLs (stripping UTM parameters) and normalized titles with SHA-256 against `newsletter/.cache/seen-items.json`. Scoped by `issue_number` so re-running the same issue is 100% idempotent. | Drops cross-week duplicates and records them in `dropped_items`. |
| **7. Human Approval Gate (§1.5)** | `enforceNoAutoSendGate()` blocks `--send`, `--publish-live`, or `AUTO_SEND=true`. | Exits with code `2` (`APPROVAL_GATE_VIOLATION`). |
