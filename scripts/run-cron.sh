#!/bin/bash
set -e
cd /home/bhimsen_joshi/clat-prep
# Source .env if available
if [ -f .env ]; then
  set -a
  source .env
  set +a
fi
# Run the node script
node scripts/daily-questions-cron.mjs
