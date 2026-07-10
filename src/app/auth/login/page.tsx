'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient, persistSessionToCookie } from '@/lib/supabase/client';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const supabase = createClient();
      console.log('Login: attempting signInWithPassword for', email);
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });

      if (authError) {
        console.error('Login: auth error', authError.message);
        setError(authError.message);
        setLoading(false);
        return;
      }

      console.log('Login: success, persisting session cookie');
      await persistSessionToCookie(supabase);

      console.log('Login: redirecting to /auth/redirect');
      window.location.href = '/auth/redirect';
    } catch (err) {
      console.error('Login: unexpected error', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-card border-theme rounded-xl p-8 shadow-theme-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Welcome back</h1>
          <p className="text-secondary text-sm mt-1">Sign in to your CLAT Prep account</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full border-theme rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="you@example.com" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full border-theme rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="••••••••" />
          </div>
          {error && <p className="text-danger text-sm">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full bg-accent text-white rounded-lg py-2.5 font-medium bg-accent-hover disabled:opacity-50 transition">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <p className="text-center text-sm text-secondary">
          Don&apos;t have an account?{' '}
          <Link href="/auth/signup" className="text-accent hover:underline">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
