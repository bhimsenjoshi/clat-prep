'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SetupPage() {
  const router = useRouter();
  const supabase = createClient();
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [school, setSchool] = useState('');
  const [clatYear, setClatYear] = useState(2027);
  const [checking, setChecking] = useState(false);
  const [availability, setAvailability] = useState<{ valid: boolean; available: boolean; error: string | null } | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/auth/login'); return; }

      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (prof) {
        setFullName(prof.full_name || '');
        setSchool(prof.school || '');
        setClatYear(prof.clat_year || 2027);
      }
    })();
  }, []);

  // Debounced username check
  const checkUsername = useCallback(async (val: string) => {
    if (val.length < 3) {
      setAvailability(null);
      return;
    }
    setChecking(true);
    try {
      const res = await fetch(`/api/username/check?username=${encodeURIComponent(val)}`);
      const data = await res.json();
      setAvailability(data);
    } catch {
      setAvailability({ valid: false, available: false, error: 'Could not check availability' });
    } finally {
      setChecking(false);
    }
  }, []);

  const debounceTimerRef = useRef<NodeJS.Timeout>(undefined as any);

  const handleSave = async () => {
    if (!availability?.valid || !availability?.available) return;
    setSaving(true);
    setError('');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError('Not authenticated'); setSaving(false); return; }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        username: '@' + username,
        full_name: fullName,
        school,
        clat_year: clatYear,
      })
      .eq('id', user.id);

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }

    router.push('/student/dashboard');
  };

  const handleSkip = () => {
    router.push('/student/dashboard');
  };

  const statusIcon = checking
    ? <span className="text-muted">⏳</span>
    : availability === null
      ? null
      : availability.available && availability.valid
        ? <span className="text-green-400">✅ Available</span>
        : <span className="text-red-400">❌ {availability.error || 'Taken'}</span>;

  return (
    <div className="min-h-screen bg-page flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="text-5xl">🎯</div>
          <h1 className="text-2xl font-bold text-primary">Welcome to CLATly!</h1>
          <p className="text-sm text-secondary">Set up your profile to get started</p>
        </div>

        <div className="bg-card border border-theme rounded-xl p-6 shadow-theme-sm space-y-5">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-1.5">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-elevated border border-theme text-primary rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              placeholder="Your name"
            />
          </div>

          {/* Username */}
          <div>
            <label className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-1.5">
              Username <span className="text-danger">*</span>
            </label>
            <div className="flex items-center gap-1">
              <span className="text-sm text-muted shrink-0">@</span>
              <input
                type="text"
                value={username}
                onChange={(e) => {
                          const cleaned = e.target.value.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
                          setUsername(cleaned);
                          clearTimeout(debounceTimerRef.current);
                          debounceTimerRef.current = setTimeout(() => checkUsername(cleaned), 300);
                        }}
                className="w-full bg-elevated border border-theme text-primary rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="cool_clater"
                autoFocus
              />
            </div>
            <div className="mt-1.5 flex items-center gap-2">
              <span className="text-xs">{statusIcon}</span>
              {username.length > 0 && username.length < 3 && (
                <span className="text-xs text-muted">At least 3 characters</span>
              )}
            </div>
            <p className="text-[10px] text-muted mt-1">Letters, numbers, and underscores only. 3-20 characters.</p>
          </div>

          {/* School */}
          <div>
            <label className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-1.5">School / College</label>
            <input
              type="text"
              value={school}
              onChange={(e) => setSchool(e.target.value)}
              className="w-full bg-elevated border border-theme text-primary rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              placeholder="e.g. Delhi Public School"
            />
          </div>

          {/* CLAT Year */}
          <div>
            <label className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-1.5">CLAT Year</label>
            <select
              value={clatYear}
              onChange={(e) => setClatYear(Number(e.target.value))}
              className="w-full bg-elevated border border-theme text-primary rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value={2027}>2027</option>
              <option value={2028}>2028</option>
              <option value={2029}>2029</option>
            </select>
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}

          {/* Actions */}
          <div className="space-y-2 pt-1">
            <button
              onClick={handleSave}
              disabled={!availability?.available || !availability?.valid || saving || username.length < 3}
              className="w-full py-2.5 rounded-xl font-medium bg-accent text-white hover:bg-accent-hover transition disabled:opacity-40 disabled:cursor-not-allowed text-sm"
            >
              {saving ? 'Saving...' : 'Complete Setup 🚀'}
            </button>
            <button
              onClick={handleSkip}
              className="w-full py-2 rounded-lg text-xs text-muted hover:text-secondary transition"
            >
              Skip for now — I'll set it up later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
