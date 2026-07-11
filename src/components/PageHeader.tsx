'use client';

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
  /** Nav links for the left side of the header */
  navItems?: NavItem[];
  /** Whether this is an admin page */
  isAdmin?: boolean;
  /** Back link href (optional) */
  backHref?: string;
}

export default function PageHeader({ title, navItems, isAdmin, backHref }: PageHeaderProps) {
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <header className="bg-card border-b border-theme shadow-theme-sm sticky top-0 z-20">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
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
            <Link
              href="/admin/dashboard"
              className="px-3 py-2 rounded-lg text-sm font-medium text-accent hover:bg-card-hover active:scale-[0.97] transition-all duration-150"
            >
              ⚙️ Admin
            </Link>
          )}
          <button
            onClick={handleSignOut}
            className="px-3 py-2 rounded-lg text-sm font-medium text-danger hover:bg-tint-danger active:scale-[0.97] transition-all duration-150 cursor-pointer"
          >
            🚪 Sign Out
          </button>
        </nav>
      </div>
    </header>
  );
}
