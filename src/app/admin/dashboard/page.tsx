'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ tests: 0, students: 0, attempts: 0 });
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/auth/login'); return; }

      const { count: tests } = await supabase
        .from('tests')
        .select('*', { count: 'exact', head: true });

      const { count: students } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'student');

      const { count: attempts } = await supabase
        .from('attempts')
        .select('*', { count: 'exact', head: true })
        .not('submitted_at', 'is', null);

      setStats({
        tests: tests ?? 0,
        students: students ?? 0,
        attempts: attempts ?? 0,
      });
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <div className="flex gap-3">
          <Link
            href="/admin/tests"
            className="border px-4 py-2 rounded-lg text-sm hover:bg-gray-100 transition"
          >
            Manage Tests
          </Link>
          <Link
            href="/admin/students"
            className="border px-4 py-2 rounded-lg text-sm hover:bg-gray-100 transition"
          >
            Student Analytics
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
      <div className="grid grid-cols-3 gap-6 mb-8">
        {[
          { label: 'Total Tests', value: stats.tests, color: 'text-indigo-600' },
          { label: 'Students', value: stats.students, color: 'text-green-600' },
          { label: 'Completed Attempts', value: stats.attempts, color: 'text-blue-600' },
        ].map((s) => (
          <div key={s.label} className="bg-white border rounded-xl p-6 shadow-sm">
            <p className={`text-4xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-sm text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="bg-white border rounded-xl shadow-sm">
        <div className="px-6 py-4 border-b">
          <h2 className="font-semibold">Quick Actions</h2>
        </div>
        <div className="p-6 grid sm:grid-cols-2 gap-4">
          <Link
            href="/admin/tests"
            className="border-2 border-dashed border-indigo-200 rounded-xl p-6 text-center hover:bg-indigo-50 transition group"
          >
            <p className="text-lg font-semibold text-indigo-600 group-hover:text-indigo-700">
              + Create New Test
            </p>
            <p className="text-sm text-gray-500 mt-1">Generate with AI or manually</p>
          </Link>
          <Link
            href="/admin/students"
            className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:bg-gray-50 transition"
          >
            <p className="text-lg font-semibold text-gray-700">View Student Analytics</p>
            <p className="text-sm text-gray-500 mt-1">See performance across all tests</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
