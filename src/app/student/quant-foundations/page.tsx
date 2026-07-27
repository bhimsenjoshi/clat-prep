'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { persistSessionToCookie } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PageHeader from '@/components/PageHeader';
import ExplanationBlock from '@/components/ExplanationBlock';

const SUBSECTIONS = [
  { id: 'Percentages', label: 'Percentages', icon: '💯', color: 'blue', desc: 'Grids, pie charts, and mental % calculations' },
  { id: 'Ratios & Proportions', label: 'Ratios & Proportions', icon: '📐', color: 'purple', desc: 'Tape diagrams, scaling, and visual ratios' },
  { id: 'Fractions & Decimals', label: 'Fractions & Decimals', icon: '🔢', color: 'emerald', desc: 'Number lines, area models, and visual fractions' },
  { id: 'Data Basics', label: 'Data Basics', icon: '📊', color: 'amber', desc: 'Charts, trends, and visual data interpretation' },
] as const;

const SUBSECTION_ICONS: Record<string, string> = {
  'Percentages': '💯',
  'Ratios & Proportions': '📐',
  'Fractions & Decimals': '🔢',
  'Data Basics': '📊',
};

// ─── SVG Visual Models — match each question's passage exactly ───
function VisualModel({ question }: { question: QuestionData }) {
  const baseClass = "w-full max-w-xs mx-auto bg-card rounded-xl p-4 border border-theme";
  const qt = question.question_text;

  // Match by question text to render the CORRECT SVG per question
  // ── Grid Questions ──
  if (qt.startsWith("What percentage of the grid is shaded")) {
    // Q1: 10×10 grid, 43 shaded = 43%
    return (
      <div className={baseClass}>
        <svg viewBox="0 0 200 200" className="w-full" fill="none">
          <rect x="0" y="0" width="200" height="200" fill="#1e293b" rx="4" />
          {Array.from({ length: 100 }).map((_, i) => {
            const row = Math.floor(i / 10);
            const col = i % 10;
            const shaded = i < 43;
            return (
              <rect key={i} x={col * 20 + 1} y={row * 20 + 1}
                width={18} height={18} rx={2}
                fill={shaded ? '#6366f1' : '#334155'}
                stroke={shaded ? '#818cf8' : '#475569'} strokeWidth="0.5"
              />
            );
          })}
        </svg>
        <p className="text-[10px] text-center text-muted mt-2">43 of 100 cells shaded · Each cell = 1%</p>
      </div>
    );
  }

  if (qt.startsWith("What is 0.6 expressed as a fraction")) {
    // Q22: 10×10 grid, 60 shaded = 60% = 0.6
    return (
      <div className={baseClass}>
        <svg viewBox="0 0 200 200" className="w-full" fill="none">
          <rect x="0" y="0" width="200" height="200" fill="#1e293b" rx="4" />
          {Array.from({ length: 100 }).map((_, i) => {
            const row = Math.floor(i / 10);
            const col = i % 10;
            const shaded = i < 60;
            return (
              <rect key={i} x={col * 20 + 1} y={row * 20 + 1}
                width={18} height={18} rx={2}
                fill={shaded ? '#6366f1' : '#334155'}
                stroke={shaded ? '#818cf8' : '#475569'} strokeWidth="0.5"
              />
            );
          })}
        </svg>
        <p className="text-[10px] text-center text-muted mt-2">60 of 100 cells shaded = 60% = 0.6</p>
      </div>
    );
  }

  // ── Pie Chart Questions ──
  if (qt.startsWith("What percentage of the pie chart")) {
    // Q2: 4 equal quarters, 3 shaded blue, 1 unshaded (top-right)
    return (
      <div className={baseClass}>
        <svg viewBox="0 0 200 200" className="w-full">
          <circle cx="100" cy="100" r="85" fill="#1e293b" />
          {/* Top-right (unshaded) */}
          <path d="M100,100 L185,100 A85,85 0 0,1 100,15 Z" fill="#334155" stroke="#475569" strokeWidth="1" />
          {/* Bottom-right (shaded) */}
          <path d="M100,100 L100,185 A85,85 0 0,1 185,100 Z" fill="#6366f1" stroke="#818cf8" strokeWidth="1" />
          {/* Bottom-left (shaded) */}
          <path d="M100,100 L15,100 A85,85 0 0,1 100,185 Z" fill="#6366f1" stroke="#818cf8" strokeWidth="1" />
          {/* Top-left (shaded) */}
          <path d="M100,100 L100,15 A85,85 0 0,1 15,100 Z" fill="#6366f1" stroke="#818cf8" strokeWidth="1" />
          <circle cx="100" cy="100" r="15" fill="#1e293b" stroke="#475569" strokeWidth="1" />
        </svg>
        <p className="text-[10px] text-center text-muted mt-2">3 quarters shaded (blue) · 1 unshaded (top-right) = 25%</p>
      </div>
    );
  }

  if (qt.startsWith("What fraction of the pizza")) {
    // Q19: Pizza 8 slices, 3 eaten (gap), 5 remaining
    return (
      <div className={baseClass}>
        <svg viewBox="0 0 200 200" className="w-full">
          <circle cx="100" cy="100" r="85" fill="#1e293b" />
          {/* 8 pizza slices - 3 eaten (gap) shown as dark */}
          {/* Slice 1: 0°-45° */}
          <path d="M100,100 L100,15 A85,85 0 0,1 160.1,39.9 Z" fill="#6366f1" stroke="#818cf8" strokeWidth="0.8" />
          {/* Slice 2: 45°-90° */}
          <path d="M100,100 L160.1,39.9 A85,85 0 0,1 185,100 Z" fill="#6366f1" stroke="#818cf8" strokeWidth="0.8" />
          {/* Slice 3: 90°-135° - REMOVED (eaten, dark gap) */}
          <path d="M100,100 L185,100 A85,85 0 0,1 160.1,160.1 Z" fill="#1e293b" stroke="#334155" strokeWidth="0.5" strokeDasharray="2,2" />
          {/* Slice 4: 135°-180° */}
          <path d="M100,100 L160.1,160.1 A85,85 0 0,1 100,185 Z" fill="#6366f1" stroke="#818cf8" strokeWidth="0.8" />
          {/* Slice 5: 180°-225° */}
          <path d="M100,100 L100,185 A85,85 0 0,1 39.9,160.1 Z" fill="#6366f1" stroke="#818cf8" strokeWidth="0.8" />
          {/* Slice 6: 225°-270° - REMOVED */}
          <path d="M100,100 L39.9,160.1 A85,85 0 0,1 15,100 Z" fill="#1e293b" stroke="#334155" strokeWidth="0.5" strokeDasharray="2,2" />
          {/* Slice 7: 270°-315° */}
          <path d="M100,100 L15,100 A85,85 0 0,1 39.9,39.9 Z" fill="#6366f1" stroke="#818cf8" strokeWidth="0.8" />
          {/* Slice 8: 315°-360° - REMOVED */}
          <path d="M100,100 L39.9,39.9 A85,85 0 0,1 100,15 Z" fill="#1e293b" stroke="#334155" strokeWidth="0.5" strokeDasharray="2,2" />
          <circle cx="100" cy="100" r="12" fill="#1e293b" stroke="#475569" strokeWidth="1" />
        </svg>
        <p className="text-[10px] text-center text-muted mt-2">3 of 8 slices eaten (gap) · 5 remain</p>
      </div>
    );
  }

  if (qt.includes("pie chart shows 4 expenditure categories")) {
    // Q24: 4 categories: Rent 50%, Food 25%, Transport 15%, Savings 10%
    return (
      <div className={baseClass}>
        <svg viewBox="0 0 200 200" className="w-full">
          <circle cx="100" cy="100" r="85" fill="#1e293b" />
          {/* Rent 50% = 180° (top half) */}
          <path d="M100,100 L185,100 A85,85 0 0,1 100,15 Z" fill="#6366f1" stroke="#818cf8" strokeWidth="1" />
          <path d="M100,100 L100,15 A85,85 0 0,1 15,100 Z" fill="#4f46e5" stroke="#818cf8" strokeWidth="1" />
          {/* Food 25% = 90° (bottom-right) */}
          <path d="M100,100 L185,100 A85,85 0 0,1 100,185 Z" fill="#a855f7" stroke="#c084fc" strokeWidth="0.8" />
          <path d="M100,100 L160.1,160.1 A85,85 0 0,1 185,100 Z" fill="#9333ea" stroke="#c084fc" strokeWidth="0.5" />
          {/* Transport 15% = 54° (bottom-left lower) */}
          <path d="M100,100 L100,185 A85,85 0 0,1 55.5,139.9 Z" fill="#f59e0b" stroke="#fbbf24" strokeWidth="0.8" />
          {/* Savings 10% = 36° (bottom-left lower) */}
          <path d="M100,100 L55.5,139.9 A85,85 0 0,1 15,100 Z" fill="#10b981" stroke="#34d399" strokeWidth="0.8" />
          <circle cx="100" cy="100" r="12" fill="#1e293b" stroke="#475569" strokeWidth="1" />
          {/* Labels */}
          <text x="80" y="35" textAnchor="end" fill="#c7d2fe" fontSize="8" fontWeight="bold">Rent 50%</text>
          <text x="145" y="155" textAnchor="start" fill="#d8b4fe" fontSize="8" fontWeight="bold">Food 25%</text>
          <text x="30" y="165" textAnchor="start" fill="#fde68a" fontSize="7">Trans 15%</text>
          <text x="30" y="125" textAnchor="start" fill="#a7f3d0" fontSize="7">Sav 10%</text>
        </svg>
        <p className="text-[10px] text-center text-muted mt-2">Rent 50% · Food 25% · Transport 15% · Savings 10%</p>
      </div>
    );
  }

  // ── Bar Diagram Questions ──
  if (qt.startsWith("A shirt costs ₹800")) {
    // Q4: Bar with 20 parts, 3 crossed out (15% discount, ₹680 sale price)
    return (
      <div className={baseClass}>
        <svg viewBox="0 0 220 80" className="w-full" fill="none">
          <text x="5" y="14" fill="#94a3b8" fontSize="8">₹800</text>
          {/* 20 small vertical parts forming one big bar */}
          {Array.from({ length: 20 }).map((_, i) => {
            const removed = i >= 17; // last 3 = 15% removed
            return (
              <g key={i}>
                <rect x={25 + i * 9} y="18" width="7" height="36" rx="1"
                  fill={removed ? '#1e293b' : '#6366f1'}
                  stroke={removed ? '#334155' : '#818cf8'} strokeWidth="0.5"
                />
                {removed && (
                  <>
                    <line x1={25 + i * 9} y1="18" x2={25 + i * 9 + 7} y2="54" stroke="#ef4444" strokeWidth="1.5" />
                    <line x1={25 + i * 9 + 7} y1="18" x2={25 + i * 9} y2="54" stroke="#ef4444" strokeWidth="1.5" />
                  </>
                )}
              </g>
            );
          })}
          {/* Label */}
          <text x="115" y="74" textAnchor="middle" fill="#6366f1" fontSize="8" fontWeight="bold">20 parts · 3 crossed out (15%)</text>
        </svg>
        <p className="text-[10px] text-center text-muted mt-2">₹800 split into 20 parts · 3 removed = ₹680</p>
      </div>
    );
  }

  if (qt.startsWith("In a bar chart showing favorite fruits")) {
    // Q8: 3 bars Apple=40, Banana=25, Cherry=35
    return (
      <div className={baseClass}>
        <svg viewBox="0 0 200 140" className="w-full" fill="none">
          {/* Axis */}
          <line x1="25" y1="10" x2="25" y2="110" stroke="#475569" strokeWidth="1.5" />
          <line x1="25" y1="110" x2="190" y2="110" stroke="#475569" strokeWidth="1.5" />
          {/* Y axis labels */}
          <text x="22" y="110" textAnchor="end" fill="#64748b" fontSize="8">0</text>
          <text x="22" y="70" textAnchor="end" fill="#64748b" fontSize="8">25</text>
          <text x="22" y="30" textAnchor="end" fill="#64748b" fontSize="8">40</text>
          {/* Apple bar = 40 */}
          <rect x="40" y="30" width="35" height="80" rx="3" fill="#6366f1" stroke="#818cf8" strokeWidth="1" />
          <text x="57" y="126" textAnchor="middle" fill="#94a3b8" fontSize="10">Apple</text>
          <text x="57" y="24" textAnchor="middle" fill="#a5b4fc" fontSize="11" fontWeight="bold">40</text>
          {/* Banana bar = 25 */}
          <rect x="95" y="70" width="35" height="40" rx="3" fill="#a855f7" stroke="#c084fc" strokeWidth="1" />
          <text x="112" y="126" textAnchor="middle" fill="#94a3b8" fontSize="10">Banana</text>
          <text x="112" y="64" textAnchor="middle" fill="#d8b4fe" fontSize="11" fontWeight="bold">25</text>
          {/* Cherry bar = 35 */}
          <rect x="150" y="40" width="35" height="70" rx="3" fill="#3b82f6" stroke="#60a5fa" strokeWidth="1" />
          <text x="167" y="126" textAnchor="middle" fill="#94a3b8" fontSize="10">Cherry</text>
          <text x="167" y="34" textAnchor="middle" fill="#93c5fd" fontSize="11" fontWeight="bold">35</text>
        </svg>
        <p className="text-[10px] text-center text-muted mt-2">Apple 40 − Banana 25 = 15 more chose Apple</p>
      </div>
    );
  }

  if (qt.startsWith("Which fraction is equivalent to 2/3")) {
    // Q20: Bar 3 sections, 2 shaded. Same bar split into 6, 4 shaded
    return (
      <div className={baseClass}>
        <svg viewBox="0 0 220 70" className="w-full" fill="none">
          {/* Bar 1: 2/3 */}
          <text x="5" y="14" fill="#94a3b8" fontSize="8">2/3</text>
          {[0,1,2].map(i => (
            <rect key={i} x={25 + i*55} y="4" width="53" height="14" rx="2"
              fill={i < 2 ? '#6366f1' : '#334155'}
              stroke="#818cf8" strokeWidth="0.8"
            />
          ))}
          {/* Arrow */}
          <text x="110" y="34" textAnchor="middle" fill="#64748b" fontSize="9">↓ split each</text>
          {/* Bar 2: 4/6 */}
          <text x="5" y="54" fill="#94a3b8" fontSize="8">4/6</text>
          {[0,1,2,3,4,5].map(i => (
            <rect key={i} x={25 + i*28} y="42" width="26" height="14" rx="2"
              fill={i < 4 ? '#6366f1' : '#334155'}
              stroke="#818cf8" strokeWidth="0.8"
            />
          ))}
        </svg>
        <p className="text-[10px] text-center text-muted mt-2">Each ⅓ split in half: 2/3 = 4/6 (same area)</p>
      </div>
    );
  }

  if (qt.startsWith("What is 2/7 + 3/7")) {
    // Q21: Bar 7 parts, 2 blue + 3 red shaded
    return (
      <div className={baseClass}>
        <svg viewBox="0 0 220 60" className="w-full" fill="none">
          {/* Full bar of 7 parts */}
          {[0,1,2,3,4,5,6].map(i => {
            let fill = '#334155'; // unshaded
            let stroke = '#475569';
            if (i < 2) { fill = '#6366f1'; stroke = '#818cf8'; } // blue
            else if (i < 5) { fill = '#a855f7'; stroke = '#c084fc'; } // red
            return (
              <rect key={i} x={20 + i*26} y="10" width="24" height="30" rx="2"
                fill={fill} stroke={stroke} strokeWidth="0.8"
              />
            );
          })}
          {/* Labels */}
          <text x="32" y="55" textAnchor="middle" fill="#a5b4fc" fontSize="9">2 blue</text>
          <text x="84" y="55" textAnchor="middle" fill="#d8b4fe" fontSize="9">3 red</text>
          <text x="162" y="55" textAnchor="middle" fill="#64748b" fontSize="9">2 unshaded</text>
        </svg>
        <p className="text-[10px] text-center text-muted mt-2">2 blue + 3 red = 5/7 shaded</p>
      </div>
    );
  }

  if (qt.startsWith("The heights of 5 students")) {
    // Q23: 5 bars of heights 150,155,160,165,170
    return (
      <div className={baseClass}>
        <svg viewBox="0 0 200 130" className="w-full" fill="none">
          {/* Axis */}
          <line x1="20" y1="10" x2="20" y2="105" stroke="#475569" strokeWidth="1.5" />
          <line x1="20" y1="105" x2="190" y2="105" stroke="#475569" strokeWidth="1.5" />
          {/* 5 bars forming a staircase */}
          {[
            { h: 76, label: '150', x: 30 },
            { h: 80, label: '155', x: 62 },
            { h: 84, label: '160', x: 94 },
            { h: 88, label: '165', x: 126 },
            { h: 92, label: '170', x: 158 },
          ].map((b, i) => (
            <g key={i}>
              <rect x={b.x} y={105 - b.h} width="24" height={b.h} rx="3"
                fill="#6366f1" stroke="#818cf8" strokeWidth="1"
                opacity={0.5 + i * 0.1}
              />
              <text x={b.x + 12} y={105 - b.h - 4} textAnchor="middle" fill="#a5b4fc" fontSize="8">{b.label}</text>
            </g>
          ))}
          {/* Mean line at 160 */}
          <line x1="25" y1="21" x2="190" y2="21" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="4,3" />
          <text x="190" y="17" textAnchor="end" fill="#fbbf24" fontSize="8">Mean = 160</text>
        </svg>
        <p className="text-[10px] text-center text-muted mt-2">Staircase bars · Mean = 160 cm (dashed line)</p>
      </div>
    );
  }

  if (qt.includes("bag contains 4 red marbles, 3 blue marbles")) {
    // Q26: Bar 12 segments: 4 red, 3 blue, 5 green
    return (
      <div className={baseClass}>
        <svg viewBox="0 0 220 70" className="w-full" fill="none">
          {/* Bar with 12 segments: 4 red, 3 blue, 5 green */}
          {[0,1,2,3,4,5,6,7,8,9,10,11].map(i => {
            let fill, stroke, label;
            if (i < 4) { fill = '#ef4444'; stroke = '#f87171'; label = 'R'; }
            else if (i < 7) { fill = '#3b82f6'; stroke = '#60a5fa'; label = 'B'; }
            else { fill = '#22c55e'; stroke = '#4ade80'; label = 'G'; }
            return (
              <g key={i}>
                <rect x={15 + i*16} y="10" width="14" height="28" rx="2"
                  fill={fill} stroke={stroke} strokeWidth="0.8"
                />
                <text x={15 + i*16 + 7} y="28" textAnchor="middle" fill="white" fontSize="7" fontWeight="bold">{label}</text>
              </g>
            );
          })}
          <text x="110" y="55" textAnchor="middle" fill="#64748b" fontSize="9">4 Red · 3 Blue · 5 Green (12 total)</text>
        </svg>
        <p className="text-[10px] text-center text-muted mt-2">P(Blue) = 3/12 = 1/4</p>
      </div>
    );
  }

  // ── Tape Diagram Questions ──
  if (qt.startsWith("After a 20% increase")) {
    // Q3: 1 bar 5 parts (original 50) + 1 extension (20% increase = 60)
    return (
      <div className={baseClass}>
        <svg viewBox="0 0 240 60" className="w-full" fill="none">
          {/* 5 original segments */}
          {[0,1,2,3,4].map(i => (
            <rect key={i} x={15 + i*36} y="10" width="34" height="24" rx="2"
              fill="#6366f1" stroke="#818cf8" strokeWidth="0.8"
            />
          ))}
          {/* Extension (+1 segment = 20%) */}
          <rect x={195} y="10" width="34" height="24" rx="2"
            fill="#a855f7" stroke="#c084fc" strokeWidth="0.8"
          />
          <text x="32" y="48" textAnchor="middle" fill="#a5b4fc" fontSize="8">10</text>
          <text x="68" y="48" textAnchor="middle" fill="#a5b4fc" fontSize="8">10</text>
          <text x="104" y="48" textAnchor="middle" fill="#a5b4fc" fontSize="8">10</text>
          <text x="140" y="48" textAnchor="middle" fill="#a5b4fc" fontSize="8">10</text>
          <text x="176" y="48" textAnchor="middle" fill="#a5b4fc" fontSize="8">10</text>
          <text x="212" y="48" textAnchor="middle" fill="#d8b4fe" fontSize="8" fontWeight="bold">+20%</text>
          <text x="32" y="6" textAnchor="middle" fill="#94a3b8" fontSize="7">Original 50</text>
          <text x="212" y="6" textAnchor="middle" fill="#d8b4fe" fontSize="7">+10</text>
        </svg>
        <p className="text-[10px] text-center text-muted mt-2">5 parts × 10 = 50 · Add 1 part (20%) = 60</p>
      </div>
    );
  }

  if (qt.startsWith("If 30% of a number is 90")) {
    // Q5: 1 bar 10 parts, first 3 shaded = 90 (30%)
    return (
      <div className={baseClass}>
        <svg viewBox="0 0 230 60" className="w-full" fill="none">
          {/* 10 parts, first 3 shaded */}
          {[0,1,2,3,4,5,6,7,8,9].map(i => {
            const shaded = i < 3;
            return (
              <g key={i}>
                <rect x={15 + i*20} y="10" width="18" height="24" rx="2"
                  fill={shaded ? '#6366f1' : '#334155'}
                  stroke={shaded ? '#818cf8' : '#475569'} strokeWidth="0.8"
                />
                <text x={15 + i*20 + 9} y="24" textAnchor="middle" fill="#a5b4fc" fontSize="6" fontWeight="bold"
                  style={{ display: shaded ? 'block' : 'none' }}
                >30</text>
              </g>
            );
          })}
          {/* Bracket over first 3 */}
          <line x1="19" y1="6" x2="69" y2="6" stroke="#f59e0b" strokeWidth="1" />
          <line x1="19" y1="3" x2="19" y2="6" stroke="#f59e0b" strokeWidth="1" />
          <line x1="69" y1="3" x2="69" y2="6" stroke="#f59e0b" strokeWidth="1" />
          <text x="44" y="2" textAnchor="middle" fill="#fbbf24" fontSize="7">30% = 90</text>
          <text x="115" y="46" textAnchor="middle" fill="#64748b" fontSize="8">10 parts × 30 = 300</text>
        </svg>
        <p className="text-[10px] text-center text-muted mt-2">3 shaded parts = 30% = 90 · Each part = 30 · Whole = 300</p>
      </div>
    );
  }

  if (qt.startsWith("In a basket, the ratio of apples to oranges")) {
    // Q6: 1 bar 5 parts, 3 shaded (apples)
    return (
      <div className={baseClass}>
        <svg viewBox="0 0 200 60" className="w-full" fill="none">
          {/* 5 parts, 3 shaded for apples */}
          {[0,1,2,3,4].map(i => {
            const shaded = i < 3;
            return (
              <rect key={i} x={15 + i*34} y="10" width="32" height="24" rx="2"
                fill={shaded ? '#6366f1' : '#334155'}
                stroke={shaded ? '#818cf8' : '#475569'} strokeWidth="0.8"
              />
            );
          })}
          {/* Labels */}
          <text x="31" y="48" textAnchor="middle" fill="#a5b4fc" fontSize="9">🍎</text>
          <text x="65" y="48" textAnchor="middle" fill="#a5b4fc" fontSize="9">🍎</text>
          <text x="99" y="48" textAnchor="middle" fill="#a5b4fc" fontSize="9">🍎</text>
          <text x="133" y="48" textAnchor="middle" fill="#fbbf24" fontSize="9">🍊</text>
          <text x="167" y="48" textAnchor="middle" fill="#fbbf24" fontSize="9">🍊</text>
          <text x="100" y="6" textAnchor="middle" fill="#94a3b8" fontSize="8">3 : 2 ratio</text>
        </svg>
        <p className="text-[10px] text-center text-muted mt-2">3 apples + 2 oranges = 5 parts · Apples = 3/5 = 60%</p>
      </div>
    );
  }

  if (qt.startsWith("The ratio of boys to girls in a class is 4 : 3")) {
    // Q11: Tape A (4 parts boys) + Tape B (3 parts girls)
    return (
      <div className={baseClass}>
        <svg viewBox="0 0 220 70" className="w-full" fill="none">
          {/* Tape A — 4 parts (boys) */}
          <text x="5" y="18" fill="#6366f1" fontSize="9" fontWeight="bold">Boys</text>
          {[0,1,2,3].map(i => (
            <rect key={i} x={40 + i*38} y="6" width="36" height="18" rx="2"
              fill="#6366f1" stroke="#818cf8" strokeWidth="0.8"
            />
          ))}
          {/* Tape B — 3 parts (girls) */}
          <text x="5" y="52" fill="#a855f7" fontSize="9" fontWeight="bold">Girls</text>
          {[0,1,2].map(i => (
            <rect key={i} x={40 + i*38} y="40" width="36" height="18" rx="2"
              fill="#a855f7" stroke="#c084fc" strokeWidth="0.8"
            />
          ))}
          {/* Each part = 7 */}
          <text x="220" y="18" textAnchor="end" fill="#a5b4fc" fontSize="8">Each = 7</text>
        </svg>
        <p className="text-[10px] text-center text-muted mt-2">4×7=28 boys · 3×7=21 girls · Total = 49</p>
      </div>
    );
  }

  if (qt.startsWith("₹240 is to be divided")) {
    // Q12: 1 bar 8 parts (5+3), first 5 = A
    return (
      <div className={baseClass}>
        <svg viewBox="0 0 230 60" className="w-full" fill="none">
          {/* 8 parts, first 5 = A */}
          {[0,1,2,3,4,5,6,7].map(i => {
            const isA = i < 5;
            return (
              <rect key={i} x={15 + i*25} y="10" width="23" height="26" rx="2"
                fill={isA ? '#6366f1' : '#a855f7'}
                stroke={isA ? '#818cf8' : '#c084fc'} strokeWidth="0.8"
              />
            );
          })}
          {/* Bracket A */}
          <line x1="19" y1="4" x2="139" y2="4" stroke="#818cf8" strokeWidth="1" />
          <text x="79" y="2" textAnchor="middle" fill="#a5b4fc" fontSize="9">A (5 parts)</text>
          {/* Bracket B */}
          <line x1="140" y1="40" x2="214" y2="40" stroke="#c084fc" strokeWidth="1" />
          <text x="177" y="54" textAnchor="middle" fill="#d8b4fe" fontSize="9">B (3 parts)</text>
        </svg>
        <p className="text-[10px] text-center text-muted mt-2">8 parts × ₹30 = ₹240 · A gets 5 × 30 = ₹150</p>
      </div>
    );
  }

  if (qt.startsWith("Which of the following ratios is equivalent to 2 : 5")) {
    // Q13: Two sets: A(2)+B(5) → A(4)+B(10)
    return (
      <div className={baseClass}>
        <svg viewBox="0 0 230 90" className="w-full" fill="none">
          {/* Original: A=2, B=5 */}
          <text x="5" y="16" fill="#6366f1" fontSize="8" fontWeight="bold">A</text>
          {[0,1].map(i => (
            <rect key={i} x={25 + i*30} y="6" width="28" height="16" rx="2"
              fill="#6366f1" stroke="#818cf8" strokeWidth="0.8"
            />
          ))}
          <text x="5" y="40" fill="#a855f7" fontSize="8" fontWeight="bold">B</text>
          {[0,1,2,3,4].map(i => (
            <rect key={i} x={25 + i*30} y="30" width="28" height="16" rx="2"
              fill="#a855f7" stroke="#c084fc" strokeWidth="0.8"
            />
          ))}
          {/* ×2 arrow */}
          <text x="112" y="58" textAnchor="middle" fill="#fbbf24" fontSize="9">× 2</text>
          {/* Scaled: A'=4, B'=10 */}
          {[0,1,2,3].map(i => (
            <rect key={i} x={25 + i*17} y="64" width="15" height="12" rx="1"
              fill="#6366f1" stroke="#818cf8" strokeWidth="0.6"
            />
          ))}
          {[0,1,2,3,4,5,6,7,8,9].map(i => (
            <rect key={i} x={25 + i*17} y="78" width="15" height="12" rx="1"
              fill="#a855f7" stroke="#c084fc" strokeWidth="0.6"
            />
          ))}
        </svg>
        <p className="text-[10px] text-center text-muted mt-2">2:5 ×2 = 4:10 (same ratio, scaled)</p>
      </div>
    );
  }

  if (qt.startsWith("Concrete is made by mixing cement, sand, and gravel")) {
    // Q14: 1 bar 6 parts (1+2+3), color-coded
    return (
      <div className={baseClass}>
        <svg viewBox="0 0 220 60" className="w-full" fill="none">
          {/* 6 parts: 1 cement, 2 sand, 3 gravel */}
          {[0,1,2,3,4,5].map(i => {
            let fill, stroke, label;
            if (i === 0) { fill = '#6366f1'; stroke = '#818cf8'; label = 'C'; }
            else if (i < 3) { fill = '#f59e0b'; stroke = '#fbbf24'; label = 'S'; }
            else { fill = '#64748b'; stroke = '#94a3b8'; label = 'G'; }
            return (
              <g key={i}>
                <rect x={15 + i*32} y="10" width="30" height="26" rx="2"
                  fill={fill} stroke={stroke} strokeWidth="0.8"
                />
                <text x={15 + i*32 + 15} y="27" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">{label}</text>
              </g>
            );
          })}
          {/* Sand bracket */}
          <line x1="47" y1="40" x2="110" y2="40" stroke="#fbbf24" strokeWidth="1" />
          <text x="79" y="52" textAnchor="middle" fill="#fbbf24" fontSize="8">Sand = 12 buckets</text>
        </svg>
        <p className="text-[10px] text-center text-muted mt-2">Cement 1 · Sand 2 (12) · Gravel 3 · Each = 6</p>
      </div>
    );
  }

  if (qt.startsWith("A recipe calls for 3 cups of flour")) {
    // Q15: Flour tape(3) + Sugar tape(2), scaling
    return (
      <div className={baseClass}>
        <svg viewBox="0 0 230 80" className="w-full" fill="none">
          {/* Original */}
          <text x="5" y="16" fill="#6366f1" fontSize="8" fontWeight="bold">Flour</text>
          {[0,1,2].map(i => (
            <rect key={i} x={45 + i*32} y="6" width="30" height="16" rx="2"
              fill="#6366f1" stroke="#818cf8" strokeWidth="0.8"
            />
          ))}
          <text x="5" y="40" fill="#a855f7" fontSize="8" fontWeight="bold">Sugar</text>
          {[0,1].map(i => (
            <rect key={i} x={45 + i*32} y="30" width="30" height="16" rx="2"
              fill="#a855f7" stroke="#c084fc" strokeWidth="0.8"
            />
          ))}
          {/* ×3 arrow */}
          <text x="112" y="58" textAnchor="middle" fill="#fbbf24" fontSize="9">× 3</text>
          {/* Scaled: flour 9 parts, sugar 6 parts */}
          {[0,1,2,3,4,5,6,7,8].map(i => (
            <rect key={i} x={10 + i*17} y="62" width="15" height="12" rx="1"
              fill="#6366f1" stroke="#818cf8" strokeWidth="0.6"
            />
          ))}
          {[0,1,2,3,4,5].map(i => (
            <rect key={i} x={10 + i*17} y="76" width="15" height="12" rx="1"
              fill="#a855f7" stroke="#c084fc" strokeWidth="0.6"
            />
          ))}
        </svg>
        <p className="text-[10px] text-center text-muted mt-2">Flour 3→9 cups (×3) · Sugar 2→6 cups (×3)</p>
      </div>
    );
  }

  // ── Number Line Questions ──
  if (qt.startsWith("If 5 notebooks cost ₹175")) {
    // Q16: Double number line: notebooks 0-5-8, cost 0-175-?
    return (
      <div className={baseClass}>
        <svg viewBox="0 0 240 70" className="w-full" fill="none">
          {/* Top number line: notebooks */}
          <text x="5" y="16" fill="#6366f1" fontSize="8">Notebooks</text>
          <line x1="60" y1="12" x2="220" y2="12" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="60" cy="12" r="3" fill="#6366f1" />
          <circle cx="140" cy="12" r="3" fill="#6366f1" />
          <circle cx="200" cy="12" r="3" fill="#6366f1" strokeDasharray="3,2" stroke="#a855f7" strokeWidth="2" />
          <text x="60" y="28" textAnchor="middle" fill="#94a3b8" fontSize="9">0</text>
          <text x="140" y="28" textAnchor="middle" fill="#a5b4fc" fontSize="9" fontWeight="bold">5</text>
          <text x="200" y="28" textAnchor="middle" fill="#d8b4fe" fontSize="9" fontWeight="bold">8</text>

          {/* Bottom number line: cost */}
          <text x="5" y="50" fill="#a855f7" fontSize="8">Cost</text>
          <line x1="60" y1="46" x2="220" y2="46" stroke="#a855f7" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="60" cy="46" r="3" fill="#a855f7" />
          <circle cx="140" cy="46" r="3" fill="#a855f7" />
          <circle cx="200" cy="46" r="3" fill="#a855f7" strokeDasharray="3,2" stroke="#f59e0b" strokeWidth="2" />
          <text x="60" y="62" textAnchor="middle" fill="#94a3b8" fontSize="9">₹0</text>
          <text x="140" y="62" textAnchor="middle" fill="#d8b4fe" fontSize="9" fontWeight="bold">₹175</text>
          <text x="200" y="62" textAnchor="middle" fill="#fbbf24" fontSize="9" fontWeight="bold">? → ₹280</text>
        </svg>
        <p className="text-[10px] text-center text-muted mt-2">5 → ₹175 · Each = ₹35 · 8 = ₹280</p>
      </div>
    );
  }

  if (qt.startsWith("Where does the fraction 3/4 lie")) {
    // Number line 0→1, 4 segments, dot at 3/4
    return (
      <div className={baseClass}>
        <svg viewBox="0 0 220 50" className="w-full" fill="none">
          <line x1="20" y1="25" x2="200" y2="25" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
          {[0,1,2,3,4].map(i => (
            <line key={i} x1={20 + i*45} y1="19" x2={20 + i*45} y2="31" stroke="#64748b" strokeWidth="1.5" />
          ))}
          <text x="20" y="44" textAnchor="middle" fill="#94a3b8" fontSize="10">0</text>
          <text x="65" y="44" textAnchor="middle" fill="#94a3b8" fontSize="10">¼</text>
          <text x="110" y="44" textAnchor="middle" fill="#94a3b8" fontSize="10">½</text>
          <text x="155" y="44" textAnchor="middle" fill="#f59e0b" fontSize="10" fontWeight="bold">¾</text>
          <text x="200" y="44" textAnchor="middle" fill="#94a3b8" fontSize="10">1</text>
          <circle cx="155" cy="25" r="5" fill="#6366f1" stroke="#818cf8" strokeWidth="1.5" />
        </svg>
        <p className="text-[10px] text-center text-muted mt-2">3/4 = three-quarters of the way from 0 to 1</p>
      </div>
    );
  }

  if (qt.startsWith("Which decimal is the largest")) {
    // Number line 0→1, dots at 0.4, 0.405, 0.45, 0.5
    return (
      <div className={baseClass}>
        <svg viewBox="0 0 220 50" className="w-full" fill="none">
          <line x1="20" y1="25" x2="200" y2="25" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
          {/* Tick marks at specific positions */}
          {[0, 0.4, 0.405, 0.45, 0.5, 1].map((v, i) => {
            const x = 20 + v * 180;
            return (
              <line key={i} x1={x} y1="19" x2={x} y2="31" stroke="#64748b" strokeWidth="1.5" />
            );
          })}
          {/* Labels */}
          <text x="20" y="44" textAnchor="middle" fill="#94a3b8" fontSize="9">0</text>
          <text x={20 + 0.4*180} y="44" textAnchor="middle" fill="#a5b4fc" fontSize="8">0.4</text>
          <text x={20 + 0.405*180} y="12" textAnchor="middle" fill="#fbbf24" fontSize="7">0.405</text>
          <text x={20 + 0.45*180} y="44" textAnchor="middle" fill="#a5b4fc" fontSize="8">0.45</text>
          <text x={20 + 0.5*180} y="44" textAnchor="middle" fill="#f59e0b" fontSize="9" fontWeight="bold">0.5</text>
          <text x="200" y="44" textAnchor="middle" fill="#94a3b8" fontSize="9">1</text>
          {/* Dots */}
          <circle cx={20 + 0.4*180} cy="25" r="3" fill="#6366f1" stroke="#818cf8" strokeWidth="1" />
          <circle cx={20 + 0.405*180} cy="25" r="3" fill="#f59e0b" stroke="#fbbf24" strokeWidth="1" />
          <circle cx={20 + 0.45*180} cy="25" r="3" fill="#6366f1" stroke="#818cf8" strokeWidth="1" />
          <circle cx={20 + 0.5*180} cy="25" r="4" fill="#a855f7" stroke="#c084fc" strokeWidth="1.5" />
        </svg>
        <p className="text-[10px] text-center text-muted mt-2">0.5 (midpoint) is farthest to the right = largest</p>
      </div>
    );
  }

  if (qt.startsWith("In the dataset {12, 15, 18, 22, 28, 35}")) {
    // Number line 0→40, dots at 12,15,18,22,28,35
    return (
      <div className={baseClass}>
        <svg viewBox="0 0 220 60" className="w-full" fill="none">
          <line x1="20" y1="30" x2="200" y2="30" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
          {/* Tick marks every 10 */}
          {[0,10,20,30,40].map(v => {
            const x = 20 + (v/40) * 180;
            return (
              <g key={v}>
                <line x1={x} y1="24" x2={x} y2="36" stroke="#64748b" strokeWidth="1.5" />
                <text x={x} y="48" textAnchor="middle" fill="#94a3b8" fontSize="9">{v}</text>
              </g>
            );
          })}
          {/* Dots at data points */}
          {[12,15,18,22,28,35].map((v, i) => {
            const x = 20 + (v/40) * 180;
            const colors = ['#6366f1','#818cf8','#a855f7','#c084fc','#3b82f6','#60a5fa'];
            return (
              <g key={i}>
                <circle cx={x} cy="30" r="4" fill={colors[i]} stroke="white" strokeWidth="1" />
                <text x={x} y="18" textAnchor="middle" fill={colors[i]} fontSize="8">{v}</text>
              </g>
            );
          })}
          {/* Range bracket */}
          <line x1={20 + (12/40)*180} y1="38" x2={20 + (35/40)*180} y2="38" stroke="#f59e0b" strokeWidth="1.5" />
          <line x1={20 + (12/40)*180} y1="38" x2={20 + (12/40)*180} y2="41" stroke="#f59e0b" strokeWidth="1.5" />
          <line x1={20 + (35/40)*180} y1="38" x2={20 + (35/40)*180} y2="41" stroke="#f59e0b" strokeWidth="1.5" />
          <text x={20 + (23.5/40)*180} y="56" textAnchor="middle" fill="#fbbf24" fontSize="8">Range = 35−12 = 23</text>
        </svg>
        <p className="text-[10px] text-center text-muted mt-2">Range = largest(35) − smallest(12) = 23</p>
      </div>
    );
  }

  if (qt.startsWith("Find the median of:")) {
    // Number line 0→20, ordered dots at 5,7,8,9,10,12,15
    return (
      <div className={baseClass}>
        <svg viewBox="0 0 240 60" className="w-full" fill="none">
          <line x1="20" y1="30" x2="220" y2="30" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
          {/* Tick marks every 5 */}
          {[0,5,10,15,20].map(v => {
            const x = 20 + (v/20) * 200;
            return (
              <g key={v}>
                <line x1={x} y1="24" x2={x} y2="36" stroke="#64748b" strokeWidth="1.5" />
                <text x={x} y="48" textAnchor="middle" fill="#94a3b8" fontSize="9">{v}</text>
              </g>
            );
          })}
          {/* Ordered dots */}
          {[
            {v:5, c:'#6366f1'},{v:7, c:'#6366f1'},{v:8, c:'#6366f1'},
            {v:9, c:'#f59e0b'}, // median — highlight
            {v:10, c:'#a855f7'},{v:12, c:'#a855f7'},{v:15, c:'#a855f7'}
          ].map((d, i) => {
            const x = 20 + (d.v/20) * 200;
            const r = d.c === '#f59e0b' ? 5 : 3.5;
            return (
              <g key={i}>
                <circle cx={x} cy="30" r={r} fill={d.c}
                  stroke={d.c === '#f59e0b' ? '#fbbf24' : 'white'} strokeWidth={d.c === '#f59e0b' ? 2 : 0.8}
                />
                <text x={x} y="18" textAnchor="middle" fill={d.c} fontSize="7">{d.v}</text>
              </g>
            );
          })}
          {/* Median label */}
          <text x={20 + (9/20)*200} y="56" textAnchor="middle" fill="#fbbf24" fontSize="8" fontWeight="bold">← Median = 9</text>
        </svg>
        <p className="text-[10px] text-center text-muted mt-2">5 7 8 [9] 10 12 15 · Middle value = 9</p>
      </div>
    );
  }

  // ── Fallback: generic SVG by visual_type ──
  // (shouldn't reach here for the 24 seeded questions)
  switch (question.visual_type) {
    case 'grid':
      return (
        <div className={baseClass}>
          <svg viewBox="0 0 200 200" className="w-full" fill="none">
            <rect x="0" y="0" width="200" height="200" fill="#1e293b" rx="4" />
            {Array.from({ length: 100 }).map((_, i) => (
              <rect key={i} x={(i%10)*20+1} y={Math.floor(i/10)*20+1}
                width={18} height={18} rx={2}
                fill={i < 50 ? '#6366f1' : '#334155'}
                stroke={i < 50 ? '#818cf8' : '#475569'} strokeWidth="0.5"
              />
            ))}
          </svg>
          <p className="text-[10px] text-center text-muted mt-2">10×10 grid · shaded cells represent proportion</p>
        </div>
      );
    case 'pie_chart':
      return (
        <div className={baseClass}>
          <svg viewBox="0 0 200 200" className="w-full">
            <circle cx="100" cy="100" r="85" fill="#1e293b" />
            {[0,1,2].map(i => {
              const a1 = -90 + i*90; const a2 = -90 + (i+1)*90;
              const x1 = 100 + 85*Math.cos(a1*Math.PI/180);
              const y1 = 100 + 85*Math.sin(a1*Math.PI/180);
              const x2 = 100 + 85*Math.cos(a2*Math.PI/180);
              const y2 = 100 + 85*Math.sin(a2*Math.PI/180);
              return (
                <path key={i} d={`M100,100 L${x1},${y1} A85,85 0 0,1 ${x2},${y2} Z`}
                  fill="#6366f1" stroke="#818cf8" strokeWidth="0.8"
                />
              );
            })}
            <path d="M100,100 L100,185 A85,85 0 0,1 15,100 Z"
              fill="#334155" stroke="#475569" strokeWidth="0.8" />
            <circle cx="100" cy="100" r="15" fill="#1e293b" stroke="#475569" strokeWidth="1" />
          </svg>
          <p className="text-[10px] text-center text-muted mt-2">Pie chart · comparing parts to whole</p>
        </div>
      );
    default:
      return null;
  }
}

