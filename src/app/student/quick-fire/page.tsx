'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PageHeader from '@/components/PageHeader';

const SECTIONS = [
  { id: 'English Language', label: 'English Language', icon: '📖', color: 'indigo' },
  { id: 'Current Affairs Including General Knowledge', label: 'Current Affairs Including General Knowledge', icon: '📰', color: 'emerald' },
  { id: 'Legal Reasoning', label: 'Legal Reasoning', icon: '⚖️', color: 'amber' },
  { id: 'Logical Reasoning', label: 'Logical Reasoning', icon: '🧠', color: 'purple' },
  { id: 'Quantitative Techniques', label: 'Quantitative Techniques', icon: '📐', color: 'rose' },
] as const;

export default function QuickFireLanding() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [dailyRemaining, setDailyRemaining] = useState<number | 'unlimited'>(10);

  useEffect(() => {
    fetch('/api/me').then(r => { if (!r.ok) router.push('/auth/login'); });
    // Fetch daily limit
    fetch('/api/quiz/quickfire/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ section: 'English Language' }),
    }).then(async (r) => {
      if (r.status === 403) { setDailyRemaining(0); return; }
      const data = await r.json();
      if (data.daily_remaining !== undefined) setDailyRemaining(data.daily_remaining);
    }).catch(() => {});
  }, [router]);

  const startQuiz = (sectionId: string) => {
    setLoading(sectionId);
    router.push(`/student/quick-fire/${sectionId.toLowerCase().replace(/\s+/g, '-')}`);
  };

  return (
    <div className="min-h-screen bg-page text-primary">
      <PageHeader title="Quick Fire" navItems={[
        { href: '/student/dashboard', label: 'Dashboard', icon: '🏛️' },
        { href: '/student/practice', label: 'Practice', icon: '📚' },
      ]} />
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="flex items-start gap-4 mb-8">
          <span className="text-4xl">⚡</span>
          <div>
            <h1 className="text-2xl font-bold text-heading">Quick Fire</h1>
            <p className="text-secondary text-sm mt-1 leading-relaxed">
              Rapid-fire standalone questions — no passages to read, just pure knowledge recall.
              Perfect for quick practice sessions and last-minute revision.
            </p>
            <p className="text-xs text-muted mt-2">
              10 questions per round · No passages · Instant answers
              {typeof dailyRemaining === 'number' && (
                <span className="ml-2 text-accent">({dailyRemaining} free questions today)</span>
              )}
            </p>
          </div>
        </div>

        {/* Daily limit reached */}
        {dailyRemaining === 0 && (
          <div className="mb-6 bg-amber-900/30 border border-warning/50 rounded-xl p-4">
            <p className="text-sm text-warning font-medium">😅 Daily limit reached</p>
            <p className="text-xs text-secondary mt-1">Come back tomorrow or upgrade to Premium for unlimited Quick Fire!</p>
          </div>
        )}

        {/* Section cards */}
        <div className="grid gap-3">
          {SECTIONS.map(s => (
            <button
              key={s.id}
              onClick={() => startQuiz(s.id)}
              disabled={loading !== null || dailyRemaining === 0}
              className="flex items-center gap-4 p-4 rounded-xl border border-theme bg-card hover:border-accent hover:bg-card-hover transition disabled:opacity-50 text-left"
            >
              <span className="text-2xl">{s.icon}</span>
              <div className="flex-1">
                <p className="font-medium text-primary">{s.label}</p>
                <p className="text-xs text-secondary">Standalone questions — {s.label === 'Quantitative Techniques' ? '0 available' : '44–50 available'}</p>
              </div>
              {loading === s.id ? (
                <span className="ml-auto animate-spin w-5 h-5 border-2 border-accent border-t-transparent rounded-full" />
              ) : (
                <span className="ml-auto text-secondary text-sm">Start →</span>
              )}
            </button>
          ))}
        </div>

        <Link href="/student/dashboard" className="block text-center text-sm text-muted mt-8 hover:text-primary transition">
          ← Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
