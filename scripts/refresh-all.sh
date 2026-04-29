#!/bin/bash
# Tosson Analytics — Full Pipeline Refresh
# This script runs all data and news pipelines and pushes updates to GitHub.

set -e

PROJECT_DIR="/home/temitope/tossonanalytics"
KNOWLEDGE_DIR="/home/temitope/knowledge"
NODE_BIN="/home/temitope/.openagents/nodejs/bin/node"
PYTHON_BIN="/usr/bin/python3"

# Load environment variables (handling quotes)
if [ -f "/home/temitope/.hermes/.env" ]; then
    while IFS='=' read -r key value; do
        [[ $key =~ ^#.* ]] && continue
        [[ -z $key ]] && continue
        # Strip quotes from value
        value=$(echo "$value" | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//")
        export "$key=$value"
    done < "/home/temitope/.hermes/.env"
fi

echo "🚀 Starting Tosson Analytics Refresh: $(date)"

# 1. Update Knowledge Reports
echo "--- 1. Updating Knowledge Reports ---"
$PYTHON_BIN $KNOWLEDGE_DIR/nc_pfas_scout.py
$PYTHON_BIN $KNOWLEDGE_DIR/nc_regulatory_scout.py
$PYTHON_BIN $KNOWLEDGE_DIR/pfas_project_harvester.py
$PYTHON_BIN $KNOWLEDGE_DIR/tosson_research_harvester.py
$PYTHON_BIN $KNOWLEDGE_DIR/nc_governance_harvester.py
$PYTHON_BIN $KNOWLEDGE_DIR/nano_scout.py

# 2. Run PFAS Data Pipeline
echo "--- 2. Running PFAS Data Pipeline ---"
cd $PROJECT_DIR
$NODE_BIN scripts/fetch-pfas-data.js

# 3. Run Insights & News Pipelines
echo "--- 3. Running Insights & News Pipelines ---"
# Generate expert editorial articles
$NODE_BIN scripts/fetch-insights.js
# Generate county-level news with expert summaries
$NODE_BIN scripts/fetch-county-news.js

# 4. Commit and Push
echo "--- 4. Committing and Pushing Updates ---"
git add public/data/pfas-nc-data.json public/data/pfas-sites.json public/data/county-news.json
if git diff --staged --quiet; then
    echo "No data changes to commit."
else
    git commit -m "chore: automated data refresh $(date +%Y-%m-%d)"
    git push origin master
fi

# 5. Send Notification
echo "--- 5. Sending Notifications ---"
if [ -n "$TELEGRAM_BOT_TOKEN" ]; then
    MSG="🚀 *Tosson Analytics Refresh Complete*
    📍 Date: $(date +'%Y-%m-%d')
    ✅ Knowledge Updated
    ✅ Data Pipeline Run
    ✅ Site Deployed to Cloudflare"
    
    curl -s -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/sendMessage" \
        -d "chat_id=577681460" \
        -d "text=$MSG" \
        -d "parse_mode=Markdown"
else
    echo "ℹ️ Telegram Token not set. Skipping notification."
fi

echo "✅ Pipeline Complete: $(date)"
