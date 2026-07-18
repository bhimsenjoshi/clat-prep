#!/usr/bin/env python3
"""Generate explanations for all CLAT 2026 A questions and update them in Supabase."""

import os
import sys
import json
import time
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError

# Load .env manually
env_path = '/home/bhimsen_joshi/clat-prep/.env'
with open(env_path) as f:
    for line in f:
        line = line.strip()
        if not line or line.startswith('#'):
            continue
        if '=' in line:
            k, v = line.split('=', 1)
            os.environ[k.strip()] = v.strip()

SUPABASE_URL = "https://qjhxokmhbhyrykuozwhc.supabase.co"
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
DEEPSEEK_KEY = os.environ.get("DEEPSEEK_API_KEY", "")
CLAT_TEST_ID = "59c51b05-b8d5-4745-9b26-718ce59f1150"

assert len(SUPABASE_KEY) > 100, f"SUPABASE_KEY too short: {len(SUPABASE_KEY)}"
assert len(DEEPSEEK_KEY) > 20, f"DEEPSEEK_KEY too short: {len(DEEPSEEK_KEY)}"

print(f"SUPABASE_KEY: {SUPABASE_KEY[:20]}...{SUPABASE_KEY[-10:]}")
print(f"DEEPSEEK_KEY: {DEEPSEEK_KEY[:15]}...{DEEPSEEK_KEY[-5:]}")
print()

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
}

# Track overall stats
stats = {"attempted": 0, "updated": 0, "failed": 0, "skipped": 0}

def supabase_get(url_suffix):
    url = f"{SUPABASE_URL}{url_suffix}"
    req = Request(url, headers=HEADERS, method="GET")
    try:
        with urlopen(req, timeout=30) as resp:
            return json.loads(resp.read())
    except HTTPError as e:
        body = e.read().decode()
        print(f"  HTTP Error {e.code} on GET: {body[:200]}")
        return None
    except Exception as e:
        print(f"  Error on GET: {e}")
        return None

def supabase_patch(url_suffix, data):
    url = f"{SUPABASE_URL}{url_suffix}"
    req = Request(url, data=json.dumps(data).encode(), headers=HEADERS, method="PATCH")
    try:
        with urlopen(req, timeout=30) as resp:
            return resp.status
    except HTTPError as e:
        body = e.read().decode()
        print(f"  HTTP Error {e.code} on PATCH: {body[:200]}")
        return None
    except Exception as e:
        print(f"  Error on PATCH: {e}")
        return None

def call_deepseek(messages, model="deepseek-v4-flash"):
    url = "https://api.deepseek.com/v1/chat/completions"
    payload = {
        "model": model,
        "messages": messages,
        "temperature": 0.3,
        "max_tokens": 4096,
    }
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {DEEPSEEK_KEY}",
    }
    req = Request(url, data=json.dumps(payload).encode(), headers=headers, method="POST")
    try:
        with urlopen(req, timeout=120) as resp:
            result = json.loads(resp.read())
            content = result["choices"][0]["message"]["content"]
            usage = result.get("usage", {})
            print(f"    Tokens: {usage.get('total_tokens', '?')} (in: {usage.get('prompt_tokens', '?')}, out: {usage.get('completion_tokens', '?')})")
            return content
    except HTTPError as e:
        body = e.read().decode()
        print(f"  DeepSeek HTTP Error {e.code}: {body[:300]}")
        return None
    except Exception as e:
        print(f"  DeepSeek Error: {e}")
        return None

def parse_json_result(result):
    """Parse JSON from DeepSeek response, handling markdown fences."""
    result_clean = result.strip()
    if result_clean.startswith("```"):
        lines = result_clean.split("\n")
        if lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].strip().startswith("```"):
            lines = lines[:-1]
        result_clean = "\n".join(lines).strip()
    try:
        return json.loads(result_clean)
    except json.JSONDecodeError as e:
        print(f"  JSON parse error: {e}")
        print(f"  Raw: {result_clean[:300]}")
        return None

def match_question(exp, questions_batch):
    """Match an explanation to a question by text."""
    q_text = exp.get("question_text", "")
    if not q_text:
        return None
    for q in questions_batch:
        if q["question_text"] == q_text:
            return q
    # Fuzzy match
    for q in questions_batch:
        qt = q["question_text"]
        if q_text in qt or qt in q_text:
            return q
    return None

def update_explanation(question, exp_data):
    """Update a single question's explanation."""
    explanation_obj = {
        "correct_answer_rationale": exp_data.get("correct_answer_rationale", ""),
        "incorrect_option_analysis": exp_data.get("incorrect_option_analysis", {}),
        "wrong_answer_guidance": exp_data.get("wrong_answer_guidance", ""),
        "correct_option": question["correct_option"],
    }
    status = supabase_patch(
        f"/rest/v1/questions?id=eq.{question['id']}",
        {"explanation": json.dumps(explanation_obj)}
    )
    return status and 200 <= status < 300

