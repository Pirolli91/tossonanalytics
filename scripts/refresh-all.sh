#!/bin/bash
# Tosson Analytics — Full Pipeline Refresh
# This script runs all data and news pipelines and pushes updates to GitHub.

set -e

PROJECT_DIR="/home/temitope/tossonanalytics"
KNOWLEDGE_DIR="/home/temitope/knowledge"
NODE_BIN="/home/temitope/.openagents/nodejs/bin/node"
PYTHON_BIN="/usr/bin/python3"

echo "🚀 Starting Tosson Analytics Refresh: $(date)"

# 1. Update Knowledge Reports
echo "--- 1. Updating Knowledge Reports ---"
$PYTHON_BIN $KNOWLEDGE_DIR/nc_pfas_scout.py
$PYTHON_BIN $KNOWLEDGE_DIR/nc_regulatory_scout.py
$PYTHON_BIN $KNOWLEDGE_DIR/pfas_project_harvester.py
$PYTHON_BIN $KNOWLEDGE_DIR/tosson_research_harvester.py
$PYTHON_BIN $KNOWLEDGE_DIR/nc_governance_harvester.py

# 2. Run PFAS Data Pipeline
echo "--- 2. Running PFAS Data Pipeline ---"
cd $PROJECT_DIR
$NODE_BIN scripts/fetch-pfas-data.js

# 3. Run County News Pipeline (using --no-ai if local model missing)
echo "--- 3. Running County News Pipeline ---"
# Check if llama-server exists, if not use --no-ai or rely on script fallbacks
$NODE_BIN scripts/fetch-county-news.js --no-ai

# 4. Commit and Push
echo "--- 4. Committing and Pushing Updates ---"
git add public/data/pfas-nc-data.json public/data/pfas-sites.json public/data/county-news.json
if git diff --staged --quiet; then
    echo "No data changes to commit."
else
    git commit -m "chore: automated data refresh $(date +%Y-%m-%d)"
    git push origin master
fi

echo "✅ Pipeline Complete: $(date)"
