'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

interface NavItem {
  href: string;
  label: string;
  icon?: string;
}

interface PageHeaderProps {
  title: string;
  navItems?: NavItem[];
  isAdmin?: boolean;
  backHref?: string;
}

export default function PageHeader({ title, navItems, isAdmin, backHref }: PageHeaderProps) {
  const router = useRouter();
  const supabase = createClient();
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email ?? '');
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('id', user.id)
          .single();
        if (profile?.full_name) setUserName(profile.full_name);
        if ((profile as any)?.avatar_url) setAvatarUrl((profile as any).avatar_url);
      }
    })();
  }, []);

  const initials = (userName || userEmail)
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <header className="bg-card border-b border-theme shadow-theme-sm sticky top-0 z-20">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {backHref && (
            <Link href={backHref} className="text-muted hover:text-secondary">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
          )}
          <span className="text-lg font-bold text-primary">{title}</span>
        </div>

        <nav className="flex items-center gap-2">
          {navItems?.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="px-3 py-2 rounded-lg text-sm font-medium text-secondary hover:bg-card-hover active:scale-[0.97] transition-all duration-150"
            >
              {item.icon && <span>{item.icon} </span>}{item.label}
            </Link>
          ))}
          {isAdmin && (
            <Link href="/admin/dashboard"
              className="px-3 py-2 rounded-lg text-sm font-medium text-accent hover:bg-card-hover active:scale-[0.97] transition-all duration-150">
              ⚙️ Admin
            </Link>
          )}

          {/* User avatar + name — clickable to profile */}
          <Link href="/student/profile" className="flex items-center gap-2 pl-3 border-l border-theme ml-1 hover:opacity-80 transition">
            <div className="hidden sm:block text-right">
              <p className="text-xs font-medium text-primary leading-tight">{userName || 'User'}</p>
              <p className="text-[10px] text-muted leading-tight">{isAdmin ? 'Admin' : 'Student'}</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0 overflow-hidden">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <span>{initials}</span>
              )}
            </div>
          </Link>

          <button onClick={handleSignOut}
            className="px-3 py-2 rounded-lg text-sm font-medium text-danger hover:bg-tint-danger active:scale-[0.97] transition-all duration-150 cursor-pointer shrink-0">
            <svg className="w-4 h-4 inline-block mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign Out
          </button>
        </nav>
      </div>
    </header>
  );
}