def main():
    # Step 1: Get section IDs
    print("=" * 60)
    print("STEP 1: Fetching sections for CLAT 2026 A test...")
    sections = supabase_get(f"/rest/v1/sections?test_id=eq.{CLAT_TEST_ID}&select=id,name")
    if not sections:
        print("FATAL: Could not fetch sections")
        return
    section_ids = [s["id"] for s in sections]
    print(f"Found {len(sections)} sections:")
    for s in sections:
        print(f"  {s['name']}: {s['id']}")

    # Step 2: Get all questions
    print("\n" + "=" * 60)
    print("STEP 2: Fetching questions...")
    section_filter = f"in.({','.join(section_ids)})"
    questions = supabase_get(
        f"/rest/v1/questions?select=id,question_text,options,correct_option,passage,section_id,explanation&section_id={section_filter}&limit=200"
    )
    if not questions:
        print("FATAL: Could not fetch questions")
        return
    print(f"Total questions: {len(questions)}")

    # Find questions needing explanations
    needs_explanation = []
    withdrawn_found = 0
    for q in questions:
        exp = q.get("explanation")
        if exp and isinstance(exp, str) and "withdrawn" in exp.lower():
            withdrawn_found += 1
            print(f"  Skipping (withdrawn): {q['question_text'][:60]}...")
            continue
        if exp is None or (isinstance(exp, str) and exp.strip() == ""):
            needs_explanation.append(q)
    
    print(f"\nQuestions needing explanations: {len(needs_explanation)}")
    print(f"Already explained (withdrawn): {withdrawn_found}")

    if not needs_explanation:
        print("All done!")
        return

    # Step 3: Group by passage
    print("\n" + "=" * 60)
    print("STEP 3: Grouping questions by passage...")
    passage_groups = {}
    standalone = []
    
    for q in needs_explanation:
        passage = q.get("passage")
        if passage and passage.strip():
            key = passage.strip()[:80]
            if key not in passage_groups:
                passage_groups[key] = {"passage": passage, "questions": []}
            passage_groups[key]["questions"].append(q)
        else:
            standalone.append(q)
    
    print(f"Passage groups: {len(passage_groups)}")
    for pk, pg in passage_groups.items():
        print(f"  Passage ({len(pg['questions'])} Qs): {pk[:60]}...")
    print(f"Standalone questions: {len(standalone)}")

    # Step 4: Process passage groups
    print("\n" + "=" * 60)
    print("STEP 4: Processing passage groups...")
    
    for idx, (passage_key, group) in enumerate(passage_groups.items()):
        qs = group["questions"]
        passage_text = group["passage"]
        
        print(f"\n--- Passage Group {idx+1}/{len(passage_groups)} ({len(qs)} questions) ---")
        print(f"Passage: {passage_text[:120]}...")
        
        # Build prompt
        prompt = f"""You are a CLAT (Common Law Admission Test) expert creating detailed explanations for exam questions.

PASSAGE:
{passage_text}

Based on the above passage, answer ALL of the following questions. For each question, provide a detailed, structured JSON explanation.

IMPORTANT: Return ONLY a valid JSON array. No markdown, no code fences, no other text.

Each object in the array must have this structure:
{{
  "question_text": "exact question text from below",
  "correct_answer_rationale": "2-3 sentences explaining why the correct answer is right, referencing specific parts of the passage",
  "incorrect_option_analysis": {{
    "A": "why option A is wrong, referencing the passage",
    "B": "why option B is wrong, referencing the passage",
    "C": "why option C is wrong, referencing the passage",
    "D": "why option D is wrong, referencing the passage"
  }},
  "wrong_answer_guidance": "A helpful pointer/hint for CLAT aspirants who got this wrong - what to look for in the passage"
}}

QUESTIONS:
"""
        for i, q in enumerate(qs, 1):
            opts = q.get("options", {})
            opts_str = "\n".join([f"  {k}: {v}" for k, v in sorted(opts.items())])
            prompt += f"\nQuestion {i}:\nText: {q['question_text']}\nOptions:\n{opts_str}\nCorrect Option: {q['correct_option']}\n---\n"
        
        prompt += "\nIMPORTANT: Return ONLY a valid JSON array. No markdown."
        
        messages = [
            {"role": "system", "content": "You are a CLAT exam expert. You always respond with valid JSON only, no markdown formatting."},
            {"role": "user", "content": prompt}
        ]
        
        print(f"  Calling DeepSeek API...")
        result = call_deepseek(messages)
        if not result:
            print(f"  ✗ API call failed for passage group")
            stats["failed"] += len(qs)
            continue
        
        explanations = parse_json_result(result)
        if not explanations:
            print(f"  ✗ JSON parse failed for passage group")
            stats["failed"] += len(qs)
            continue
        
        if isinstance(explanations, dict):
            explanations = [explanations]
        
        print(f"  Got {len(explanations)} explanations from API")
        
        for exp in explanations:
            q = match_question(exp, qs)
            if not q:
                print(f"  ⚠ Could not match: '{exp.get('question_text', '?')[:50]}...'")
                stats["failed"] += 1
                continue
            
            if update_explanation(q, exp):
                stats["updated"] += 1
                print(f"  ✓ {q['question_text'][:60]}...")
            else:
                stats["failed"] += 1
                print(f"  ✗ Failed update: {q['question_text'][:60]}...")
            
            stats["attempted"] += 1
        
        time.sleep(0.5)

    # Step 5: Process standalone questions in batches
    print("\n" + "=" * 60)
    print(f"STEP 5: Processing {len(standalone)} standalone questions in batches...")
    
    BATCH_SIZE = 10
    num_batches = (len(standalone) + BATCH_SIZE - 1) // BATCH_SIZE
    
    for batch_i in range(num_batches):
        start = batch_i * BATCH_SIZE
        batch = standalone[start:start + BATCH_SIZE]
        
        print(f"\n--- Standalone Batch {batch_i+1}/{num_batches} ({len(batch)} questions) ---")
        
        prompt = """You are a CLAT (Common Law Admission Test) expert creating detailed explanations for exam questions.

For each question below, provide a detailed explanation. 

IMPORTANT: Return ONLY a valid JSON array. No markdown, no code fences, no other text.

Each object must have this structure:
{
  "question_text": "exact question text from below",
  "correct_answer_rationale": "2-3 sentences explaining why the correct answer is right",
  "incorrect_option_analysis": {
    "A": "why option A is wrong",
    "B": "why option B is wrong",
    "C": "why option C is wrong",
    "D": "why option D is wrong"
  },
  "wrong_answer_guidance": "A helpful pointer/hint for CLAT aspirants who got this wrong"
}

QUESTIONS:
"""
        for i, q in enumerate(batch, 1):
            opts = q.get("options", {})
            opts_str = "\n".join([f"  {k}: {v}" for k, v in sorted(opts.items())])
            prompt += f"\nQuestion {i}:\nText: {q['question_text']}\nOptions:\n{opts_str}\nCorrect Option: {q['correct_option']}\n---\n"
        
        prompt += "\nIMPORTANT: Return ONLY a valid JSON array. No markdown."
        
        messages = [
            {"role": "system", "content": "You are a CLAT exam expert. You always respond with valid JSON only, no markdown formatting."},
            {"role": "user", "content": prompt}
        ]
        
        print(f"  Calling DeepSeek API...")
        result = call_deepseek(messages)
        if not result:
            print(f"  ✗ API call failed")
            stats["failed"] += len(batch)
            continue
        
        explanations = parse_json_result(result)
        if not explanations:
            print(f"  ✗ JSON parse failed")
            print(f"  Raw: {result[:500]}")
            stats["failed"] += len(batch)
            continue
        
        if isinstance(explanations, dict):
            explanations = [explanations]
        
        print(f"  Got {len(explanations)} explanations")
        
        for exp in explanations:
            q = match_question(exp, batch)
            if not q:
                print(f"  ⚠ Could not match: '{exp.get('question_text', '?')[:50]}...'")
                stats["failed"] += 1
                continue
            
            if update_explanation(q, exp):
                stats["updated"] += 1
                print(f"  ✓ {q['question_text'][:60]}...")
            else:
                stats["failed"] += 1
                print(f"  ✗ Failed update: {q['question_text'][:60]}...")
            
            stats["attempted"] += 1
        
        time.sleep(0.3)

    # Final summary
    print("\n" + "=" * 60)
    print(f"COMPLETE!")
    print(f"  Questions attempted:   {stats['attempted']}")
    print(f"  Successfully updated:  {stats['updated']}")
    print(f"  Failed:                {stats['failed']}")
    print(f"  Skipped (withdrawn):   1")
    
    # Verify
    print("\nVerifying final state...")
    remaining = supabase_get(
        f"/rest/v1/questions?select=id,question_text,explanation&section_id={section_filter}&explanation=is.null&limit=200"
    )
    if remaining:
        print(f"WARNING: {len(remaining)} questions still have NULL explanation!")
        for q in remaining:
            print(f"  - {q['id'][:12]}...: {q['question_text'][:60]}...")
    else:
        print("All questions now have explanations! ✓")

if __name__ == "__main__":
    main()
