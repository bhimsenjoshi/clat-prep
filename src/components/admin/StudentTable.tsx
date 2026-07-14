'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Student {
  id: string;
  full_name: string | null;
  email: string;
  role: 'admin' | 'student';
  subscription_plan: 'free' | 'premium' | 'max';
  testsTaken: number;
  avgScore: number;
  bestScore: number;
  is_promo_user?: boolean;
  created_at: string;
}

export default function StudentTable({ initialStudents }: { initialStudents: Student[] }) {
  const [students, setStudents] = useState<Student[]>(initialStudents);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handlePlanChange = async (studentId: string, newPlan: 'free' | 'premium' | 'max') => {
    setLoadingId(studentId);
    try {
      const res = await fetch('/api/admin/user/update-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: studentId, new_plan: newPlan }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to update plan');
        return;
      }

      // Update state local list
      setStudents(prev =>
        prev.map(s => (s.id === studentId ? { ...s, subscription_plan: newPlan } : s))
      );
    } catch (err) {
      console.error(err);
      alert('An unexpected error occurred.');
    } finally {
      setLoadingId(null);
    }
  };

  const handleDelete = async (student: Student) => {
    if (student.role === 'admin') {
      alert('You cannot delete an admin user!');
      return;
    }

    const confirmDel = confirm(
      `⚠️ WARNING: Are you absolutely sure you want to permanently delete the account of "${
        student.full_name || student.email
      }"?\n\nThis will delete their auth login, profile, and all practice data. A notification email will be sent to them.`
    );
    if (!confirmDel) return;

    setLoadingId(student.id);
    try {
      const res = await fetch('/api/admin/user/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: student.id }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to delete user');
        return;
      }

      // Remove from local list
      setStudents(prev => prev.filter(s => s.id !== student.id));
      alert('User successfully deleted!');
    } catch (err) {
      console.error(err);
      alert('An unexpected error occurred.');
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="bg-card border border-theme shadow-theme-sm rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-theme flex justify-between items-center">
        <h2 className="font-semibold text-primary">All Registered Users ({students.length})</h2>
      </div>

      {students.length === 0 ? (
        <div className="p-6 text-center text-muted">No users registered.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-elevated text-secondary">
              <tr>
                <th className="text-left px-6 py-3 font-medium text-primary">Name / Email</th>
                <th className="text-left px-6 py-3 font-medium text-primary">User ID</th>
                <th className="text-center px-4 py-3 font-medium text-primary">Role</th>
                <th className="text-center px-4 py-3 font-medium text-primary font-semibold">Tiers & Subscription</th>
                <th className="text-center px-4 py-3 font-medium text-primary">Tests</th>
                <th className="text-center px-4 py-3 font-medium text-primary">Avg</th>
                <th className="text-center px-4 py-3 font-medium text-primary">Best</th>
                <th className="text-center px-6 py-3 font-medium text-primary">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-theme">
              {students.map((s) => (
                <tr key={s.id} className="hover:bg-elevated transition-colors">
                  <td className="px-6 py-3">
                    <div className="font-medium text-primary">{s.full_name || '—'}</div>
                    <div className="text-xs text-muted mt-0.5">
                      {new Date(s.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </td>
                  <td className="px-6 py-3">
                    <code className="text-[10px] text-muted font-mono">{s.id.slice(0, 8)}</code>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase ${
                        s.role === 'admin'
                          ? 'bg-tint-info text-info border border-info/30'
                          : 'bg-elevated text-secondary border border-theme'
                      }`}
                    >
                      {s.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {s.role === 'admin' ? (
                      <span className="text-xs text-muted">—</span>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 justify-center">
                        <select
                          value={s.subscription_plan}
                          disabled={loadingId === s.id}
                          onChange={(e) =>
                            handlePlanChange(s.id, e.target.value as 'free' | 'premium' | 'max')
                          }
                          className="bg-card border border-theme text-primary rounded px-2.5 py-1 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none disabled:opacity-50"
                        >
                          <option value="free">Free Tier</option>
                          <option value="premium">Premium</option>
                          <option value="max">MAX Plan</option>
                        </select>
                        {s.is_promo_user && (
                          <span className="text-[9px] font-bold text-emerald-400 bg-tint-green px-1.5 py-0.5 rounded uppercase">
                            Promo
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center text-primary font-medium">{s.testsTaken}</td>
                  <td
                    className={`px-4 py-3 text-center font-medium ${
                      s.testsTaken > 0
                        ? s.avgScore >= 70
                          ? 'text-success'
                          : s.avgScore >= 40
                          ? 'text-warning'
                          : 'text-danger'
                        : 'text-muted'
                    }`}
                  >
                    {s.testsTaken > 0 ? `${s.avgScore}%` : '—'}
                  </td>
                  <td className="px-4 py-3 text-center font-medium text-accent">
                    {s.testsTaken > 0 ? `${s.bestScore}%` : '—'}
                  </td>
                  <td className="px-6 py-3 text-center">
                    {s.role === 'admin' ? (
                      <span className="text-xs text-muted">—</span>
                    ) : (
                      <button
                        onClick={() => handleDelete(s)}
                        disabled={loadingId === s.id}
                        className="text-xs font-semibold px-2.5 py-1 rounded bg-tint-red text-red-500 hover:bg-red-900/20 active:scale-95 transition disabled:opacity-40"
                      >
                        Delete User
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
