'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import PageHeader from '@/components/PageHeader';

interface Test {
  id: string;
  title: string;
  published_at: string | null;
  created_at: string;
}

interface Attempt {
  test_id: string;
  submitted_at: string | null;
}

export default function StudentTestsPage() {
  const supabase = createClient();
  const [tests, setTests] = useState<Test[] | null>(null);
  const [attemptedMap, setAttemptedMap] = useState<Map<string, boolean>>(new Map());
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    async function fetchData() {
      const { data: testsData } = await supabase
        .from('tests')
        .select('id, title, published_at, created_at')
        .eq('status', 'published')
        .order('published_at', { ascending: false, nullsFirst: false });

      setTests(testsData);

      const { data: { user: authUser } } = await supabase.auth.getUser();
      setUser(authUser);

      if (authUser) {
        const { data: attemptsData } = await supabase
          .from('attempts')
          .select('test_id, submitted_at')
          .eq('student_id', authUser.id);

        const map = new Map<string, boolean>(
          (attemptsData ?? []).map((a: Attempt) => [a.test_id, a.submitted_at !== null])
        );
        setAttemptedMap(map);
      }
    }

    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-page">
      <PageHeader
        title="Exams"
        navItems={[{ href: '/student/dashboard', label: 'Dashboard', icon: '🏛️' }]}
      />

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-primary">Practice Exams</h1>
            <p className="text-sm text-secondary mt-1">
              Select an exam to begin. Each test covers all 5 CLAT sections with 120-minute timer.
            </p>
          </div>
          <Link href="/student/dashboard" className="text-accent hover:underline text-sm">← Dashboard</Link>
        </div>

      {!tests || tests.length === 0 ? (
        <div className="bg-card border border-theme rounded-xl p-10 text-center text-muted">
          <p>No tests available yet. Check back soon!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tests.map((test) => {
            const isAttempted = attemptedMap.get(test.id);
            return (
              <div
                key={test.id}
                className="bg-card border border-theme rounded-xl px-6 py-5 flex items-center justify-between shadow-theme-sm"
              >
                <div>
                  <h3 className="font-semibold text-primary">{test.title}</h3>
                  <p className="text-xs text-secondary mt-0.5">
                    Published{' '}
                    {test.published_at
                      ? new Date(test.published_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })
                      : '—'}
                  </p>
                </div>
                {isAttempted === true ? (
                  <div className="flex items-center gap-2 flex-wrap justify-end">
                    <Link href={`/student/exams/${test.id}`}
                      className="bg-amber-500 text-white px-4 py-2 rounded-lg text-xs font-medium hover:bg-amber-600 transition">🔄 Retake</Link>
                    <Link href="/student/dashboard"
                      className="border border-theme px-4 py-2 rounded-lg text-xs font-medium text-secondary hover:bg-elevated transition">Exit</Link>
                  </div>
                ) : isAttempted === false ? (
                  <Link href={`/student/exams/${test.id}`}
                    className="bg-accent text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-accent-hover transition">Start Exam</Link>
                ) : (
                  <Link
                    href={`/student/exams/${test.id}`}
                    className="bg-accent text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-accent-hover transition"
                  >
                    Start Exam
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      )}
      </div>
    </div>
  );
}
