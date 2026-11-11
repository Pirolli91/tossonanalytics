# Deliverable 8 — Handover Runbook for Muse (Weekly Production SOP & Failure Playbook)

**Prepared for:** Muse (Operator Agent for Dr. Temitope D. Soneye, PhD — [Tosson Environmental Analytics](https://tossonanalytics.com/))  
**Date:** Wednesday, November 11, 2026  
**Objective:** Enable any fresh Muse operator session to run Issue #1, Issue #2, and all subsequent weekly issues end-to-end in $\le 30$ minutes of compute on a headless Linux VM, with strict enforcement of Dr. Soneye's human approval gate (§1.5).

## 1. Weekly Production Calendar at a Glance

| Day & Time (ET) | Phase | Autonomous vs. Human-Gated | Target Duration |
| :--- | :--- | :--- | :--- |
| **Wednesday ~06:09 ET** | **Phase 1: Weekly Data & County News Refresh** (`fetch-pfas-data.js` + `fetch-county-news.js`) | Autonomous (Standing owner authorization if all 6 verification gates pass) | ~8–12 mins |
| **Friday ~16:00 ET** | **Phase 2: Newsletter Ingestion, Guardrail Build & Review Package Generation** (`run-pipeline.js`) | Autonomous build of **Review Package ONLY** (Staged locally & as `draft` in Buttondown; **NEVER sent**) | ~5 mins |
| **Friday 16:15 ET – Sunday** | **Phase 3: Owner Approval Checkpoint (Dr. Soneye)** | **STRICT HUMAN GATE (§1.5):** Present Review Package to Dr. Soneye; wait for explicit written `"Approved to send Issue #N"` | Owner review window |
| **Monday 07:30 ET** *(Only after Phase 3 approval)* | **Phase 4: Approved Email Dispatch & Web Archive Deployment** | Human-approved execution by Muse | ~3 mins |

## 2. Step-by-Step Weekly SOP Commands

### Phase 1 — Wednesday ~06:09 ET: Data & County News Refresh
```bash
cd /path/to/tossonanalytics

# 1. Backup current county-news.json and UCMR 5 data
cp public/data/county-news.json .cache/county-news.backup.json
cp public/data/pfas-nc-data.json .cache/pfas-nc-data.backup.json

# 2. Run UCMR 5 / WQP data refresh (with WQP 406 cache fallback)
node scripts/fetch-pfas-data.js

# 3. Run incremental county news refresh (retaining existing analyses where unchanged)
node scripts/fetch-county-news.js --no-ai --preserve-analysis

# 4. Ensure .cache/ucmr5-states.zip is untouched in git working tree
git checkout -- .cache/ 2>/dev/null || true

# 5. Execute the 6 Verification Gates before committing
node -e '
  const fs = require("fs");
  const today = new Date().toISOString().slice(0, 10);
  const cn = JSON.parse(fs.readFileSync("public/data/county-news.json", "utf8"));
  const pfas = JSON.parse(fs.readFileSync("public/data/pfas-nc-data.json", "utf8"));
  const counties = Object.keys(cn.counties || cn);
  const totalArticles = Object.values(cn.counties || cn).reduce((acc, c) => acc + ((c.articles || []).length), 0);
  if (counties.length !== 100) throw new Error("Gate Failed: counties !== 100");
  if (totalArticles <= 200) throw new Error(`Gate Failed: totalArticles (${totalArticles}) <= 200`);
  console.log("Verification Gates Passed:", { today, counties: counties.length, totalArticles });
'

# 6. Commit ONLY the three data files and push to master
git add public/data/pfas-nc-data.json public/data/pfas-sites.json public/data/county-news.json
git commit -m "chore(data): weekly UCMR 5 and NC county news refresh ($(date +%F))"
git push origin master
```

### Phase 2 — Friday ~16:00 ET: Build the Weekly Newsletter Review Package
```bash
cd /path/to/tossonanalytics

# 1. Prepare the week's candidate issue JSON in newsletter/data/issue-<N>.json
#    Every item MUST reference a valid source_id from newsletter/registry/sources.json
#    and adhere to §1.1 (verified license), §1.3 (screening framing + full URLs), and Appendix C.

# 2. Run the Guardrail Pipeline to validate, dedupe, score, and assemble the Review Package
node newsletter/bin/run-pipeline.js \
  --issue <N> \
  --date <YYYY-MM-DD> \
  --seed newsletter/data/issue-<N>.json \
  --registry newsletter/registry/sources.json \
  --out-dir newsletter/out/issue-<N>

# 3. Inspect the generated Review Package JSON manifest
cat newsletter/out/issue-<N>/09-sample-issue-0-review-package.json
```

**What `run-pipeline.js` outputs in `newsletter/out/issue-<N>/`:**
- `09-sample-issue-0.html` (or `issue-<N>.html`) — Ready-to-render HTML email.
- `09-sample-issue-0.mdx` (or `issue-<N>.mdx`) — Ready-to-commit `/insights` MDX web archive article (with `draft: true` and `review_status: "PENDING_OWNER_APPROVAL"`).
- `09-sample-issue-0.txt` (or `issue-<N>.txt`) — Plain-text fallback email.
- `09-sample-issue-0-review-package.json` — Complete guardrail audit report listing `verified_sources_used`, `dropped_items` (any unverified or duplicate items caught by the gate), and `warnings`.

### Phase 3 — Human Approval Checkpoint (MANDATORY — §1.5)
1. **Present the Review Package to Dr. Soneye:** Share the rendered `.mdx` / `.html` preview, the source table from `review-package.json`, and any flagged items (`dropped_items` or `warnings`).
2. **Stage as Draft in Buttondown (Optional Preview Email to Owner Only):**
   ```bash
   curl -X POST "https://api.buttondown.com/v1/emails" \
     -H "Authorization: Token ${BUTTONDOWN_API_KEY}" \
     -H "Content-Type: application/json" \
     -d @<(jq -n \
       --arg subj "Carolina PFAS Weekly — Issue #<N>: <Title>" \
       --rawfile body newsletter/out/issue-<N>/09-sample-issue-0.html \
       '{subject: $subj, body: $body, status: "draft"}')
   ```
3. **STOP AND WAIT:** Do **not** change `status` from `"draft"` to `"about_to_send"` and do **not** push the `.mdx` file to `content/insights/` on `master` until Dr. Soneye explicitly approves the exact text.

### Phase 4 — Monday 07:30 ET (Post-Approval Only): Send & Archive Deploy
Once Dr. Soneye replies with explicit approval:
```bash
# 1. Remove the orange SAMPLE/DRAFT review banner and set draft: false in the MDX front-matter
sed -i 's/draft: true/draft: false/' newsletter/out/issue-<N>/09-sample-issue-0.mdx
sed -i 's/review_status: "PENDING_OWNER_APPROVAL"/review_status: "APPROVED_AND_PUBLISHED"/' newsletter/out/issue-<N>/09-sample-issue-0.mdx

# 2. Copy the approved MDX into the site's /insights content directory, commit, and push
cp newsletter/out/issue-<N>/09-sample-issue-0.mdx content/insights/<YYYY-MM-DD>-carolina-pfas-weekly-issue-<N>.mdx
git add content/insights/<YYYY-MM-DD>-carolina-pfas-weekly-issue-<N>.mdx
git commit -m "feat(newsletter): publish Carolina PFAS Weekly Issue #<N> (owner approved)"
git push origin master

# 3. Trigger approved dispatch in Buttondown (updating the approved draft ID)
curl -X PATCH "https://api.buttondown.com/v1/emails/${APPROVED_EMAIL_ID}" \
  -H "Authorization: Token ${BUTTONDOWN_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"status": "about_to_send"}'
```

## 3. Failure Playbook (What to Do When a Gate Trips)

| Failure Code / Symptom | Meaning | Exact Recovery Action for Muse |
| :--- | :--- | :--- |
| **Exit Code `2` (`APPROVAL_GATE_VIOLATION`)** | `--send`, `--publish-live`, or `AUTO_SEND=true` was passed to `run-pipeline.js`. | Remove `--send` / `AUTO_SEND`. `run-pipeline.js` is strictly a review-package builder; sending is performed only in Phase 4 after Dr. Soneye's approval. |
| **Exit Code `3` (`FORBIDDEN_LABEL_DETECTED`)** | The phrase `"reuse terms unverified"` appeared in an item or template. | Inspect the seed JSON; either verify the source's license on its official page and add it to `newsletter/registry/sources.json`, or delete the item completely. |
| **Exit Code `4` (`FRAMING_OR_CITATION_GATE_FAILED`)** | Critical flag triggered in `checkTextFraming()` or `verifySourceRef()` (e.g., UCMR 5 `"violation"` wording, `"two million"` wells without `2.4M–3.3M`, missing `https://` URL, or `NC <= US` item count). | Read the JSON error output on stdout (`criticalFlags`), fix the offending phrasing to use `"above MCL benchmark"` / `"screening comparison"` or add the missing NC item, and re-run `run-pipeline.js` (re-runs are idempotent). |
| **`GUARDRAIL_DROP_UNVERIFIED_SOURCE` Warning** | An item referenced a `source_id` not in `sources.json` (or marked `verified: false`). | The pipeline automatically excluded the item so the rest of the issue could build safely. Check `review_package.dropped_items` to confirm the drop was expected. |
| **Cloudflare `/api/subscribe` returns HTTP `503`** | Neither `SUBSCRIBERS_D1`, `SUBSCRIBERS_KV`, nor `BUTTONDOWN_API_KEY` is bound in the Cloudflare Pages environment. | In Cloudflare Dashboard $\rightarrow$ Pages $\rightarrow$ `tossonanalytics` $\rightarrow$ Settings $\rightarrow$ Environment Variables / Bindings, add `BUTTONDOWN_API_KEY` and bind the `SUBSCRIBERS_KV` namespace. |
