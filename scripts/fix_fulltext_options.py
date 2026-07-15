#!/usr/bin/env python3
"""Fix all practice_questions with full-text correct_option values."""
import os, json
from supabase import create_client

url = "https://qjhxokmhbhyrykuozwhc.supabase.co"
key = open("/home/bhimsen_joshi/clat-prep/.env").read().split("SUPABASE_SERVICE_ROLE_KEY=")[1].split("\n")[0].strip()
supabase = create_client(url, key)

r = supabase.table("practice_questions").select("id,correct_option,options").limit(500).execute()

fixed = 0
skipped = 0
for q in r.data:
    co = q["correct_option"]
    opts = q.get("options", {})
    
    if len(str(co)) <= 2:  # already a single letter
        skipped += 1
        continue
    
    # Match full text to letter key
    matched = None
    for k, v in opts.items():
        co_norm = co.lower().strip().rstrip(".")
        v_norm = v.lower().strip().rstrip(".") if v else ""
        if co_norm == v_norm or co_norm in v_norm or v_norm in co_norm:
            matched = k
            break
    
    if matched:
        resp = supabase.table("practice_questions").update({"correct_option": matched}).eq("id", q["id"]).execute()
        if resp.data:
            fixed += 1
            print(f"  ✅ {q['id'][:20]}...: {co[:40]}... -> '{matched}'")
        else:
            print(f"  ❌ {q['id'][:20]}...: update failed")
    else:
        print(f"  ⚠️  {q['id'][:20]}...: NO MATCH for '{co[:40]}'")

print(f"\nTotal: fixed={fixed}, already_ok={skipped}")
