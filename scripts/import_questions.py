#!/usr/bin/env python3
"""
Import reviewed questions from an LLM-updated JSON file back into Supabase.
Expected format: Same as questions_for_review.json
  - 'id' must match existing DB records (for UPDATE)
  - Changed fields: question_text, options, correct_option, explanation, difficulty, passage, tags, topic
"""
import json
import os
import urllib.request
import sys

# Read .env
env = {}
with open('/home/bhimsen_joshi/clat-prep/.env') as f:
    for line in f:
        line = line.strip()
        if line and not line.startswith('#'):
            k, _, v = line.partition('=')
            env[k.strip()] = v.strip()

SUPABASE_URL = env.get('NEXT_PUBLIC_SUPABASE_URL', '')

if not SUPABASE_URL:
    print("ERROR: NEXT_PUBLIC_SUPABASE_URL not found in .env")
    sys.exit(1)
SERVICE_KEY = env.get('SUPABASE_SERVICE_ROLE_KEY', '')

if not SERVICE_KEY:
    print("ERROR: SUPABASE_SERVICE_ROLE_KEY not found in .env")
    sys.exit(1)

input_path = sys.argv[1] if len(sys.argv) > 1 else '/home/bhimsen_joshi/clat-prep/questions_for_review.json'

with open(input_path) as f:
    data = json.load(f)

updates = []
for sk, sec in data['sections'].items():
    for q in sec['questions']:
        qid = q.get('id')
        if not qid:
            print(f"WARNING: Question missing 'id' in {sk}, skipping")
            continue
        updates.append((sk, qid, q))

print(f"Found {len(updates)} questions to update\n")

# Dry-run mode
dry_run = '--dry-run' in sys.argv

for sk, qid, q in updates:
    existing_id = qid  # keep original UUID
    payload = {
        "question_text": q["question_text"],
        "options": q["options"],
        "correct_option": q["correct_option"],
        "explanation": q.get("explanation", ""),
        "difficulty": q.get("difficulty", "medium"),
        "tags": q.get("tags", []),
    }
    if "passage" in q:
        payload["passage"] = q["passage"]
    if "topic" in q:
        payload["topic"] = q["topic"]

    if dry_run:
        print(f"[DRY RUN] Would update {sk}/{qid}")
        continue

    # PATCH the question
    url = f"{SUPABASE_URL}/rest/v1/practice_questions?id=eq.{existing_id}"
    req = urllib.request.Request(url, 
        data=json.dumps(payload).encode(),
        method='PATCH',
        headers={
            "apikey": SERVICE_KEY,
            "Authorization": f"Bearer {SERVICE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "return=minimal",
        })
    try:
        with urllib.request.urlopen(req) as resp:
            status = resp.status
            if status == 204:
                print(f"✓ Updated {sk}/{qid[:8]}...")
            else:
                print(f"? {sk}/{qid[:8]}... status={status}")
    except urllib.error.HTTPError as e:
        print(f"✗ FAILED {sk}/{qid[:8]}... HTTP {e.code}: {e.read().decode()[:200]}")

print(f"\nDone! {'(dry run — no changes made)' if dry_run else 'All updates applied.'}")
