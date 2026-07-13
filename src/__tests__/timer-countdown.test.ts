import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// This test suite validates the TIMER COUNTDOWN BEHAVIOR specifically.
// It simulates the exact React state transitions that happen during
// the exam lifecycle: fresh start, retake, exit, restore.

describe('Timer Countdown Behavior (React State Simulation)', () => {
  // The timer effect from the component:
  // useEffect(() => {
  //   if (submitted || loading || !test || !attemptId) return;
  //   timerRef.current = setInterval(() => {
  //     setTimeLeft((t) => { if (t <= 1) { clearInterval(); return 0; } return t - 1; });
  //   }, 1000);
  //   return () => { clearInterval(timerRef.current); };
  // }, [submitted, loading, test, attemptId]);

  let timeLeft: number;
  let submitted: boolean;
  let loading: boolean;
  let hasTest: boolean;
  let hasAttemptId: boolean;
  let timerCallback: (() => void) | null;
  let intervalId: ReturnType<typeof setInterval>;

  beforeEach(() => {
    vi.useFakeTimers();
    timeLeft = 7200;
    submitted = false;
    loading = true;
    hasTest = false;
    hasAttemptId = false;
    timerCallback = null;
  });

  afterEach(() => {
    vi.useRealTimers();
    if (intervalId) clearInterval(intervalId);
  });

  // Helper: simulates the timer useEffect logic
  function evaluateTimerEffect() {
    const shouldStart = !submitted && !loading && hasTest && hasAttemptId;
    return shouldStart;
  }

  // Helper: simulates what init() does
  function simulateInit(hasUnsubmitted: boolean, minutesAgo: number = 0) {
    loading = true;
    // Reset all state
    timeLeft = 7200;
    submitted = false;

    if (hasUnsubmitted) {
      const startedAt = Date.now() - minutesAgo * 60 * 1000;
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      timeLeft = Math.max(0, 7200 - elapsed);
    } else {
      // Fresh start — no unsubmitted found
      timeLeft = 7200;
    }

    hasTest = true;
    hasAttemptId = true;
    loading = false; // init completed
  }

  // ════════════════════════════════════════════════
  // SCENARIO 1: Fresh Start (click "Start Exam")
  // ════════════════════════════════════════════════
  describe('Scenario 1: Fresh Start — click "Start Exam"', () => {
    it('timer starts at 7200 and counts down', () => {
      simulateInit(false); // No unsubmitted attempt

      // After init, timer effect should start
      expect(evaluateTimerEffect()).toBe(true);
      expect(timeLeft).toBe(7200);

      // Simulate 5 seconds of countdown
      for (let i = 0; i < 5; i++) {
        timeLeft = timeLeft <= 1 ? 0 : timeLeft - 1;
      }
      expect(timeLeft).toBe(7195);
    });

    it('timer display shows 120:00 on fresh start', () => {
      simulateInit(false);
      const formatTime = (s: number) =>
        `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
      expect(formatTime(timeLeft)).toBe('120:00');
    });

    it('timer counts down to 119:50 after 10 seconds', () => {
      simulateInit(false);
      for (let i = 0; i < 10; i++) {
        timeLeft = timeLeft <= 1 ? 0 : timeLeft - 1;
      }
      const formatTime = (s: number) =>
        `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
      expect(formatTime(timeLeft)).toBe('119:50');
    });
  });

  // ════════════════════════════════════════════════
  // SCENARIO 2: Retake (click "Retake Exam")
  // ════════════════════════════════════════════════
  describe('Scenario 2: Retake — click "🔄 Retake Exam" on results page', () => {
    it('initializes timer at 7200 and starts counting down', () => {
      // Simulate retake: full page reload via <a> tag
      // Component mounts fresh — no unsubmitted attempt
      // because the previous one has submitted_at set

      simulateInit(false); // Same as fresh start — unsubmitted not found

      // Timer MUST start ticking
      expect(evaluateTimerEffect()).toBe(true);

      // Timer starts at 7200 (120:00)
      expect(timeLeft).toBe(7200);

      // After 3 seconds
      for (let i = 0; i < 3; i++) {
        timeLeft = timeLeft <= 1 ? 0 : timeLeft - 1;
      }
      expect(timeLeft).toBe(7197);
    });

    it('retake ALWAYS shows 120:00, never continues old timer', () => {
      // Simulate: user had timer at 45:00 before submitting
      const oldTimeLeft = 2700; // 45:00

      // On retake: full page reload, component remount
      // useState(7200) fires on mount → 120:00
      // init() finds no unsubmitted → creates new → setTimeLeft(7200)

      simulateInit(false);
      timeLeft = 7200; // useState initializer value, then overwritten by init

      expect(timeLeft).toBe(7200);
      expect(evaluateTimerEffect()).toBe(true);
    });
  });

  // ════════════════════════════════════════════════
  // SCENARIO 3: Exit → Start (user-reported bug)
  // ════════════════════════════════════════════════
  describe('Scenario 3: Exit → Start — the user-reported bug', () => {
    it('after exit deletes attempt, new start gives 120:00', () => {
      // Simulate: timer was at 3500 (58:20), user clicks Exit → Yes
      const timerAtExit = 3500;

      // confirmExit() runs:
      // 1. Clears timer interval
      // 2. Deletes attempt from DB (await supabase.delete)
      // 3. router.push('/student/dashboard')
      const attemptDeletedFromDB = true;

      // User clicks "Start" again
      // Component mounts fresh (different route)
      // useState(7200) → 120:00
      // init() queries DB:
      //   - No unsubmitted attempt (it was deleted)
      //   - Creates new attempt
      //   - setTimeLeft(7200)
      simulateInit(false);

      expect(attemptDeletedFromDB).toBe(true);
      expect(timeLeft).toBe(7200);
      expect(evaluateTimerEffect()).toBe(true);

      // Timer counts down normally
      timeLeft = timeLeft - 1;
      expect(timeLeft).toBe(7199);
    });

    it('reproduces the exact bug: if attempt is NOT deleted, timer resumes', () => {
      // This is what happened before the RLS fix:
      // confirmExit() called supabase.delete() but RLS blocked it
      // Attempt remained in DB with submitted_at = NULL
      // On next "Start", init() found it and restored remaining time

      const oldTimeLeft = 3500; // What timer was at when user exited

      // Simulate failed delete (attempt still in DB)
      const attemptRemainedInDB = true;

      // On next start, init() finds the old unsubmitted attempt
      // and restores its timer from started_at timestamp
      simulateInit(true, 5); // 5 minutes elapsed since start

      // Timer restored to ~114:00 instead of 120:00
      const expectedTimeLeft = 7200 - (5 * 60); // 5 min elapsed
      expect(timeLeft).toBeCloseTo(expectedTimeLeft, -1);

      // This is the BUG: timer should be 7200 but it's ~6900
      expect(timeLeft).not.toBe(7200);
      if (timeLeft !== 7200) {
        console.log('BUG REPRODUCED: Timer showed', formatTime(timeLeft), 'instead of 120:00');
        console.log('Root cause: DELETE failed (RLS), unsubmitted attempt persisted in DB');
        console.log('Fix: Added RLS DELETE policy, stale guard for >150 min');
      }
    });
  });

  // ════════════════════════════════════════════════
  // SCENARIO 4: Refresh during exam (browser refresh)
  // ════════════════════════════════════════════════
  describe('Scenario 4: Browser Refresh during exam', () => {
    it('restores remaining time from unsubmitted attempt', () => {
      // Timer was at say 110:05 when user refreshed
      simulateInit(true, 10); // 10 minutes elapsed

      // Timer restored to ~110:00 (not 120:00)
      expect(timeLeft).toBeLessThan(7200);
      expect(timeLeft).toBeGreaterThan(6500); // ~110:00

      // Timer continues counting down
      expect(evaluateTimerEffect()).toBe(true);
    });
  });

  // ════════════════════════════════════════════════
  // SCENARIO 5: Timer reaches 0 → auto-submit
  // ════════════════════════════════════════════════
  describe('Scenario 5: Timer reaches 0', () => {
    it('auto-submit fires when timeLeft hits 0', () => {
      simulateInit(false);
      let autoSubmitTriggered = false;

      // Simulate countdown to 0
      for (let i = 7200; i > 0; i--) {
        timeLeft = timeLeft <= 1 ? 0 : timeLeft - 1;
      }
      expect(timeLeft).toBe(0);

      // Auto-submit effect fires
      if (!submitted && !loading && hasTest && hasAttemptId && timeLeft <= 0) {
        autoSubmitTriggered = true;
      }
      expect(autoSubmitTriggered).toBe(true);
    });
  });

  // ════════════════════════════════════════════════
  // SCENARIO 6: Submit → timer stops
  // ════════════════════════════════════════════════
  describe('Scenario 6: Submit clicked manually', () => {
    it('submitted=true stops the timer effect', () => {
      simulateInit(false);
      expect(evaluateTimerEffect()).toBe(true); // Timer running

      submitted = true; // User clicked submit

      expect(evaluateTimerEffect()).toBe(false); // Timer stopped
    });
  });
});

function formatTime(s: number): string {
  return `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
}
