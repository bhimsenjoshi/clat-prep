'use client';

import { useState, useRef, useCallback } from 'react';

interface Props {
  initialUsername: string;
  initialSchool: string;
  initialClatYear: number;
}

export default function EditableFields({ initialUsername, initialSchool, initialClatYear }: Props) {
  const [editUsername, setEditUsername] = useState(initialUsername);
  const [editSchool, setEditSchool] = useState(initialSchool);
  const [editClatYear, setEditClatYear] = useState(initialClatYear);
  const [editing, setEditing] = useState<'username' | 'school' | 'clatYear' | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<{ valid: boolean; available: boolean; error: string | null } | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout>(undefined as any);

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

  return (
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
                onChange={(e) => {
                  const v = e.target.value.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
                  setEditUsername(v);
                  if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
                  debounceTimerRef.current = setTimeout(() => checkUsername(v), 300);
                }}
                className="flex-1 bg-elevated border border-theme text-primary rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="cool_clater"
                autoFocus
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px]">
                {checkingUsername ? <span className="text-muted">⏳</span>
                  : usernameStatus?.available && usernameStatus?.valid
                    ? <span className="text-green-400">✅</span>
                    : usernameStatus && !usernameStatus?.available
                      ? <span className="text-red-400">❌ {usernameStatus.error || 'Taken'}</span>
                      : null}
              </span>
              <button onClick={async () => {
                if (!usernameStatus?.valid || !usernameStatus?.available) return;
                setSavingEdit(true);
                const { createClient } = await import('@/lib/supabase/client');
                const supabase = createClient();
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) { setSavingEdit(false); return; }
                await supabase.from('profiles').update({ username: '@' + editUsername } as any).eq('id', user.id);
                setEditing(null);
                setSavingEdit(false);
              }} disabled={!usernameStatus?.available || savingEdit}
                className="text-[11px] font-medium px-3 py-1 rounded-lg bg-accent text-white hover:bg-accent-hover disabled:opacity-40 transition">
                Save
              </button>
              <button onClick={() => { setEditing(null); setUsernameStatus(null); setEditUsername(initialUsername); }}
                className="text-[11px] text-muted hover:text-secondary transition">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setEditing('username')}>
            <p className="text-sm text-primary">@{editUsername || '—'}</p>
            <span className="text-[10px] text-accent/0 group-hover:text-accent transition-colors">✏️ Change</span>
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
              <button onClick={async () => {
                setSavingEdit(true);
                const { createClient } = await import('@/lib/supabase/client');
                const supabase = createClient();
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) { setSavingEdit(false); return; }
                await supabase.from('profiles').update({ school: editSchool, clat_year: editClatYear } as any).eq('id', user.id);
                setEditing(null);
                setSavingEdit(false);
              }} disabled={savingEdit}
                className="text-[10px] font-medium px-2 py-1 rounded bg-accent text-white disabled:opacity-40">
                Save
              </button>
              <button onClick={() => { setEditing(null); setEditSchool(initialSchool); setEditClatYear(initialClatYear); }}
                className="text-[10px] text-muted hover:text-secondary">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <p className="text-sm text-primary">{editSchool || '—'}</p>
            <button onClick={() => setEditing('school')} className="text-[10px] text-accent hover:text-accent/70">Edit</button>
          </div>
        )}
      </div>
      {/* CLAT Year */}
      <div>
        <p className="text-xs font-medium text-muted uppercase tracking-wider mb-1">CLAT Year</p>
        <div className="flex gap-2 items-start">
          <select
            value={editClatYear}
            onChange={(e) => setEditClatYear(Number(e.target.value))}
            className="flex-1 bg-elevated border border-theme text-primary rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <option value={2027}>2027</option>
            <option value={2028}>2028</option>
            <option value={2029}>2029</option>
          </select>
          <button onClick={async () => {
            setSavingEdit(true);
            const { createClient } = await import('@/lib/supabase/client');
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { setSavingEdit(false); return; }
            await supabase.from('profiles').update({ clat_year: editClatYear } as any).eq('id', user.id);
            setSavingEdit(false);
          }} disabled={savingEdit}
            className="shrink-0 text-[10px] font-medium px-2 py-1.5 rounded bg-accent text-white disabled:opacity-40 hover:bg-accent-hover transition">
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
