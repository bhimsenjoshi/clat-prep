'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { ExtendedProfile } from '@/types';
import ChangePassword from '@/components/ChangePassword';
import PageHeader from '@/components/PageHeader';

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
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // ─── Editable fields ───
  const [editUsername, setEditUsername] = useState('');
  const [editSchool, setEditSchool] = useState('');
  const [editClatYear, setEditClatYear] = useState(2027);
  const [editing, setEditing] = useState<'username' | 'school' | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<{ valid: boolean; available: boolean; error: string | null } | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  let debounceTimer: NodeJS.Timeout;

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
      setAvatarUrl((prof as any)?.avatar_url ?? null);
      setEditUsername(((prof as any)?.username || '').replace('@', ''));
      setEditSchool((prof as any)?.school || '');
      setEditClatYear((prof as any)?.clat_year || 2027);
      setLoading(false);
    };
    loadProfile();
  }, [router, supabase]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    if (file.size > 2 * 1024 * 1024) {
      setUpgradeMsg({ type: 'error', text: 'Image too large. Max 2MB.' });
      return;
    }
    setUploading(true);
    setUpgradeMsg(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const ext = file.name.split('.').pop();
      const filePath = `${user.id}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Store URL in profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl } as any)
        .eq('id', user.id);
      if (updateError) throw updateError;

      setAvatarUrl(publicUrl);
      setUpgradeMsg({ type: 'success', text: '✅ Profile picture updated!' });
    } catch (err: any) {
      setUpgradeMsg({ type: 'error', text: err.message || 'Upload failed' });
    }
    setUploading(false);
  };

  // ─── Username availability check ───
  const checkUsername = useCallback(async (val: string) => {
    if (val.length < 3) { setUsernameStatus(null); return; }
    setCheckingUsername(true);
    try {
      const res = await fetch(`/api/username/check?username=${encodeURIComponent(val)}`);
      const data = await res.json();
      setUsernameStatus(data);
    } catch {
      setUsernameStatus({ valid: false, available: false, error: 'Check failed' });
    } finally {
      setCheckingUsername(false);
    }
  }, []);

  const handleUsernameChange = (val: string) => {
    const cleaned = val.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
    setEditUsername(cleaned);
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => checkUsername(cleaned), 300);
  };

  const saveUsername = async () => {
    if (!usernameStatus?.valid || !usernameStatus?.available) return;
    setSavingEdit(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSavingEdit(false); return; }
    const { error } = await supabase
      .from('profiles')
      .update({ username: '@' + editUsername } as any)
      .eq('id', user.id);
    if (!error) {
      setEditing(null);
      setUpgradeMsg({ type: 'success', text: '✅ Username updated!' });
    }
    setSavingEdit(false);
  };

  const saveSchoolYear = async () => {
    setSavingEdit(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSavingEdit(false); return; }
    const { error } = await supabase
      .from('profiles')
      .update({ school: editSchool, clat_year: editClatYear } as any)
      .eq('id', user.id);
    if (!error) {
      setEditing(null);
      setUpgradeMsg({ type: 'success', text: '✅ Profile updated!' });
    }
    setSavingEdit(false);
  };

  // Rest of the handlers
  const handleUpgrade = async () => {
    setUpgrading(true);
    setUpgradeMsg(null);
    try {
      const res = await fetch('/api/subscription/upgrade', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setUpgradeMsg({ type: 'error', text: data.message || data.error || 'Upgrade failed' });
      } else {
        setUpgradeMsg({ type: 'success', text: data.message || '🎉 Upgraded to Premium!' });
        const { data: prof } = await supabase.from('profiles').select('*').eq('id', profile?.id).single();
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
  const memberSince = new Date(profile.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  const isCampaignActive = new Date() < new Date('2026-07-31T23:59:59+05:30');

  const initials = (profile.full_name || '?').split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="min-h-screen bg-page">
      <PageHeader title="My Profile" navItems={[{href:'/student/dashboard',label:'Dashboard',icon:'🏛️'},{href:'/student/practice',label:'Practice',icon:'📋'}]} />

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* ─── Profile Card ─── */}
        <div className="bg-card border border-theme rounded-xl shadow-theme-sm overflow-hidden">
          <div className="bg-gradient-accent px-6 py-8 text-white">
            <div className="flex items-center gap-4">
              {/* Avatar with upload */}
              <div className="relative group">
                <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center overflow-hidden">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl font-bold">{initials[0]}</span>
                  )}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition text-white text-xs font-medium cursor-pointer"
                >
                  {uploading ? '⏳' : '📷'}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
              </div>
              <div>
                <h1 className="text-xl font-bold">{profile.full_name || 'Student'}</h1>
                <p className="text-sm text-white/70">Member since {memberSince}</p>
              </div>
            </div>
          </div>

          {/* Details grid */}
          <div className="px-6 py-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Username */}
            <div>
              <p className="text-xs font-medium text-muted uppercase tracking-wider mb-1">Username</p>
              {editing === 'username' ? (
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-muted shrink-0">@</span>
                    <input
                      type="text"
                      value={editUsername}
                      onChange={(e) => handleUsernameChange(e.target.value)}
                      className="flex-1 bg-elevated border border-theme text-primary rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-accent"
                      placeholder="cool_clater"
                      autoFocus
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px]">
                      {checkingUsername ? <span className="text-muted">⏳</span>
                        : usernameStatus?.available && usernameStatus?.valid
                          ? <span className="text-green-400">✅ Available</span>
                          : usernameStatus && !usernameStatus?.available
                            ? <span className="text-red-400">❌ {usernameStatus.error || 'Taken'}</span>
                            : null}
                    </span>
                    <button onClick={saveUsername} disabled={!usernameStatus?.available || savingEdit}
                      className="text-[10px] font-medium px-2 py-1 rounded bg-accent text-white disabled:opacity-40">
                      Save
                    </button>
                    <button onClick={() => { setEditing(null); setUsernameStatus(null); setEditUsername(((profile as any)?.username || '').replace('@', '')); }}
                      className="text-[10px] text-muted hover:text-secondary">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <p className="text-sm text-primary">{(profile as any)?.username || '—'}</p>
                  <button onClick={() => setEditing('username')} className="text-[10px] text-accent hover:text-accent/70">Edit</button>
                </div>
              )}
            </div>
            {/* School */}
            <div>
              <p className="text-xs font-medium text-muted uppercase tracking-wider mb-1">School / College</p>
              {editing === 'school' ? (
                <div className="flex flex-col gap-1.5">
                  <input
                    type="text"
                    value={editSchool}
                    onChange={(e) => setEditSchool(e.target.value)}
                    className="bg-elevated border border-theme text-primary rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-accent"
                    placeholder="Your school/college"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button onClick={saveSchoolYear} disabled={savingEdit}
                      className="text-[10px] font-medium px-2 py-1 rounded bg-accent text-white disabled:opacity-40">
                      Save
                    </button>
                    <button onClick={() => { setEditing(null); setEditSchool((profile as any)?.school || ''); }}
                      className="text-[10px] text-muted hover:text-secondary">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <p className="text-sm text-primary">{(profile as any)?.school || '—'}</p>
                  <button onClick={() => setEditing('school')} className="text-[10px] text-accent hover:text-accent/70">Edit</button>
                </div>
              )}
            </div>
            {/* CLAT Year */}
            <div>
              <p className="text-xs font-medium text-muted uppercase tracking-wider mb-1">CLAT Year</p>
              {editing === 'school' ? (
                <select
                  value={editClatYear}
                  onChange={(e) => setEditClatYear(Number(e.target.value))}
                  className="bg-elevated border border-theme text-primary rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value={2027}>2027</option>
                  <option value={2028}>2028</option>
                  <option value={2029}>2029</option>
                </select>
              ) : (
                <p className="text-sm text-primary">{(profile as any)?.clat_year || '—'}</p>
              )}
            </div>
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

        {/* ─── Change Password ─── */}
        <ChangePassword />

        {/* Upload message */}
        {upgradeMsg && (
          <div className={`p-4 rounded-xl text-sm ${
            upgradeMsg.type === 'success' ? 'bg-success/10 border border-success/50 text-success' :
            upgradeMsg.type === 'error' ? 'bg-danger/10 border border-danger/50 text-danger' :
            'bg-info/10 border border-info/50 text-info'
          }`}>
            {upgradeMsg.text}
          </div>
        )}

        {/* ─── Subscription Card ─── */}
        <div className={`bg-card border border-theme rounded-xl shadow-theme-sm overflow-hidden ${
          isFree && isCampaignActive ? 'border-warning ring-1 ring-warning/50' : 'border-theme'
        }`}>
          <div className="px-6 py-5">
            {/* Subscription content — unchanged */}

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

            {isFree && (
              <div className="border-t border-theme-light pt-5 space-y-4">
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
                        <button onClick={handleUpgrade} disabled={upgrading}
                          className="mt-4 w-full py-3 rounded-xl font-bold bg-gradient-accent text-white hover:bg-accent-hover transition disabled:opacity-50 shadow-sm">
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
                        <p className="text-sm text-secondary mt-1">The free Premium upgrade campaign ended on July 31, 2026. Stay tuned for future offers!</p>
                      </div>
                    </div>
                  </div>
                )}
                <div className="bg-tint-info border border-info/50 rounded-xl p-5">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">👑</span>
                    <div className="flex-1">
                      <h3 className="font-bold text-info">Max Plan — Coming Soon</h3>
                      <p className="text-sm text-secondary mt-1">Everything in Premium plus <strong>AI Mentor</strong>, advanced analytics, and WhatsApp bot access.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {profile.subscription_plan === 'premium' && (
              <div className="border-t border-theme-light pt-5">
                <div className="bg-tint-info border border-info/50 rounded-xl p-5">
                  <h3 className="font-bold text-info">👑 Max Plan — Coming Soon</h3>
                  <p className="text-sm text-secondary mt-1">Upgrade to <strong>Max</strong> for AI Mentor, advanced analytics, and WhatsApp bot access.</p>
                </div>
              </div>
            )}
            {profile.subscription_plan === 'max' && (
              <div className="border-t border-theme-light pt-5">
                <div className="bg-tint-success border border-success/50 rounded-xl p-5">
                  <h3 className="font-bold text-success">👑 You're on Max — the ultimate plan!</h3>
                  <p className="text-sm text-secondary mt-1">You have access to everything: unlimited questions, AI Mentor, WhatsApp bot, advanced analytics, and early access.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ─── Privacy Note ─── */}
        <div className="text-center text-xs text-muted py-4">
          🔒 Your data is protected in accordance with DPDP guidelines.
          <Link href="#" className="text-accent hover:underline ml-1">Privacy Policy</Link>
        </div>
      </main>
    </div>
  );
}