interface QuestionData {
  id: string;
  subsection: string;
  topic: string;
  question_text: string;
  passage: string | null;
  options: Record<string, string>;
  difficulty: string;
  explanation: string | null;
  visual_type: string;
  tags: string[];
}

interface AnswerResult {
  is_correct: boolean;
  correct_option: string;
  explanation: string | Record<string, any>;
  your_answer: string;
}

type Phase = 'select' | 'answering' | 'result' | 'complete';

export default function QuantFoundationsPage() {
  const router = useRouter();
  const supabase = createClient();
  const questionStartRef = useRef<number>(Date.now());

  const [phase, setPhase] = useState<Phase>('select');
  const [selectedSubsection, setSelectedSubsection] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [result, setResult] = useState<AnswerResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [answering, setAnswering] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [stats, setStats] = useState({ correct: 0, total: 0 });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [passageExpanded, setPassageExpanded] = useState(true);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const currentQuestion = questions[currentIndex];
  const safeOptions = currentQuestion
    ? (typeof currentQuestion.options === 'string' ? JSON.parse(currentQuestion.options) : currentQuestion.options)
    : {};

  // Timer tick
  useEffect(() => {
    if (phase !== 'answering') return;
    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - questionStartRef.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [phase]);

  const startSession = async (subsection: string) => {
    setLoading(true);
    setErrorMsg(null);
    setSelectedSubsection(subsection);
    try {
      await persistSessionToCookie(supabase);

      const res = await fetch('/api/quant-foundations/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subsection }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to start session');
        setLoading(false);
        return;
      }

      setSessionId(data.session_id);
      setQuestions(data.questions);
      setCurrentIndex(0);
      setSelected(null);
      setResult(null);
      setShowExplanation(false);
      setStats({ correct: 0, total: 0 });
      setPhase('answering');
      questionStartRef.current = Date.now();
      setElapsedSeconds(0);
    } catch (e) {
      setErrorMsg('Network error. Please try again.');
    }
    setLoading(false);
  };

  const submitAnswer = async () => {
    if (!selected || !sessionId || !currentQuestion || answering) return;
    setAnswering(true);

    const timeTaken = Math.floor((Date.now() - questionStartRef.current) / 1000);

    try {
      await persistSessionToCookie(supabase);

      const res = await fetch('/api/quant-foundations/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          question_id: currentQuestion.id,
          selected_option: selected,
          time_taken_seconds: Math.max(1, timeTaken),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to submit');
        setAnswering(false);
        return;
      }

      setResult({
        is_correct: data.is_correct,
        correct_option: data.correct_option,
        explanation: data.explanation,
        your_answer: selected,
      });
      setStats(prev => ({
        correct: prev.correct + (data.is_correct ? 1 : 0),
        total: prev.total + 1,
      }));
      setPhase('result');
    } catch {
      setErrorMsg('Network error');
    }
    setAnswering(false);
  };

  const nextQuestion = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(prev => prev + 1);
      setSelected(null);
      setResult(null);
      setShowExplanation(false);
      setPhase('answering');
      questionStartRef.current = Date.now();
      setElapsedSeconds(0);
      setPassageExpanded(true);
    } else {
      setPhase('complete');
    }
  };

  const formatTime = (s: number) => {
    if (s >= 60) return `${Math.floor(s / 60)}m ${s % 60}s`;
    return `${s}s`;
  };

  const backToSelect = () => {
    setPhase('select');
    setSelectedSubsection(null);
    setSessionId(null);
    setQuestions([]);
    setCurrentIndex(0);
    setErrorMsg(null);
  };

  const restartSame = () => {
    if (selectedSubsection) startSession(selectedSubsection);
  };

  // ─── Phase: Select subsection ───
  if (phase === 'select') {
    return (
      <div className="min-h-screen bg-page">
        <PageHeader title="Quant Foundations" navItems={[
          { href: '/student/dashboard', label: 'Dashboard', icon: '🏛️' },
          { href: '/student/analytics?tab=quant_foundations', label: 'Analytics', icon: '📊' },
        ]} />
        <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
          <div className="text-center mb-2">
            <h1 className="text-2xl font-bold text-primary">🧮 Quant Foundations</h1>
            <p className="text-sm text-secondary mt-1">
              Build your visualization skills — picture the math before you solve it
            </p>
          </div>

          {errorMsg && (
            <div className="bg-danger/10 border border-danger/30 rounded-xl p-4 text-sm text-danger">{errorMsg}</div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SUBSECTIONS.map(sub => (
              <button
                key={sub.id}
                onClick={() => startSession(sub.id)}
                disabled={loading}
                className="bg-card border border-theme rounded-xl p-5 text-left hover:bg-elevated hover:border-accent/30 transition-all shadow-theme-sm active:scale-[0.98] disabled:opacity-50"
              >
                <div className="text-3xl mb-2">{sub.icon}</div>
                <h3 className="font-semibold text-primary text-base">{sub.label}</h3>
                <p className="text-xs text-secondary mt-1 leading-relaxed">{sub.desc}</p>
              </button>
            ))}
          </div>

          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin w-6 h-6 border-2 border-accent border-t-transparent rounded-full" />
              <span className="ml-3 text-sm text-secondary">Loading questions...</span>
            </div>
          )}
        </main>
      </div>
    );
  }

  // ─── Phase: Complete ───
  if (phase === 'complete') {
    const pct = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
    return (
      <div className="min-h-screen bg-page">
        <PageHeader title="Session Complete" />
        <main className="max-w-lg mx-auto px-4 py-12">
          <div className="bg-card border border-theme rounded-2xl shadow-theme-lg p-8 text-center">
            <div className="text-5xl mb-4">{pct >= 70 ? '🎉' : pct >= 40 ? '💪' : '📚'}</div>
            <h2 className="text-2xl font-bold text-primary mb-2">Session Complete!</h2>
            <p className="text-sm text-secondary mb-6">{SUBSECTION_ICONS[selectedSubsection!] || '📐'} {selectedSubsection}</p>

            <div className="flex justify-center gap-8 mb-6">
              <div>
                <p className="text-3xl font-bold text-accent">{stats.correct}/{stats.total}</p>
                <p className="text-xs text-secondary mt-1">Correct</p>
              </div>
              <div>
                <p className={`text-3xl font-bold ${pct >= 70 ? 'text-success' : pct >= 40 ? 'text-warning' : 'text-danger'}`}>{pct}%</p>
                <p className="text-xs text-secondary mt-1">Accuracy</p>
              </div>
            </div>

            <div className="flex gap-3 justify-center">
              <button onClick={restartSame} className="px-6 py-3 rounded-xl font-medium bg-accent text-white hover:bg-accent-hover transition shadow-sm">
                🔄 Practice Again
              </button>
              <button onClick={backToSelect} className="px-6 py-3 rounded-xl font-medium bg-card border border-theme text-secondary hover:bg-elevated transition">
                📂 Choose Topic
              </button>
              <Link href="/student/analytics?tab=quant_foundations" className="px-6 py-3 rounded-xl font-medium bg-card border border-theme text-accent hover:bg-elevated transition">
                📊 See Progress
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ─── Phase: Answering / Result ───
  if (!currentQuestion) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-page">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full mx-auto" />
          <p className="text-sm text-secondary mt-3">Loading question...</p>
        </div>
      </div>
    );
  }

  const isResult = phase === 'result';
  const isCorrect = result?.is_correct === true;
  const isWrong = result?.is_correct === false;

  const getVisualBadge = (vt: string) => {
    const badges: Record<string, string> = {
      'pie_chart': '🥧',
      'bar_diagram': '📊',
      'tape_diagram': '📏',
      'grid': '🔲',
      'number_line': '📈',
      'none': '',
    };
    return badges[vt] || '';
  };

  return (
    <div className="min-h-screen bg-page">
      <PageHeader title="Quant Foundations" />

      {/* Progress bar */}
      <div className="bg-card border-b border-theme">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between text-xs text-secondary mb-1.5">
            <span>{SUBSECTION_ICONS[selectedSubsection!]} {selectedSubsection}</span>
            <span>Q{currentIndex + 1}/{questions.length} · ✅ {stats.correct}/{stats.total}</span>
          </div>
          <div className="w-full bg-elevated rounded-full h-1.5">
            <div className="h-1.5 rounded-full bg-accent transition-all" style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }} />
          </div>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {/* Badges */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {getVisualBadge(currentQuestion.visual_type) && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent font-medium">
                {getVisualBadge(currentQuestion.visual_type)} {currentQuestion.visual_type.replace('_', ' ')}
              </span>
            )}
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              currentQuestion.difficulty === 'easy' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
            }`}>{currentQuestion.difficulty}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted">
            <span>⏱</span>
            <span className="font-mono">{formatTime(elapsedSeconds)}</span>
          </div>
        </div>

        {/* Error */}
        {errorMsg && (
          <div className="bg-danger/10 border border-danger/30 rounded-xl p-3 text-sm text-danger mb-4">{errorMsg}</div>
        )}

        {/* Visual passage */}
        {currentQuestion.passage && (
          <div className="bg-card-hover border border-theme rounded-xl mb-4 overflow-hidden">
            <button
              onClick={() => setPassageExpanded(!passageExpanded)}
              className="w-full px-5 py-3 flex items-center justify-between text-xs font-medium text-accent uppercase tracking-wider"
            >
              <span>🧠 Visualize this</span>
              <span className="transition-transform" style={{ transform: passageExpanded ? 'rotate(180deg)' : '' }}>▼</span>
            </button>
            {passageExpanded && (
              <div className="px-5 pb-4">
                <p className="text-sm text-secondary leading-relaxed mb-4">{currentQuestion.passage}</p>
                {/* SVG Visualization matching this question exactly */}
                <VisualModel question={currentQuestion} />
              </div>
            )}
          </div>
        )}

        {/* Question */}
        <div className="bg-card border border-theme rounded-xl shadow-theme-sm p-5 mb-4">
          <p className="text-sm font-medium text-primary leading-relaxed">{currentQuestion.question_text}</p>
        </div>

        {/* Options */}
        <div className="grid grid-cols-1 gap-3 mb-6">
          {Object.entries(safeOptions).map(([key, value]) => {
            const optValue = value as string;
            let borderColor = 'border-theme bg-card';
            let textColor = 'text-primary';
            let ring = '';
            let icon = key;

            if (isResult) {
              if (key === result?.correct_option) {
                borderColor = 'border-success bg-success/10';
                textColor = 'text-success font-medium';
                ring = 'ring-1 ring-success/50';
                icon = '✓ ' + key;
              } else if (key === selected && !isCorrect) {
                borderColor = 'border-danger bg-danger/10';
                textColor = 'text-danger';
                ring = 'ring-1 ring-danger/50';
                icon = '✗ ' + key;
              } else {
                borderColor = 'border-theme bg-card opacity-50';
                textColor = 'text-muted';
                icon = key;
              }
            } else {
              if (key === selected) {
                borderColor = 'border-accent bg-accent/5';
                textColor = 'text-accent font-medium';
                ring = 'ring-1 ring-accent/50';
              }
            }

            return (
              <button
                key={key}
                onClick={() => !isResult && setSelected(key)}
                disabled={isResult}
                className={`flex items-center gap-3 border rounded-xl px-4 py-3 text-sm transition ${borderColor} ${ring} ${isResult || isResult ? '' : 'hover:bg-elevated hover:border-accent/30'} ${isResult ? '' : 'cursor-pointer'}`}
              >
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  isResult && key === result?.correct_option ? 'bg-success text-white' :
                  isResult && key === selected && !isCorrect ? 'bg-danger text-white' :
                  key === selected ? 'bg-accent text-white' : 'bg-elevated text-secondary'
                }`}>{icon}</span>
                <span className={`flex-1 text-left ${textColor}`}>{optValue}</span>
              </button>
            );
          })}
        </div>

        {/* Submit button */}
        {!isResult && (
          <button
            onClick={submitAnswer}
            disabled={!selected || answering}
            className="w-full py-3.5 rounded-xl text-sm font-semibold bg-gradient-accent text-white hover:bg-accent-hover transition disabled:opacity-40 disabled:cursor-not-allowed shadow-theme-sm"
          >
            {answering ? 'Submitting...' : selected ? 'Check Answer ✓' : 'Select an option first'}
          </button>
        )}

        {/* Result & explanation */}
        {isResult && (
          <div className="space-y-4 mt-4">
            <div className={`rounded-xl p-4 border ${
              isCorrect ? 'bg-success/10 border-success/50' : 'bg-danger/10 border-danger/50'
            }`}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{isCorrect ? '✅' : '❌'}</span>
                <span className={`font-semibold text-sm ${isCorrect ? 'text-success' : 'text-danger'}`}>
                  {isCorrect ? 'Correct!' : 'Incorrect'}
                </span>
                <span className="text-[10px] text-muted ml-auto">⏱ {formatTime(elapsedSeconds)}</span>
              </div>
              <ExplanationBlock explanation={result?.explanation} compact />
            </div>

            <div className="flex justify-between gap-3">
              <button
                onClick={() => setShowExplanation(!showExplanation)}
                className="px-5 py-2.5 rounded-xl text-xs font-medium bg-card border border-theme text-secondary hover:bg-elevated transition"
              >
                {showExplanation ? '🙈 Hide Tips' : '💡 Visual Tip'}
              </button>
              <button
                onClick={nextQuestion}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-gradient-accent text-white hover:bg-accent-hover transition shadow-sm"
              >
                {currentIndex + 1 < questions.length ? 'Next Question →' : '📊 See Results'}
              </button>
            </div>
          </div>
        )}

        {/* Back navigation */}
        <div className="flex items-center justify-between mt-8 pt-4 border-t border-theme">
          <button onClick={backToSelect} className="text-xs text-secondary hover:text-primary transition flex items-center gap-1">
            ← Back to topics
          </button>
          <Link href="/student/analytics?tab=quant_foundations" className="text-xs text-accent hover:text-accent/80 transition">
            📊 Analytics
          </Link>
        </div>
      </main>
    </div>
  );
}
