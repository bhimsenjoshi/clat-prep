'use client';

import { useState, ReactNode } from 'react';

interface SectionCardProps {
  /** Card title shown in header */
  title: string;
  /** Emoji / icon prefix */
  icon?: string;
  /** Right-side header content (loading indicators, counts, etc.) */
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
  const isToggleable = collapsible;

  const borderMap = {
    default: 'border-slate-700/50',
    accent: 'border-indigo-700/40',
    plain: 'border-slate-700/30',
  };

  const bgMap = {
    default: 'bg-slate-800/60',
    accent: 'bg-gradient-to-r from-indigo-900/60 via-purple-900/50 to-indigo-900/60',
    plain: 'bg-slate-800/40',
  };

  return (
    <div className={`${bgMap[variant]} ${borderMap[variant]} border rounded-2xl p-5 md:p-6 shadow-lg ${className}`}>
      {/* Header row */}
      <div className="flex items-center gap-2 mb-3">
        {icon && <span className="text-lg shrink-0">{icon}</span>}

        {isToggleable ? (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-white transition text-left flex-1"
          >
            <span>{title}</span>
            <span
              className="text-slate-500 text-[10px] transition-transform duration-200 ml-auto"
              style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
            >
              ▼
            </span>
          </button>
        ) : (
          <h2 className="text-sm font-semibold text-slate-300 flex-1">{title}</h2>
        )}

        {extra && <div className="shrink-0">{extra}</div>}
      </div>

      {/* Body */}
      {(!collapsible || expanded) && <div>{children}</div>}
    </div>
  );
}
