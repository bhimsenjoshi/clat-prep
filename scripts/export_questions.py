#!/usr/bin/env python3
"""Export all practice questions in a format suitable for LLM review."""
import json
import os
import sys
import urllib.request

# Read .env
env = {}
with open('/home/bhimsen_joshi/clat-prep/.env') as f:
    for line in f:
        line = line.strip()
        if line and not line.startswith('#'):
            k, _, v = line.partition('=')
            env[k.strip()] = v.strip()

SUPABASE_URL = env.get('NEXT_PUBLIC_SUPABASE_URL', '')
SERVICE_KEY = env.get('SUPABASE_SERVICE_ROLE_KEY', '')

if not SUPABASE_URL:
    print("ERROR: NEXT_PUBLIC_SUPABASE_URL not found in .env")
    sys.exit(1)
if not SERVICE_KEY:
    print("ERROR: SUPABASE_SERVICE_ROLE_KEY not found in .env")
    sys.exit(1)

# Query all questions sorted by section
url = f"{SUPABASE_URL}/rest/v1/practice_questions?select=id,section,topic,question_text,passage,options,correct_option,difficulty,explanation,tags&order=section.asc,id.asc"
req = urllib.request.Request(url, headers={
    "apikey": SERVICE_KEY,
    "Authorization": f"Bearer {SERVICE_KEY}",
    "Content-Type": "application/json",
})

with urllib.request.urlopen(req) as resp:
    questions = json.loads(resp.read())

print(f"Total questions: {len(questions)}")

# Group by section
sections = {}
for q in questions:
    s = q.get('section', 'Unknown')
    sections.setdefault(s, []).append(q)

for s, qs in sorted(sections.items()):
    print(f"  {s}: {len(qs)} questions")

# Export in review-friendly format
output = {
    "export_date": "2026-07-09",
    "total_questions": len(questions),
    "sections": {}
}

for s, qs in sorted(sections.items()):
    section_key = s.replace(' ', '_').lower()
    output["sections"][section_key] = {
        "name": s,
        "count": len(qs),
        "questions": []
    }
    for q in qs:
        entry = {
            "id": q["id"],
            "difficulty": q.get("difficulty", "medium"),
            "topic": q.get("topic", "general"),
            "question_text": q["question_text"],
            "options": q["options"],
            "correct_option": q["correct_option"],
            "explanation": q.get("explanation", ""),
            "tags": q.get("tags", []),
        }
        if q.get("passage"):
            entry["passage"] = q["passage"]
        output["sections"][section_key]["questions"].append(entry)

output_path = "/home/bhimsen_joshi/clat-prep/questions_for_review.json"
with open(output_path, 'w', encoding='utf-8') as f:
    json.dump(output, f, indent=2, ensure_ascii=False)

print(f"\nExported to: {output_path}")
print(f"File size: {os.path.getsize(output_path):,} bytes")
