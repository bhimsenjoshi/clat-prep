'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import ChangePassword from '@/components/ChangePassword';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ tests: 0, users: 0, attempts: 0 });
  const [loading, setLoading] = useState(true);
  const [recentStudents, setRecentStudents] = useState<any[]>([]);
  const [generating, setGenerating] = useState(false);
  const [genResult, setGenResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [showChangePassword, setShowChangePassword] = useState(false);
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

  if (loading) return <div className="p-8 text-center text-secondary">Loading...</div>;

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
    <div className="min-h-screen bg-page text-primary">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-primary">Admin Dashboard</h1>
          <div className="flex gap-3">
            <Link href="/admin/tests" className="border border-theme px-4 py-2 rounded-lg text-sm bg-card-hover text-primary hover:bg-elevated transition">Manage Exams</Link>
            <Link href="/admin/students" className="border border-theme px-4 py-2 rounded-lg text-sm bg-card-hover text-primary hover:bg-elevated transition">Manage Users & Analytics</Link>
            <button onClick={() => setShowChangePassword(!showChangePassword)}
              className="border border-theme px-4 py-2 rounded-lg text-sm bg-card-hover text-primary hover:bg-elevated transition">
              🔑 Change Password
            </button>
            <button onClick={() => supabase.auth.signOut().then(() => router.push('/'))} 
              className="border border-theme px-4 py-2 rounded-lg text-sm bg-card-hover text-danger hover:bg-tint-danger transition cursor-pointer">
              🚪 Sign Out
            </button>
          </div>
        </div>

        {/* Clickable stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link href="/admin/tests" className="bg-card border border-theme rounded-xl p-6 shadow-theme-sm hover:shadow-theme-md transition block">
            <p className="text-4xl font-bold text-stat-indigo">{stats.tests}</p>
            <p className="text-sm text-secondary mt-1">Total Exams</p>
            <p className="text-xs text-stat-indigo mt-2">Click to manage exams →</p>
          </Link>
          <Link href="/admin/students" className="bg-card border border-theme rounded-xl p-6 shadow-theme-sm hover:shadow-theme-md transition block">
            <p className="text-4xl font-bold text-stat-green">{stats.users}</p>
            <p className="text-sm text-secondary mt-1">Total Users</p>
            <p className="text-xs text-stat-green mt-2">Manage Users & Analytics →</p>
          </Link>
          <Link href="/admin/students" className="bg-card border border-theme rounded-xl p-6 shadow-theme-sm hover:shadow-theme-md transition block">
            <p className="text-4xl font-bold text-stat-blue">{stats.attempts}</p>
            <p className="text-sm text-secondary mt-1">Completed Attempts</p>
            <p className="text-xs text-stat-blue mt-2">Manage Users & Analytics →</p>
          </Link>
        </div>

        {/* Recent sign-ups */}
        {recentStudents.length > 0 && (
          <div className="bg-card border border-theme rounded-xl shadow-theme-sm mb-8">
            <div className="px-6 py-4 border-b border-theme flex justify-between items-center">
              <h2 className="font-semibold text-primary">Recent Sign-ups</h2>
              <Link href="/admin/students" className="text-xs text-accent hover:underline">View all</Link>
            </div>
            <div className="divide-y divide-theme">
              {recentStudents.map((s: any, i: number) => (
                <div key={i} className="px-6 py-3 flex items-center justify-between text-sm hover:bg-elevated transition">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-primary">{s.full_name || '—'}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${s.role === 'admin' ? 'bg-tint-info text-info' : 'bg-tint-accent text-accent'}`}>
                      {s.role}
                    </span>
                  </div>
                  <span className="text-xs text-muted">{new Date(s.created_at).toLocaleDateString('en-IN')}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick actions */}
        <div className="bg-card border border-theme rounded-xl shadow-theme-sm">
          <div className="px-6 py-4 border-b border-theme"><h2 className="font-semibold text-primary">Quick Actions</h2></div>
          <div className="p-6 grid sm:grid-cols-2 gap-4">
            <Link href="/admin/tests" className="border-2 border-dashed border-accent-subtle rounded-xl p-6 text-center hover:bg-tint-indigo transition group">
              <p className="text-lg font-semibold text-accent group-hover:text-accent">+ Create New Exam</p>
              <p className="text-sm text-secondary mt-1">Generate with AI or manually</p>
            </Link>
            <button onClick={handleGenerateDaily} disabled={generating}
              className="border-2 border-dashed border-success/50 rounded-xl p-6 text-center hover:bg-tint-success transition group disabled:opacity-50 disabled:cursor-not-allowed">
              <p className="text-lg font-semibold text-success">{generating ? '⏳ Generating...' : '📅 Generate Daily Questions'}</p>
              <p className="text-sm text-secondary mt-1">25 new questions (5 per section) via DeepSeek</p>
              {genResult && (
                <p className={`text-xs mt-2 ${genResult.ok ? 'text-success' : 'text-danger'}`}>{genResult.msg}</p>
              )}
            </button>
            <Link href="/admin/students" className="border-2 border-dashed border-theme rounded-xl p-6 text-center hover:bg-elevated transition">
              <p className="text-lg font-semibold text-primary">Manage Users & Analytics</p>
              <p className="text-sm text-secondary mt-1">Promote, delete, and view student performance</p>
            </Link>
          </div>
        </div>

        {/* ─── Change Password ─── */}
        {showChangePassword && (
          <div className="mt-6">
            <ChangePassword compact onSuccess={() => setShowChangePassword(false)} />
          </div>
        )}
      </div>
    </div>
  );
}
