'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Profile, Attempt, Test } from '@/types';

export default function StudentDashboard() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [recentTests, setRecentTests] = useState<
    (Attempt & { test_title: string })[]
  >([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const loadDashboard = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/auth/login'); return; }

      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      setProfile(prof);

      const { data: attempts } = await supabase
        .from('attempts')
        .select('*, tests(title)')
        .eq('student_id', user.id)
        .order('started_at', { ascending: false })
        .limit(5);

      if (attempts) {
        setRecentTests(
          (attempts as any[]).map((a) => ({
            ...a,
            test_title: a.tests?.title ?? 'Unknown',
          }))
        );
      }

      setLoading(false);
    };
    loadDashboard();
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;

  // Calculate stats
  const completed = recentTests.filter((a) => a.submitted_at);
  const avgScore = completed.length
    ? Math.round(
        completed.reduce((s, a) => s + (a.total_score ?? 0), 0) / completed.length
      )
    : 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Student Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">
            Welcome{profile?.full_name ? `, ${profile.full_name}` : ''}
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/student/tests"
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
          >
            Available Tests
          </Link>
          <button
            onClick={() => supabase.auth.signOut().then(() => router.push('/'))}
            className="border px-4 py-2 rounded-lg text-sm hover:bg-gray-100 transition"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Tests Taken', value: completed.length },
          { label: 'Avg Score', value: `${avgScore}%` },
          { label: 'Best Score', value: completed.length ? `${Math.max(...completed.map(a => a.total_score ?? 0))}%` : '-' },
        ].map((s) => (
          <div key={s.label} className="bg-white border rounded-xl p-5 shadow-sm">
            <p className="text-3xl font-bold text-indigo-600">{s.value}</p>
            <p className="text-sm text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Recent attempts */}
      <div className="bg-white border rounded-xl shadow-sm">
        <div className="px-6 py-4 border-b">
          <h2 className="font-semibold">Recent Attempts</h2>
        </div>
        {recentTests.length === 0 ? (
          <div className="p-6 text-center text-gray-400">
            <p className="mb-3">No test attempts yet.</p>
            <Link href="/student/tests" className="text-indigo-600 hover:underline text-sm">
              Take your first test →
            </Link>
          </div>
        ) : (
          <div className="divide-y">
            {recentTests.map((a) => (
              <div key={a.id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{a.test_title}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(a.started_at).toLocaleDateString('en-IN')}
                  </p>
                </div>
                <div className="text-right">
                  {a.submitted_at ? (
                    <span className="text-green-600 font-semibold">
                      {a.total_score}%
                    </span>
                  ) : (
                    <Link
                      href={`/student/tests/${a.test_id}`}
                      className="text-indigo-600 text-sm font-medium hover:underline"
                    >
                      Resume →
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
