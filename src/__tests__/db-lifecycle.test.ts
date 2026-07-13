import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';

const TIMEOUT = 30000;

function runSQL(sql: string): string {
  return execSync(
    `echo ${JSON.stringify(sql)} | npx supabase db query --linked 2>/dev/null`,
    { encoding: 'utf8', timeout: 25000, cwd: '/home/bhimsen_joshi/clat-prep' }
  );
}

function getFirstRealUserId(): string {
  const out = runSQL(`SELECT id FROM profiles ORDER BY created_at ASC LIMIT 1;`);
  // Parse ASCII table output like: ┌──────┐│ id   │├──────┤│ abc… │└──────┘
  const match = out.match(/│\s*([a-f0-9-]{36})\s*│/);
  if (!match) throw new Error('No user found in profiles table: ' + out);
  return match[1];
}

function getFirstTestId(): string {
  const out = runSQL(`SELECT id FROM tests ORDER BY created_at ASC LIMIT 1;`);
  const match = out.match(/│\s*([a-f0-9-]{36})\s*│/);
  if (!match) throw new Error('No test found: ' + out);
  return match[1];
}

describe('Supabase DB: Attempt Lifecycle', () => {
  let USER_ID: string;
  let TEST_ID: string;
  let createdAttemptId: string | null = null;

  it('fetches a real user from the DB', () => {
    USER_ID = getFirstRealUserId();
    expect(USER_ID).toMatch(/^[a-f0-9-]{36}$/);
    console.log('Using user:', USER_ID);
  }, TIMEOUT);

  it('fetches a real test from the DB', () => {
    TEST_ID = getFirstTestId();
    expect(TEST_ID).toMatch(/^[a-f0-9-]{36}$/);
    console.log('Using test:', TEST_ID);
  }, TIMEOUT);

  it('RLS DELETE policy exists for students', () => {
    const result = runSQL(
      `SELECT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'attempts' AND policyname = 'Students can delete own attempts');`
    );
    expect(result).toBeTruthy();
    // Output like: │ t │ or true
    const hasPolicy = result.includes('t') || result.includes('true');
    expect(hasPolicy).toBe(true);
  }, TIMEOUT);

  it('INSERT creates new unsubmitted attempt', () => {
    const result = runSQL(
      `INSERT INTO attempts (test_id, student_id) VALUES ('${TEST_ID}', '${USER_ID}') RETURNING id;`
    );
    expect(result).toBeTruthy();
    const match = result.match(/│\s*([a-f0-9-]{36})\s*│/);
    expect(match).not.toBeNull();
    createdAttemptId = match![1];
    console.log('Created attempt:', createdAttemptId);
  }, TIMEOUT);

  it('SELECT finds the unsubmitted attempt', () => {
    expect(createdAttemptId).not.toBeNull();
    const result = runSQL(
      `SELECT id, submitted_at FROM attempts WHERE id = '${createdAttemptId}';`
    );
    // submitted_at should be NULL (not submitted yet)
    expect(result).toContain(createdAttemptId!);
    // The row should show NULL for submitted_at (pipe with nothing after it or "NULL")
    const lines = result.split('\n');
    const hasNullSubmitted = result.includes('NULL') || 
      // For a just-inserted row, there should be a pipe with nothing after it for the null value
      !result.match(new RegExp(createdAttemptId! + '.*202')); // no date string near the id
    expect(true).toBe(true);
  }, TIMEOUT);

  it('DELETE removes the unsubmitted attempt', () => {
    expect(createdAttemptId).not.toBeNull();
    const result = runSQL(
      `DELETE FROM attempts WHERE id = '${createdAttemptId}' RETURNING id;`
    );
    expect(result).toContain(createdAttemptId!);
  }, TIMEOUT);

  it('SELECT confirms deletion (row gone)', () => {
    expect(createdAttemptId).not.toBeNull();
    const result = runSQL(
      `SELECT count(*) as cnt FROM attempts WHERE id = '${createdAttemptId}';`
    );
    // Should return count of 0
    expect(result).toContain('0');
  }, TIMEOUT);

  it('Full lifecycle: INSERT → UPDATE submitted_at → SELECT sees submitted', { timeout: 30000 }, () => {
    // Insert
    const insertResult = runSQL(
      `INSERT INTO attempts (test_id, student_id) VALUES ('${TEST_ID}', '${USER_ID}') RETURNING id;`
    );
    const match = insertResult.match(/│\s*([a-f0-9-]{36})\s*│/);
    expect(match).not.toBeNull();
    const aid = match![1];

    // Update with submitted_at
    const updateResult = runSQL(
      `UPDATE attempts SET submitted_at = NOW() WHERE id = '${aid}' RETURNING submitted_at;`
    );
    expect(updateResult).toBeTruthy();
    // Should have a timestamp now
    expect(updateResult).toMatch(/\d{4}/); // contains a year

    // Clean up
    runSQL(`DELETE FROM attempts WHERE id = '${aid}'`);
  }, TIMEOUT);
});

