'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ tests: 0, users: 0, attempts: 0 });
  const [loading, setLoading] = useState(true);
  const [recentStudents, setRecentStudents] = useState<any[]>([]);
  const [generating, setGenerating] = useState(false);
  const [genResult, setGenResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/auth/login'); return; }

      const { count: tests } = await supabase
        .from('tests')
        .select('*', { count: 'exact', head: true });

      const { count: users } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      const { count: attempts } = await supabase
        .from('attempts')
        .select('*', { count: 'exact', head: true })
        .not('submitted_at', 'is', null);

      setStats({
        tests: tests ?? 0,
        users: users ?? 0,
        attempts: attempts ?? 0,
      });

      // Recent sign-ups
      const { data: recent } = await supabase
        .from('profiles')
        .select('full_name, role, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      setRecentStudents(recent ?? []);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;

  const handleGenerateDaily = async () => {
    setGenerating(true);
    setGenResult(null);
    try {
      const res = await fetch('/api/admin/generate-daily', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setGenResult({ ok: true, msg: data.message || `✅ ${data.total_generated} questions generated!` });
      } else {
        setGenResult({ ok: false, msg: data.error || 'Failed to generate' });
      }
    } catch {
      setGenResult({ ok: false, msg: 'Network error' });
    }
    setGenerating(false);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <div className="flex gap-3">
          <Link href="/admin/tests" className="border px-4 py-2 rounded-lg text-sm hover:bg-gray-100 transition">Manage Tests</Link>
          <Link href="/admin/students" className="border px-4 py-2 rounded-lg text-sm hover:bg-gray-100 transition">Student Analytics</Link>
          <button onClick={() => supabase.auth.signOut().then(() => router.push('/'))} className="border px-4 py-2 rounded-lg text-sm hover:bg-gray-100 transition">Sign Out</button>
        </div>
      </div>

      {/* Clickable stats cards */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        <Link href="/admin/tests" className="bg-white border rounded-xl p-6 shadow-sm hover:shadow-md transition block">
          <p className="text-4xl font-bold text-indigo-600">{stats.tests}</p>
          <p className="text-sm text-gray-500 mt-1">Total Tests</p>
          <p className="text-xs text-indigo-500 mt-2">Click to manage →</p>
        </Link>
        <Link href="/admin/students" className="bg-white border rounded-xl p-6 shadow-sm hover:shadow-md transition block">
          <p className="text-4xl font-bold text-green-600">{stats.users}</p>
          <p className="text-sm text-gray-500 mt-1">Total Users</p>
          <p className="text-xs text-green-500 mt-2">Click to view analytics →</p>
        </Link>
        <Link href="/admin/students" className="bg-white border rounded-xl p-6 shadow-sm hover:shadow-md transition block">
          <p className="text-4xl font-bold text-blue-600">{stats.attempts}</p>
          <p className="text-sm text-gray-500 mt-1">Completed Attempts</p>
          <p className="text-xs text-blue-500 mt-2">Click to view →</p>
        </Link>
      </div>

      {/* Recent sign-ups */}
      {recentStudents.length > 0 && (
        <div className="bg-white border rounded-xl shadow-sm mb-8">
          <div className="px-6 py-4 border-b flex justify-between items-center">
            <h2 className="font-semibold">Recent Sign-ups</h2>
            <Link href="/admin/students" className="text-xs text-indigo-600 hover:underline">View all</Link>
          </div>
          <div className="divide-y">
            {recentStudents.map((s: any, i: number) => (
              <div key={i} className="px-6 py-3 flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{s.full_name || '—'}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${s.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                    {s.role}
                  </span>
                </div>
                <span className="text-xs text-gray-400">{new Date(s.created_at).toLocaleDateString('en-IN')}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="bg-white border rounded-xl shadow-sm">
        <div className="px-6 py-4 border-b"><h2 className="font-semibold">Quick Actions</h2></div>
        <div className="p-6 grid sm:grid-cols-2 gap-4">
          <Link href="/admin/tests" className="border-2 border-dashed border-indigo-200 rounded-xl p-6 text-center hover:bg-indigo-50 transition group">
            <p className="text-lg font-semibold text-indigo-600 group-hover:text-indigo-700">+ Create New Test</p>
            <p className="text-sm text-gray-500 mt-1">Generate with AI or manually</p>
          </Link>
          <button onClick={handleGenerateDaily} disabled={generating}
            className="border-2 border-dashed border-emerald-200 rounded-xl p-6 text-center hover:bg-emerald-50 transition group disabled:opacity-50 disabled:cursor-not-allowed">
            <p className="text-lg font-semibold text-emerald-600">{generating ? '⏳ Generating...' : '📅 Generate Daily Questions'}</p>
            <p className="text-sm text-gray-500 mt-1">25 new questions (5 per section) via DeepSeek</p>
            {genResult && (
              <p className={`text-xs mt-2 ${genResult.ok ? 'text-emerald-600' : 'text-red-500'}`}>{genResult.msg}</p>
            )}
          </button>
          <Link href="/admin/students" className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:bg-gray-50 transition">
            <p className="text-lg font-semibold text-gray-700">View Student Analytics</p>
            <p className="text-sm text-gray-500 mt-1">See performance across all tests</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
