'use client';

import { useState, ReactNode } from 'react';

interface SectionCardProps {
  /** Card title shown in header */
  title: string;
  /** Emoji / icon prefix */
  icon?: string;
  /** Right-side header content (loading indicators, counts, etc.) — shown even when collapsed */
  extra?: ReactNode;
  /** Whether the section can be collapsed */
  collapsible?: boolean;
  /** Default expanded state (default: true) */
  defaultExpanded?: boolean;
  /** Visual variant */
  variant?: 'default' | 'accent' | 'plain';
  /** Content */
  children: ReactNode;
  /** Optional className override for the card wrapper */
  className?: string;
}

export default function SectionCard({
  title,
  icon,
  extra,
  collapsible = false,
  defaultExpanded = true,
  variant = 'default',
  children,
  className = '',
}: SectionCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const showBody = !collapsible || expanded;

  const borderMap = {
    default: 'border-theme',
    accent: 'border-indigo-500/40',
    plain: 'border-theme/70',
  };

  const bgMap = {
    default: 'bg-card',
    accent: 'bg-gradient-to-r from-indigo-900/60 via-purple-900/50 to-indigo-900/60',
    plain: 'bg-card/80',
  };

  const handleToggle = () => {
    if (collapsible) setExpanded(!expanded);
  };

  return (
    <div className={`${bgMap[variant]} ${borderMap[variant]} border rounded-2xl shadow-lg ${className}`}>
      {/* ─── Header row — entire row clickable if collapsible ─── */}
      <div
        onClick={handleToggle}
        className={`
          flex items-center gap-2 px-5 md:px-6
          ${collapsible ? 'cursor-pointer select-none hover:bg-white/[0.02] transition' : ''}
          ${showBody ? 'pt-5 md:pt-6 pb-3' : 'py-3 md:py-3.5'}
        `}
      >
        {icon && <span className="text-lg shrink-0 leading-none">{icon}</span>}

        <span className="text-sm font-semibold text-primary flex-1 truncate">
          {title}
        </span>

        {extra && <div className="shrink-0">{extra}</div>}

        {collapsible && (
          <span
            className="text-slate-500 text-[10px] transition-transform duration-200 shrink-0"
            style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
          >
            ▼
          </span>
        )}
      </div>

      {/* ─── Body ─── */}
      {showBody && (
        <div className="px-5 md:px-6 pb-5 md:pb-6">
          {children}
        </div>
      )}
    </div>
  );
}