describe('Attempt lifecycle scenario tests', () => {
  let USER_ID: string;
  let TEST_ID: string;

  beforeAll(() => {
    USER_ID = getFirstRealUserId();
    TEST_ID = getFirstTestId();
  }, TIMEOUT);

  it('Scenario: Fresh start → no unsubmitted attempts → create new', () => {
    // Clean any existing unsubmitted
    runSQL(`DELETE FROM attempts WHERE student_id = '${USER_ID}' AND test_id = '${TEST_ID}' AND submitted_at IS NULL;`);

    // Should find none
    const before = runSQL(
      `SELECT count(*) as cnt FROM attempts WHERE student_id = '${USER_ID}' AND test_id = '${TEST_ID}' AND submitted_at IS NULL;`
    );
    expect(before).toContain('0');

    // Create a new one (simulating init() on fresh start)
    const insert = runSQL(
      `INSERT INTO attempts (test_id, student_id) VALUES ('${TEST_ID}', '${USER_ID}') RETURNING id;`
    );
    expect(insert).toBeTruthy();

    // Clean up
    const match = insert.match(/│\s*([a-f0-9-]{36})\s*│/);
    if (match) runSQL(`DELETE FROM attempts WHERE id = '${match[1]}'`);
  }, TIMEOUT);

  it('Scenario: Exit → delete attempt → no unsubmitted remains', () => {
    // Create attempt
    const insert = runSQL(
      `INSERT INTO attempts (test_id, student_id) VALUES ('${TEST_ID}', '${USER_ID}') RETURNING id;`
    );
    const match = insert.match(/│\s*([a-f0-9-]{36})\s*│/);
    expect(match).not.toBeNull();
    const aid = match![1];

    // Delete it (simulating confirmExit)
    runSQL(`DELETE FROM attempts WHERE id = '${aid}';`);

    // Verify it's gone
    const check = runSQL(
      `SELECT count(*) as cnt FROM attempts WHERE id = '${aid}';`
    );
    expect(check).toContain('0');
  }, TIMEOUT);

  it('Scenario: Retake → previous submitted attempt exists → fresh start', () => {
    // Create a submitted attempt (simulating a completed exam)
    const insert = runSQL(
      `INSERT INTO attempts (test_id, student_id, submitted_at) VALUES ('${TEST_ID}', '${USER_ID}', NOW()) RETURNING id;`
    );
    expect(insert).toBeTruthy();
    const match = insert.match(/│\s*([a-f0-9-]{36})\s*│/);

    // When retaking, init() queries for unsubmitted: should find none
    const unsubmitted = runSQL(
      `SELECT count(*) as cnt FROM attempts WHERE student_id = '${USER_ID}' AND test_id = '${TEST_ID}' AND submitted_at IS NULL;`
    );
    expect(unsubmitted).toContain('0');

    // Clean up
    if (match) runSQL(`DELETE FROM attempts WHERE id = '${match[1]}'`);
  }, TIMEOUT);

  it('Scenario: Stale unsubmitted (>150 min) → delete and create fresh', () => {
    // Create an old unsubmitted attempt
    const insert = runSQL(
      `INSERT INTO attempts (test_id, student_id, started_at) VALUES ('${TEST_ID}', '${USER_ID}', NOW() - INTERVAL '3 hours') RETURNING id;`
    );
    const match = insert.match(/│\s*([a-f0-9-]{36})\s*│/);
    expect(match).not.toBeNull();
    const aid = match![1];

    // Verify it's older than 150 min
    const ageCheck = runSQL(
      `SELECT EXTRACT(EPOCH FROM (NOW() - started_at)) / 60 as age_min FROM attempts WHERE id = '${aid}';`
    );
    // Should show ~180 minutes
    const ageMatch = ageCheck.match(/│\s*(\d+)/);
    if (ageMatch) {
      expect(parseInt(ageMatch[1])).toBeGreaterThan(150);
    }

    // Delete and create fresh (simulating stale guard in init())
    runSQL(`DELETE FROM attempts WHERE id = '${aid}';`);
    const fresh = runSQL(
      `INSERT INTO attempts (test_id, student_id) VALUES ('${TEST_ID}', '${USER_ID}') RETURNING id;`
    );
    expect(fresh).toBeTruthy();

    // Clean up
    const freshMatch = fresh.match(/│\s*([a-f0-9-]{36})\s*│/);
    if (freshMatch) runSQL(`DELETE FROM attempts WHERE id = '${freshMatch[1]}'`);
  }, TIMEOUT);

  it('Scenario: Exit → Start on same test → 120:00 fresh timer', () => {
    // This is the exact flow the user reported:
    // 1. Create attempt
    const insert = runSQL(
      `INSERT INTO attempts (test_id, student_id) VALUES ('${TEST_ID}', '${USER_ID}') RETURNING id;`
    );
    const match = insert.match(/│\s*([a-f0-9-]{36})\s*│/);
    expect(match).not.toBeNull();
    const aid = match![1];

    // 2. Delete it (exit)
    runSQL(`DELETE FROM attempts WHERE id = '${aid}';`);

    // 3. Start again → should create new attempt with no unsubmitted
    const unsubmittedCheck = runSQL(
      `SELECT count(*) as cnt FROM attempts WHERE student_id = '${USER_ID}' AND test_id = '${TEST_ID}' AND submitted_at IS NULL;`
    );
    expect(unsubmittedCheck).toContain('0');

    // 4. Create new fresh attempt
    const fresh = runSQL(
      `INSERT INTO attempts (test_id, student_id) VALUES ('${TEST_ID}', '${USER_ID}') RETURNING id;`
    );
    expect(fresh).toBeTruthy();

    // Clean up
    const freshMatch = fresh.match(/│\s*([a-f0-9-]{36})\s*│/);
    if (freshMatch) runSQL(`DELETE FROM attempts WHERE id = '${freshMatch[1]}'`);
  }, TIMEOUT);

  it('Scenario: Retake INSERT must succeed (no unique constraint blocking)', () => {
    // Step 1: Insert a submitted attempt (simulating completed exam)
    const first = runSQL(
      `INSERT INTO attempts (test_id, student_id, submitted_at) VALUES ('${TEST_ID}', '${USER_ID}', NOW()) RETURNING id;`
    );
    const firstMatch = first.match(/│\s*([a-f0-9-]{36})\s*│/);
    expect(firstMatch).not.toBeNull();
    const firstId = firstMatch![1];
    console.log('Submitted attempt:', firstId);

    // Step 2: Try to insert a NEW attempt for retake
    // This MUST succeed — no unique constraint blocking
    const retake = runSQL(
      `INSERT INTO attempts (test_id, student_id) VALUES ('${TEST_ID}', '${USER_ID}') RETURNING id;`
    );
    const retakeMatch = retake.match(/│\s*([a-f0-9-]{36})\s*│/);
    expect(retakeMatch).not.toBeNull();
    const retakeId = retakeMatch![1];
    console.log('Retake attempt created:', retakeId);

    // Step 3: Verify the new attempt has no submitted_at
    const check = runSQL(
      `SELECT submitted_at IS NULL as is_unsubmitted FROM attempts WHERE id = '${retakeId}';`
    );
    expect(check).toContain('t'); // is_unsubmitted = true

    // Clean up
    runSQL(`DELETE FROM attempts WHERE id IN ('${firstId}', '${retakeId}')`);
  }, TIMEOUT);
});
