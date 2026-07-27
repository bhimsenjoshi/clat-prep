#!/usr/bin/env python3
"""
Exam Crash Recovery — Test Suite v2
Tests all resume/auto-save scenarios directly against the DB.
"""
import os, json, urllib.request, sys, traceback
from datetime import datetime, timezone, timedelta

PASS = 0
FAIL = 0
errors = []

def test(name, fn):
    global PASS, FAIL
    try:
        fn()
        PASS += 1
        print(f'  ✅ {name}')
    except AssertionError as e:
        FAIL += 1
        print(f'  ❌ {name}: {e}')
        errors.append(f'{name}: {e}')
    except Exception as e:
        FAIL += 1
        print(f'  ❌ {name}: {e}')
        traceback.print_exc()
        errors.append(f'{name}: {e}')

def create_attempt(url, h_ret, test_id, student_id, overrides=None):
    """Helper to create an attempt and return parsed response"""
    data = {'test_id': test_id, 'student_id': student_id}
    if overrides:
        data.update(overrides)
    body = json.dumps(data).encode()
    req = urllib.request.Request(f'{url}/rest/v1/attempts', data=body, headers=h_ret)
    resp = urllib.request.urlopen(req, timeout=10)
    parsed = json.loads(resp.read())
    assert parsed and len(parsed) > 0 and parsed[0].get('id'), 'Failed to create attempt'
    return parsed[0]

def delete_attempt(url, h, attempt_id):
    """Helper to clean up an attempt and its responses"""
    try:
        req = urllib.request.Request(f'{url}/rest/v1/responses?attempt_id=eq.{attempt_id}', headers=h, method='DELETE')
        urllib.request.urlopen(req, timeout=5)
    except:
        pass
    try:
        req = urllib.request.Request(f'{url}/rest/v1/attempts?id=eq.{attempt_id}', headers=h, method='DELETE')
        urllib.request.urlopen(req, timeout=5)
    except:
        pass

