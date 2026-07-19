#!/bin/bash
set -e
cd /home/bhimsen_joshi/clat-prep
source .env 2>/dev/null

SUPABASE_URL="$NEXT_PUBLIC_SUPABASE_URL"
SERVICE_KEY="$SUPABASE_SERVICE_ROLE_KEY"

echo "=== Quiz Responses (all) ==="
curl -s "${SUPABASE_URL}/rest/v1/quiz_responses?select=id" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERCE_KEY}" 2>&1 | python3 -c "
import sys, json
data = json.load(sys.stdin)
if isinstance(data, list):
    print('Count:', len(data))
    for r in data:
        print(' ', r.get('id','?')[:8])
else:
    print(data)
"

echo ""
echo "=== Quiz Sessions (all) ==="
curl -s "${SUPABASE_URL}/rest/v1/quiz_sessions?select=id,section,questions_answered" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERCE_KEY}" 2>&1 | python3 -c "
import sys, json
data = json.load(sys.stdin)
if isinstance(data, list):
    print('Count:', len(data))
    for r in data:
        print(' ', r.get('id','?')[:8], '|', str(r.get('section','?'))[:20], '| answered:', r.get('questions_answered',0))
else:
    print(data)
"
