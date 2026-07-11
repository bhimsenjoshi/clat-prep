'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { ExtendedProfile } from '@/types';
import ChangePassword from '@/components/ChangePassword';

const PLAN_BADGES: Record<string, { label: string; color: string; icon: string; features: string[] }> = {
  free: {
    label: 'Free',
    color: 'bg-elevated text-secondary border-theme',
    icon: '📚',
    features: ['10 free questions/day', 'All 5 sections', 'Instant feedback'],
  },
  premium: {
    label: 'Premium',
    color: 'bg-tint-amber text-amber-800 border-amber-300',
    icon: '⭐',
    features: ['Unlimited questions', 'All 5 sections', 'Instant feedback', 'Detailed analytics', 'Priority support'],
  },
  max: {
    label: 'Max',
    color: 'bg-tint-indigo text-indigo-800 border-indigo-300',
    icon: '👑',
    features: ['Everything in Premium', 'AI Mentor / Personal Tutor', 'Advanced analytics & insights', 'WhatsApp quiz bot access', 'Early access to new features'],
  },
};

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClient();
  const [profile, setProfile] = useState<ExtendedProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [upgradeMsg, setUpgradeMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/auth/login'); return; }

      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      setProfile(prof as ExtendedProfile);
      setLoading(false);
    };
    loadProfile();
  }, [router, supabase]);

  const handleUpgrade = async () => {
    setUpgrading(true);
    setUpgradeMsg(null);
    try {
      const res = await fetch('/api/subscription/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (!res.ok) {
        setUpgradeMsg({ type: 'error', text: data.message || data.error || 'Upgrade failed' });
      } else {
        setUpgradeMsg({ type: 'success', text: data.message || '🎉 Upgraded to Premium!' });
        // Refresh profile
        const { data: prof } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', profile?.id)
          .single();
        setProfile(prof as ExtendedProfile);
      }
    } catch {
      setUpgradeMsg({ type: 'error', text: 'Network error. Please try again.' });
    }
    setUpgrading(false);
  };

  if (loading) return (
    <div className="min-h-screen bg-page flex items-center justify-center">
      <div className="animate-pulse flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
        <p className="text-secondary text-sm">Loading profile...</p>
      </div>
    </div>
  );

  if (!profile) return null;

  const currentPlan = PLAN_BADGES[profile.subscription_plan] || PLAN_BADGES.free;
  const isFree = profile.subscription_plan === 'free';
  const memberSince = new Date(profile.created_at).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  // Check if the promo campaign is still active (ends July 31, 2026)
  const isCampaignActive = new Date() < new Date('2026-07-31T23:59:59+05:30');

  return (
    <div className="min-h-screen bg-page">
      {/* ─── Header ─── */}
      <header className="bg-card border-b border-theme shadow-theme-sm sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/student/dashboard" className="text-muted hover:text-secondary">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <span className="text-lg font-bold text-primary">My Profile</span>
          </div>
          <nav className="hidden md:flex items-center gap-2">
            <Link href="/student/dashboard" className="px-3 py-2 rounded-lg text-sm font-medium text-secondary hover:bg-elevated transition">
              📊 Dashboard
            </Link>
            <Link href="/student/practice" className="px-3 py-2 rounded-lg text-sm bg-accent text-white hover:bg-accent-hover transition shadow-sm">
              🎯 Practice
            </Link>
            <button onClick={() => supabase.auth.signOut().then(() => router.push('/'))}
              className="px-3 py-2 rounded-lg text-sm font-medium text-danger hover:bg-tint-danger active:scale-[0.97] transition-all duration-150 cursor-pointer">
              🚪 Sign Out
            </button>
          </nav>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 rounded-lg hover:bg-elevated transition">
            <svg className="w-5 h-5 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
            </svg>
          </button>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-theme-light bg-card px-4 py-3 space-y-1">
            <Link href="/student/dashboard" onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-secondary hover:bg-elevated">📊 Dashboard</Link>
            <Link href="/student/practice" onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm bg-accent/10 text-accent">🎯 Practice</Link>
            <hr className="my-1 border-theme-light" />
            <button onClick={() => { setMobileMenuOpen(false); supabase.auth.signOut().then(() => router.push('/')); }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-danger hover:bg-tint-danger w-full text-left cursor-pointer">🚪 Sign Out</button>
          </div>
        )}
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* ─── Profile Card ─── */}
        <div className="bg-card border border-theme rounded-xl shadow-theme-sm overflow-hidden">
          <div className="bg-gradient-accent px-6 py-8 text-white">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-3xl font-bold">
                {(profile.full_name || 'U')[0].toUpperCase()}
              </div>
              <div>
                <h1 className="text-xl font-bold">{profile.full_name || 'Student'}</h1>
                <p className="text-sm text-accent-subtle">Member since {memberSince}</p>
              </div>
            </div>
          </div>

          {/* Details grid */}
          <div className="px-6 py-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium text-muted uppercase tracking-wider mb-1">Email</p>
              <p className="text-sm text-primary">{profile.email || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted uppercase tracking-wider mb-1">Phone</p>
              <p className="text-sm text-primary">{profile.phone || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted uppercase tracking-wider mb-1">Role</p>
              <p className="text-sm text-primary capitalize">{profile.role}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted uppercase tracking-wider mb-1">Daily Questions Remaining</p>
              <p className="text-sm text-primary">
                {profile.subscription_plan === 'free' ? `${profile.daily_free_questions ?? 10}/10` : '♾️ Unlimited'}
              </p>
            </div>
            {profile.is_promo_user && (
              <div className="md:col-span-2">
                <p className="text-xs font-medium text-success uppercase tracking-wider mb-1">🎁 Promo Upgrade</p>
                <p className="text-sm text-success">
                  Claimed on {profile.promo_claimed_at
                    ? new Date(profile.promo_claimed_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                    : '—'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ─── Subscription Card ─── */}
        <div className={`bg-card border border-theme rounded-xl shadow-theme-sm overflow-hidden ${
          isFree && isCampaignActive ? 'border-warning ring-1 ring-warning/50' : 'border-theme'
        }`}>
          <div className="px-6 py-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-primary flex items-center gap-2">
                  <span>{currentPlan.icon}</span> {currentPlan.label} Plan
                </h2>
                {profile.is_promo_user && (
                  <p className="text-xs text-success mt-0.5">🎁 Promotional upgrade — free till campaign ends</p>
                )}
              </div>
              <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${currentPlan.color}`}>
                {currentPlan.label}
              </span>
            </div>

            {/* Features list */}
            <div className="space-y-2 mb-5">
              {currentPlan.features.map((f, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-secondary">
                  <span className="text-success">✓</span> {f}
                </div>
              ))}
              {isFree && (
                <>
                  <div className="flex items-center gap-2 text-sm text-muted">
                    <span className="text-muted">—</span> Detailed analytics
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted">
                    <span className="text-muted">—</span> AI Mentor / Personal Tutor
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted">
                    <span className="text-muted">—</span> WhatsApp bot access
                  </div>
                </>
              )}
            </div>

            {/* Upgrade options */}
            {isFree && (
              <div className="border-t border-theme-light pt-5 space-y-4">
                {/* Upgrade message */}
                {upgradeMsg && (
                  <div className={`p-4 rounded-xl text-sm ${
                    upgradeMsg.type === 'success' ? 'bg-success/10 border border-success/50 text-success' :
                    upgradeMsg.type === 'error' ? 'bg-danger/10 border border-danger/50 text-danger' :
                    'bg-info/10 border border-info/50 text-info'
                  }`}>
                    {upgradeMsg.text}
                  </div>
                )}

                {/* Campaign: Free Premium upgrade */}
                {isCampaignActive && (
                  <div className="bg-tint-warning border border-warning/50 rounded-xl p-5">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">🎁</span>
                      <div className="flex-1">
                        <h3 className="font-bold text-warning">Free Premium Upgrade — Limited Time!</h3>
                        <p className="text-sm text-secondary mt-1">
                          Get <strong>Premium</strong> access for <strong>free</strong> — no payment needed! 
                          Offer valid till <strong>July 31, 2026</strong> for the first <strong>20 users</strong>.
                        </p>
                        <ul className="text-xs text-muted mt-2 space-y-1">
                          <li>✓ Unlimited practice questions</li>
                          <li>✓ Detailed analytics & insights</li>
                          <li>✓ No daily limits</li>
                        </ul>
                        <button
                          onClick={handleUpgrade}
                          disabled={upgrading}
                          className="mt-4 w-full py-3 rounded-xl font-bold bg-gradient-accent text-white hover:bg-accent-hover transition disabled:opacity-50 shadow-sm"
                        >
                          {upgrading ? '⏳ Upgrading...' : '⭐ Claim Free Premium Upgrade'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {!isCampaignActive && (
                  <div className="bg-tint-info border border-info/50 rounded-xl p-5">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">ℹ️</span>
                      <div className="flex-1">
                        <h3 className="font-bold text-info">Campaign Ended</h3>
                        <p className="text-sm text-secondary mt-1">
                          The free Premium upgrade campaign ended on July 31, 2026. 
                          Stay tuned for future offers or upgrade to a paid plan!
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Max plan teaser */}
                <div className="bg-tint-info border border-info/50 rounded-xl p-5">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">👑</span>
                    <div className="flex-1">
                      <h3 className="font-bold text-info">Max Plan — Coming Soon</h3>
                      <p className="text-sm text-secondary mt-1">
                        Everything in Premium plus <strong>AI Mentor / Personal Tutor</strong>, advanced analytics, 
                        and WhatsApp quiz bot access.
                      </p>
                      <p className="text-xs text-muted mt-2">Stay tuned for launch details!</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Show what's next for Premium users */}
            {profile.subscription_plan === 'premium' && (
              <div className="border-t border-theme-light pt-5">
                <div className="bg-tint-info border border-info/50 rounded-xl p-5">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">👑</span>
                    <div className="flex-1">
                      <h3 className="font-bold text-info">Max Plan — Coming Soon</h3>
                      <p className="text-sm text-secondary mt-1">
                        Upgrade to <strong>Max</strong> for AI Mentor / Personal Tutor, advanced analytics, 
                        and WhatsApp bot access.
                      </p>
                      <p className="text-xs text-muted mt-2">You'll get early access when it launches!</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Max users - already at top */}
            {profile.subscription_plan === 'max' && (
              <div className="border-t border-theme-light pt-5">
                <div className="bg-tint-success border border-success/50 rounded-xl p-5">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">👑</span>
                    <div className="flex-1">
                      <h3 className="font-bold text-success">You're on Max — the ultimate plan!</h3>
                      <p className="text-sm text-secondary mt-1">
                        You have access to everything: unlimited questions, AI Mentor, WhatsApp bot, advanced analytics, and early access to all new features.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ─── Change Password ─── */}
        <ChangePassword />

        {/* ─── Privacy Note ─── */}
        <div className="text-center text-xs text-muted py-4">
          🔒 Your data is protected in accordance with DPDP (Digital Personal Data Protection) guidelines.
          We collect only the information needed to provide and improve our services.
          <Link href="#" className="text-accent hover:underline ml-1">Privacy Policy</Link>
        </div>
      </main>
    </div>
  );
}