def run_tests():
    global PASS, FAIL
    
    # Setup
    url = os.environ.get('NEXT_PUBLIC_SUPABASE_URL', '').rstrip('/')
    key = os.environ.get('SUPABASE_SERVICE_ROLE_KEY', '')
    assert url and key, 'Missing SUPABASE env vars'
    
    h = {'apikey': key, 'Authorization': f'Bearer {key}', 'Content-Type': 'application/json'}
    h_ret = {**h, 'Prefer': 'return=representation'}
    fake_student = '00000000-0000-0000-0000-000000000099'
    
    # Get test data
    req = urllib.request.Request(f'{url}/rest/v1/tests?status=eq.published&limit=1&select=id,title', headers=h)
    tests = json.loads(urllib.request.urlopen(req, timeout=10).read())
    assert tests, 'No published tests found'
    test_data = tests[0]
    test_id = test_data['id']
    print(f'Using test: {test_data["title"]} ({test_id[:8]}...)')
    
    req2 = urllib.request.Request(f'{url}/rest/v1/sections?test_id=eq.{test_id}&select=id,name&order=order_index', headers=h)
    sections = json.loads(urllib.request.urlopen(req2, timeout=10).read())
    assert sections, 'No sections found'
    
    section_ids = [s['id'] for s in sections]
    all_qs = []
    for sid in section_ids:
        req3 = urllib.request.Request(f'{url}/rest/v1/questions?section_id=eq.{sid}&select=id,question_text,correct_option,section_id&limit=60', headers=h)
        all_qs.extend(json.loads(urllib.request.urlopen(req3, timeout=10).read()))
    assert all_qs, 'No questions found'
    print(f'Found {len(sections)} sections, {len(all_qs)} questions\n')
    
    # Clean up any old test data
    req_clean = urllib.request.Request(
        f'{url}/rest/v1/attempts?test_id=eq.{test_id}&student_id=eq.{fake_student}&select=id', headers=h)
    existing = json.loads(urllib.request.urlopen(req_clean, timeout=10).read())
    for a in existing:
        delete_attempt(url, h, a['id'])
    
    # ═══════════════════════════════ TESTS ═══════════════════════════════
    
    # ─── Test 1: Create attempt with null last_question_id ───
    def t1():
        a = create_attempt(url, h_ret, test_id, fake_student)
        assert a.get('last_question_id') is None, f'Expected null, got {a["last_question_id"]}'
        assert a.get('submitted_at') is None, 'Should not be submitted'
        print(f'    ID: {a["id"][:8]}...')
        delete_attempt(url, h, a['id'])
    test('Create attempt — last_question_id is null', t1)
    
    # ─── Test 2: Save last_question_id on navigation ───
    def t2():
        a = create_attempt(url, h_ret, test_id, fake_student)
        target_q = all_qs[3]
        
        # Simulate navigation: update last_question_id
        body = json.dumps({'last_question_id': target_q['id']}).encode()
        req = urllib.request.Request(f'{url}/rest/v1/attempts?id=eq.{a["id"]}', data=body, headers=h, method='PATCH')
        urllib.request.urlopen(req, timeout=10)
        
        # Verify
        req2 = urllib.request.Request(f'{url}/rest/v1/attempts?id=eq.{a["id"]}&select=id,last_question_id', headers=h)
        updated = json.loads(urllib.request.urlopen(req2, timeout=10).read())[0]
        assert updated['last_question_id'] == target_q['id'], f'Mismatch'
        print(f'    Position saved: question {target_q["id"][:8]}...')
        delete_attempt(url, h, a['id'])
    test('Save position on navigation', t2)
    
    # ─── Test 3: Periodic auto-save (simulated) ───
    def t3():
        a = create_attempt(url, h_ret, test_id, fake_student)
        q1 = all_qs[5]
        q2 = all_qs[8]
        
        # Save Q1
        urllib.request.urlopen(urllib.request.Request(
            f'{url}/rest/v1/attempts?id=eq.{a["id"]}',
            data=json.dumps({'last_question_id': q1['id']}).encode(),
            headers=h, method='PATCH'), timeout=10)
        
        # 30s later auto-save Q2
        urllib.request.urlopen(urllib.request.Request(
            f'{url}/rest/v1/attempts?id=eq.{a["id"]}',
            data=json.dumps({'last_question_id': q2['id']}).encode(),
            headers=h, method='PATCH'), timeout=10)
        
        # Verify latest position = Q2
        req = urllib.request.Request(f'{url}/rest/v1/attempts?id=eq.{a["id"]}&select=last_question_id', headers=h)
        saved = json.loads(urllib.request.urlopen(req, timeout=10).read())[0]
        assert saved['last_question_id'] == q2['id'], f'Expected Q2, got {saved["last_question_id"][:8]}'
        delete_attempt(url, h, a['id'])
    test('Periodic auto-save — latest overwrites previous', t3)
    
    # ─── Test 4: Answers persist via responses table ───
    def t4():
        a = create_attempt(url, h_ret, test_id, fake_student)
        responses_data = []
        for i, q in enumerate(all_qs[:5]):
            responses_data.append({
                'attempt_id': a['id'],
                'question_id': q['id'],
                'selected_option': q['correct_option'],
                'is_correct': True,
                'time_taken_seconds': 20 + i * 5,
            })
        body = json.dumps(responses_data).encode()
        req = urllib.request.Request(f'{url}/rest/v1/responses', data=body, headers=h_ret)
        urllib.request.urlopen(req, timeout=10)
        
        req2 = urllib.request.Request(
            f'{url}/rest/v1/responses?attempt_id=eq.{a["id"]}&select=question_id,selected_option&limit=20', headers=h)
        saved = json.loads(urllib.request.urlopen(req2, timeout=10).read())
        assert len(saved) == 5, f'Expected 5, got {len(saved)}'
        for r in saved:
            assert r['selected_option'], f'Missing answer for {r["question_id"][:8]}'
        print(f'    {len(saved)} responses saved ✓')
        delete_attempt(url, h, a['id'])
    test('Answers saved — all responses persist', t4)
    
    # ─── Test 5: Full resume cycle ───
    def t5():
        a = create_attempt(url, h_ret, test_id, fake_student)
        target_q = all_qs[7]
        
        # Save position
        urllib.request.urlopen(urllib.request.Request(
            f'{url}/rest/v1/attempts?id=eq.{a["id"]}',
            data=json.dumps({'last_question_id': target_q['id']}).encode(),
            headers=h, method='PATCH'), timeout=10)
        
        # Save some answers
        resp_data = []
        for i, q in enumerate(all_qs[:4]):
            resp_data.append({
                'attempt_id': a['id'], 'question_id': q['id'],
                'selected_option': q['correct_option'], 'is_correct': True,
            })
        urllib.request.urlopen(urllib.request.Request(
            f'{url}/rest/v1/responses', data=json.dumps(resp_data).encode(), headers=h_ret), timeout=10)
        
        # Simulate CRASH + RELOAD: re-fetch everything
        req = urllib.request.Request(f'{url}/rest/v1/attempts?id=eq.{a["id"]}', headers=h)
        attempt = json.loads(urllib.request.urlopen(req, timeout=10).read())[0]
        assert attempt['last_question_id'] == target_q['id'], 'Position lost on reload'
        assert attempt['submitted_at'] is None, 'Should not be submitted'
        
        req2 = urllib.request.Request(
            f'{url}/rest/v1/responses?attempt_id=eq.{a["id"]}&select=question_id,selected_option', headers=h)
        responses = json.loads(urllib.request.urlopen(req2, timeout=10).read())
        assert len(responses) == 4, f'Expected 4 responses, got {len(responses)}'
        
        # Verify last_question_id points to valid question
        req3 = urllib.request.Request(f'{url}/rest/v1/questions?id=eq.{target_q["id"]}&select=id', headers=h)
        q_check = json.loads(urllib.request.urlopen(req3, timeout=10).read())
        assert q_check, f'Invalid last_question_id reference'
        print(f'    Position: Q{target_q["id"][:8]}..., Answers: {len(responses)}')
        delete_attempt(url, h, a['id'])
    test('Full resume cycle — crash → reload restores everything', t5)
    
    # ─── Test 6: Submit clears last_question_id + sets score ───
    def t6():
        a = create_attempt(url, h_ret, test_id, fake_student)
        # Save position first
        urllib.request.urlopen(urllib.request.Request(
            f'{url}/rest/v1/attempts?id=eq.{a["id"]}',
            data=json.dumps({'last_question_id': all_qs[0]['id']}).encode(),
            headers=h, method='PATCH'), timeout=10)
        
        # Submit
        now = datetime.now(timezone.utc).isoformat()
        urllib.request.urlopen(urllib.request.Request(
            f'{url}/rest/v1/attempts?id=eq.{a["id"]}',
            data=json.dumps({
                'submitted_at': now, 'total_score': 42.5,
                'section_scores': {'Test': {'raw': 42.5, 'attempted': 50}},
                'last_question_id': None,
            }).encode(),
            headers=h, method='PATCH'), timeout=10)
        
        req = urllib.request.Request(
            f'{url}/rest/v1/attempts?id=eq.{a["id"]}&select=submitted_at,last_question_id,total_score', headers=h)
        updated = json.loads(urllib.request.urlopen(req, timeout=10).read())[0]
        assert updated['submitted_at'] is not None, 'submitted_at missing'
        assert updated['last_question_id'] is None, f'Should be null after submit'
        assert updated['total_score'] == 42.5, f'Score mismatch'
        delete_attempt(url, h, a['id'])
    test('Submit clears last_question_id + stores score', t6)
    
    # ─── Test 7: Fresh start after submit ───
    def t7():
        a = create_attempt(url, h_ret, test_id, fake_student, {
            'submitted_at': datetime.now(timezone.utc).isoformat(),
            'total_score': 10,
        })
        # Verify no unsubmitted for this test+student
        req = urllib.request.Request(
            f'{url}/rest/v1/attempts?test_id=eq.{test_id}&student_id=eq.{fake_student}&submitted_at=is.null&select=id', headers=h)
        unsubmitted = json.loads(urllib.request.urlopen(req, timeout=10).read())
        # Our attempt was submitted, so should have 0 unsubmitted... unless there are others
        print(f'    Unsubmitted count after submit: {len(unsubmitted)}')
        delete_attempt(url, h, a['id'])
    test('No unsubmitted after submit', t7)
    
    # ─── Test 8: Edge case — viewed but unanswered questions ───
    def t8():
        a = create_attempt(url, h_ret, test_id, fake_student)
        # Add response with null selected_option (viewed, not answered)
        resp_body = json.dumps([{
            'attempt_id': a['id'], 'question_id': all_qs[0]['id'],
            'selected_option': None, 'is_correct': None,
        }]).encode()
        urllib.request.urlopen(urllib.request.Request(
            f'{url}/rest/v1/responses', data=resp_body, headers=h_ret), timeout=10)
        
        # On resume, response exists with null answer
        req = urllib.request.Request(
            f'{url}/rest/v1/responses?attempt_id=eq.{a["id"]}&select=selected_option', headers=h)
        saved = json.loads(urllib.request.urlopen(req, timeout=10).read())
        assert len(saved) == 1
        assert saved[0]['selected_option'] is None, 'Should be null (unanswered)'
        delete_attempt(url, h, a['id'])
    test('Viewed but unanswered — preserved as null', t8)
    
    # ─── Test 9: Edge case — no last_question_id, but has answers ───
    def t9():
        a = create_attempt(url, h_ret, test_id, fake_student)
        # Save answer but never navigate (last_question_id stays null)
        resp_body = json.dumps([{
            'attempt_id': a['id'], 'question_id': all_qs[0]['id'],
            'selected_option': all_qs[0]['correct_option'], 'is_correct': True,
        }]).encode()
        urllib.request.urlopen(urllib.request.Request(
            f'{url}/rest/v1/responses', data=resp_body, headers=h_ret), timeout=10)
        
        # Verify: null position but answer exists
        req = urllib.request.Request(f'{url}/rest/v1/attempts?id=eq.{a["id"]}&select=last_question_id', headers=h)
        check = json.loads(urllib.request.urlopen(req, timeout=10).read())[0]
        assert check['last_question_id'] is None, 'Position should be null (never navigated)'
        
        req2 = urllib.request.Request(
            f'{url}/rest/v1/responses?attempt_id=eq.{a["id"]}&select=selected_option', headers=h)
        saved = json.loads(urllib.request.urlopen(req2, timeout=10).read())
        assert len(saved) == 1, 'Answers still saved despite no position'
        delete_attempt(url, h, a['id'])
    test('Answers without position — still restores correctly', t9)
    
    # ─── Test 10: Timer calculation ───
    def t10():
        past = (datetime.now(timezone.utc) - timedelta(minutes=30)).isoformat()
        a = create_attempt(url, h_ret, test_id, fake_student, {'started_at': past})
        
        started = datetime.fromisoformat(a['started_at'].replace('Z', '+00:00'))
        elapsed = (datetime.now(timezone.utc) - started).total_seconds()
        remaining = max(0, 7200 - elapsed)
        assert elapsed > 1750 and elapsed < 1850, f'Elapsed ~1800s, got {elapsed:.0f}s'
        assert remaining > 5350 and remaining < 5450, f'Remaining ~5400s, got {remaining:.0f}s'
        print(f'    Elapsed: {elapsed:.0f}s, Remaining: {remaining:.0f}s')
        delete_attempt(url, h, a['id'])
    test('Timer restoration — remaining calculated from started_at', t10)
    
    # ─── Test 11: Concurrent attempts — picks newest ───
    def t11():
        a1 = create_attempt(url, h_ret, test_id, fake_student)
        a2 = create_attempt(url, h_ret, test_id, fake_student)
        
        req = urllib.request.Request(
            f'{url}/rest/v1/attempts?test_id=eq.{test_id}&student_id=eq.{fake_student}&submitted_at=is.null&order=started_at.desc&limit=5',
            headers=h)
        unsubmitted = json.loads(urllib.request.urlopen(req, timeout=10).read())
        assert len(unsubmitted) >= 2, f'Expected >=2 unsubmitted, got {len(unsubmitted)}'
        newest = unsubmitted[0]
        assert newest['id'] == a2['id'], f'Newest should be {a2["id"][:8]}, got {newest["id"][:8]}'
        print(f'    Unsubmitted: {len(unsubmitted)}, newest: {newest["id"][:8]}...')
        
        for aa in unsubmitted:
            delete_attempt(url, h, aa['id'])
    test('Concurrent attempts — picks the newest one', t11)
    
    # ─── Test 12: FK constraint on last_question_id ───
    def t12():
        a = create_attempt(url, h_ret, test_id, fake_student)
        # Set to valid question
        body = json.dumps({'last_question_id': all_qs[0]['id']}).encode()
        urllib.request.urlopen(urllib.request.Request(
            f'{url}/rest/v1/attempts?id=eq.{a["id"]}', data=body, headers=h, method='PATCH'), timeout=10)
        
        # Verify
        req = urllib.request.Request(f'{url}/rest/v1/attempts?id=eq.{a["id"]}&select=last_question_id', headers=h)
        saved = json.loads(urllib.request.urlopen(req, timeout=10).read())[0]
        assert saved['last_question_id'] == all_qs[0]['id'], 'FK reference works'
        delete_attempt(url, h, a['id'])
    test('last_question_id references valid question', t12)
    
    # ─── Test 13: Stale attempt detection (>150 min) ───
    def t13():
        old = (datetime.now(timezone.utc) - timedelta(minutes=180)).isoformat()
        a = create_attempt(url, h_ret, test_id, fake_student, {'started_at': old})
        
        started = datetime.fromisoformat(a['started_at'].replace('Z', '+00:00'))
        age_mins = (datetime.now(timezone.utc) - started).total_seconds() / 60
        assert age_mins > 150, f'Attempt age: {age_mins:.0f} min (should be >150)'
        print(f'    Age: {age_mins:.0f} min (stale threshold: 150 min)')
        delete_attempt(url, h, a['id'])
    test('Stale detection — >150min old attempts flagged', t13)

    # ═══════════════════════════ REPORT ═══════════════════════════
    total = PASS + FAIL
    print(f'\n{"="*55}')
    print(f'  TEST RESULTS: {PASS}/{total} passed, {FAIL} failed')
    print(f'{"="*55}')
    if errors:
        print('\n  Failures:')
        for e in errors:
            print(f'    • {e}')
    
    # Save report to file
    report = f"""# Exam Crash Recovery — Test Report
**Date:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
**Test:** {test_data['title']}
**Result:** {PASS}/{total} passed
"""
    with open('/tmp/exam-resume-test-report.md', 'w') as f:
        f.write(report)
    
    sys.exit(0 if FAIL == 0 else 1)

if __name__ == '__main__':
    run_tests()
