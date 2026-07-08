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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-indigo-950 to-gray-900">
      <div className="animate-pulse flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400 text-sm">Loading quiz hub...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-950 to-gray-900">
      {/* Header */}
      <div className="bg-gray-800/50 border-b border-gray-700/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎯</span>
            <div>
              <h1 className="text-xl font-bold text-white">Practice Quizzes</h1>
              <p className="text-xs text-gray-400">
                {userName ? `Ready, ${userName}?` : 'Pick a section to start'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className={`text-xs px-3 py-1.5 rounded-full font-medium ${
              dailyRemaining === 'unlimited'
                ? 'bg-purple-900/50 text-purple-300 border border-purple-700/50'
                : dailyRemaining > 0
                  ? 'bg-green-900/50 text-green-300 border border-green-700/50'
                  : 'bg-red-900/50 text-red-300 border border-red-700/50'
            }`}>
              {dailyRemaining === 'unlimited' ? '♾️ Unlimited' : `📅 ${dailyRemaining} free today`}
            </div>
            <Link href="/student/dashboard"
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-700 text-gray-300 hover:bg-gray-600 transition">
              ← Dashboard
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Prompt */}
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-white mb-2">Choose Your Section</h2>
          <p className="text-gray-400 max-w-lg mx-auto">
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
              className={`group relative overflow-hidden rounded-xl p-6 text-left transition-all duration-200 ${
                dailyRemaining !== 'unlimited' && dailyRemaining <= 0
                  ? 'opacity-40 cursor-not-allowed'
                  : 'hover:scale-[1.02] hover:shadow-xl hover:shadow-indigo-500/10 cursor-pointer'
              }`}
              style={{
                background: `linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))`,
                borderImage: `linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.02)) 1`,
              }}
            >
              {/* Gradient accent top */}
              <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${section.color}`} />

              <div className="relative z-10">
                <span className="text-3xl mb-3 block">{section.icon}</span>
                <h3 className="text-lg font-bold text-white mb-1">{section.name}</h3>
                <p className="text-sm text-gray-400 mb-4">{section.desc}</p>

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
          <p className="text-xs text-gray-500">
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
