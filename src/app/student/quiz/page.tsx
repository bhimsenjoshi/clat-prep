'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { SectionName } from '@/types';

const SECTIONS: { name: SectionName; icon: string; desc: string; color: string }[] = [
  {
    name: 'English',
    icon: '📖',
    desc: 'Reading comprehension, grammar, vocabulary',
    color: 'from-blue-500 to-blue-600',
  },
  {
    name: 'Current Affairs',
    icon: '📰',
    desc: 'General knowledge, static GK, current events',
    color: 'from-emerald-500 to-emerald-600',
  },
  {
    name: 'Legal Reasoning',
    icon: '⚖️',
    desc: 'Legal principles, case laws, propositions',
    color: 'from-purple-500 to-purple-600',
  },
  {
    name: 'Logical Reasoning',
    icon: '🧠',
    desc: 'Critical thinking, syllogisms, puzzles',
    color: 'from-amber-500 to-amber-600',
  },
  {
    name: 'Quantitative Techniques',
    icon: '📐',
    desc: 'Data interpretation, percentages, algebra',
    color: 'from-rose-500 to-rose-600',
  },
];

export default function QuizHub() {
  const [userName, setUserName] = useState('');
  const [dailyRemaining, setDailyRemaining] = useState<number | 'unlimited'>(10);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/auth/login'); return; }

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, daily_free_questions, subscription_plan')
        .eq('id', user.id)
        .single();

      if (profile) {
        setUserName(profile.full_name);
        setDailyRemaining(
          profile.subscription_plan === 'premium' ? 'unlimited' : (profile.daily_free_questions ?? 10)
        );
      }
      setLoading(false);
    };
    load();
  }, []);

  const startQuiz = async (section: SectionName) => {
    router.push(`/student/quiz/${section.toLowerCase().replace(/\s+/g, '-')}`);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-page">
      <div className="animate-pulse flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
        <p className="text-secondary text-sm">Loading quiz hub...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-page">
      {/* Header */}
      <div className="border-b border-theme bg-card-hover backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎯</span>
            <div>
              <h1 className="text-xl font-bold text-primary">Practice Quizzes</h1>
              <p className="text-secondary">
                {userName ? `Ready, ${userName}?` : 'Pick a section to start'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className={`text-xs px-3 py-1.5 rounded-full font-medium ${
              dailyRemaining === 'unlimited'
                ? 'bg-info/20 text-info border border-info/50'
                : dailyRemaining > 0
                  ? 'bg-success/20 text-success border border-success/50'
                  : 'bg-danger/20 text-danger border border-danger/50'
            }`}>
              {dailyRemaining === 'unlimited' ? '♾️ Unlimited' : `📅 ${dailyRemaining} free today`}
            </div>
            <Link href="/student/dashboard"
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-card text-secondary hover:bg-card-hover transition">
              ← Dashboard
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Prompt */}
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-heading mb-2">Choose Your Section</h2>
          <p className="text-secondary max-w-lg mx-auto">
            Pick a CLAT section and get non-stop practice questions with instant feedback and explanations.
          </p>
        </div>

        {/* Section Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {SECTIONS.map((section) => (
            <button
              key={section.name}
              onClick={() => startQuiz(section.name)}
              disabled={dailyRemaining !== 'unlimited' && dailyRemaining <= 0}
              className={`group relative overflow-hidden rounded-xl p-6 text-left transition-all duration-200 bg-card border border-theme ${
                dailyRemaining !== 'unlimited' && dailyRemaining <= 0
                  ? 'opacity-40 cursor-not-allowed'
                  : 'hover:scale-[1.02] hover:shadow-xl hover:shadow-accent/10 cursor-pointer hover:border-accent'
              }`}
            >
              {/* Gradient accent top */}
              <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${section.color}`} />

              <div className="relative z-10">
                <span className="text-3xl mb-3 block">{section.icon}</span>
                <h3 className="text-lg font-bold text-primary mb-1">{section.name}</h3>
                <p className="text-sm text-secondary mb-4">{section.desc}</p>

                <div className="flex items-center gap-2 text-xs font-medium">
                  <span className={`bg-gradient-to-r ${section.color} text-white px-3 py-1 rounded-full`}>
                    Start Practice →
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Daily limit info */}
        <div className="mt-10 text-center">
          <p className="text-xs text-muted">
            {dailyRemaining === 'unlimited'
              ? '✨ Premium plan — unlimited practice questions'
              : `📅 ${dailyRemaining} free questions remaining today. Upgrade for unlimited!`
            }
          </p>
        </div>
      </div>
    </div>
  );
}
