'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface ChangePasswordProps {
  /** Optional callback after successful password change */
  onSuccess?: () => void;
  /** Compact mode for embedding in dashboards */
  compact?: boolean;
}

export default function ChangePassword({ onSuccess, compact }: ChangePasswordProps) {
  const supabase = createClient();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showForm, setShowForm] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    // Validation
    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'New password must be at least 6 characters.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    setLoading(true);

    try {
      // Supabase requires re-authentication for password change
      // First re-auth with current password, then update
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: '', // will be fetched from session
        password: currentPassword,
      });

      if (signInError) {
        setMessage({ type: 'error', text: 'Current password is incorrect.' });
        setLoading(false);
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        setMessage({ type: 'error', text: updateError.message });
      } else {
        setMessage({ type: 'success', text: '✅ Password changed successfully!' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        onSuccess?.();
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    }

    setLoading(false);
  };

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        className={`flex items-center gap-2 border border-theme rounded-xl ${
          compact
            ? 'p-3 text-sm hover:bg-elevated transition'
            : 'px-5 py-3 text-sm hover:bg-elevated transition'
        }`}
      >
        <svg className="w-4 h-4 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
        </svg>
        Change Password
      </button>
    );
  }

  return (
    <div className={`${compact ? '' : 'bg-card border border-theme rounded-xl shadow-theme-sm overflow-hidden'}`}>
      {!compact && (
        <div className="px-6 py-4 border-b border-theme flex items-center justify-between">
          <h2 className="font-semibold text-primary flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
            Change Password
          </h2>
          <button onClick={() => setShowForm(false)} className="text-sm text-muted hover:text-secondary transition">✕</button>
        </div>
      )}
      <div className={`${compact ? '' : 'px-6 py-5'}`}>
        {compact && (
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-primary flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              Change Password
            </h3>
            <button onClick={() => setShowForm(false)} className="text-xs text-muted hover:text-secondary transition">✕</button>
          </div>
        )}

        {message && (
          <div className={`p-3 rounded-xl text-sm mb-4 ${
            message.type === 'success'
              ? 'bg-success/10 border border-success/50 text-success'
              : 'bg-danger/10 border border-danger/50 text-danger'
          }`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-muted uppercase tracking-wider mb-1.5">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              required
              className="w-full px-3 py-2.5 rounded-xl border border-theme bg-card-hover text-primary text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted uppercase tracking-wider mb-1.5">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 6 characters"
              required
              minLength={6}
              className="w-full px-3 py-2.5 rounded-xl border border-theme bg-card-hover text-primary text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted uppercase tracking-wider mb-1.5">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              required
              minLength={6}
              className="w-full px-3 py-2.5 rounded-xl border border-theme bg-card-hover text-primary text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition"
            />
          </div>
          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl font-medium text-sm bg-accent text-white hover:bg-accent-hover transition disabled:opacity-50 shadow-sm"
            >
              {loading ? '⏳ Updating...' : '🔒 Update Password'}
            </button>
            {compact && (
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2.5 rounded-xl text-sm text-secondary border border-theme hover:bg-elevated transition"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
