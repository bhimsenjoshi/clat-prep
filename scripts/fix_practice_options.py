#!/usr/bin/env python3
"""Find and fix practice questions with numeric correct_option values."""
import os, json
from supabase import create_client, Client

url = "https://qjhxokmhbhyrykuozwhc.supabase.co"
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or open("/home/bhimsen_joshi/clat-prep/.env").read().split("SUPABASE_SERVICE_ROLE_KEY=")[1].split("\n")[0].strip()

supabase: Client = create_client(url, key)

# Fetch all practice questions
resp = supabase.table("practice_questions").select("*").limit(1000).execute()
questions = resp.data
print(f"Total practice questions: {len(questions)}")

fixes = []
for q in questions:
    co = str(q.get("correct_option", ""))
    opts = q.get("options", {})
    if co in ("1", "2", "3", "4"):
        # This is a numeric index — map to letter key
        idx_map = {"1": "A", "2": "B", "3": "C", "4": "D"}
        mapped = idx_map[co]
        if mapped in opts:
            fixes.append((q["id"], co, mapped, q.get("question", "")[:80]))
            print(f"\nID: {q['id']}")
            print(f"  Question: {q.get('question','')[:100]}")
            print(f"  Options: {json.dumps(opts, ensure_ascii=False)}")
            print(f"  current correct_option: '{co}' (numeric) -> should be '{mapped}' ('{opts[mapped]}')")
        else:
            print(f"\nWARNING: {q['id']} has numeric co='{co}' but key '{mapped}' not in options!")
            print(f"  Options: {json.dumps(opts, ensure_ascii=False)}")

print(f"\n\nFound {len(fixes)} questions needing fix.")

# Apply fixes
if fixes:
    print("\nApplying fixes...")
    for qid, old_co, new_co, preview in fixes:
        resp = supabase.table("practice_questions").update({"correct_option": new_co}).eq("id", qid).execute()
        if resp.data:
            print(f"  ✓ {qid}: '{old_co}' -> '{new_co}' ({preview[:50]})")
        else:
            print(f"  ✗ {qid}: update failed")

print("\nDone!")
