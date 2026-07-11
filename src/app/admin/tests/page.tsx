'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PageHeader from '@/components/PageHeader';

type TestRow = {
  id: string;
  title: string;
  status: string;
  created_at: string;
  published_at: string | null;
};

export default function AdminTestsPage() {
  const [tests, setTests] = useState<TestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const supabase = createClient();

  const loadTests = async () => {
    const { data } = await supabase
      .from('tests')
      .select('*')
      .order('created_at', { ascending: false });
    setTests(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    loadTests();
  }, []);

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    setCreating(true);
    setError('');

    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr || !user) {
      setError('Not authenticated. Try signing out and back in.');
      setCreating(false);
      return;
    }

    const { data: test, error: testErr } = await supabase
      .from('tests')
      .insert({ title: newTitle, created_by: user.id })
      .select()
      .single();

    if (testErr || !test) {
      setError(`Failed to create test: ${testErr?.message || 'Unknown error'}`);
      setCreating(false);
      return;
    }

    // Create 5 empty sections
    const sectionNames = [
      'English',
      'Current Affairs',
      'Legal Reasoning',
      'Logical Reasoning',
      'Quantitative Techniques',
    ];
    const sections = sectionNames.map((name, i) => ({
      test_id: test.id,
      name,
      order_index: i,
    }));
    const { error: secErr } = await supabase.from('sections').insert(sections);
    if (secErr) {
      setError(`Test created but sections failed: ${secErr.message}`);
    }

    setNewTitle('');
    setCreating(false);
    loadTests();
  };

  const handlePublish = async (id: string) => {
    await supabase
      .from('tests')
      .update({ status: 'published', published_at: new Date().toISOString() })
      .eq('id', id);
    loadTests();
  };

  const handleArchive = async (id: string) => {
    await supabase.from('tests').update({ status: 'archived' }).eq('id', id);
    loadTests();
  };

  if (loading) return <div className="p-8 text-center text-secondary">Loading...</div>;

  return (
    <div className="min-h-screen bg-page text-primary">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <PageHeader title='Manage Tests' isAdmin navItems={[{href:'/admin/dashboard',label:'Dashboard',icon:'⚙️'}]} />

        {/* Create test */}
        <div className="bg-card border border-theme rounded-xl p-5 mb-6 shadow-theme-sm">
          <h2 className="font-semibold text-primary mb-3">Create New Test</h2>
          <div className="flex gap-3">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Test title (e.g., Mock Test #1)"
              className="flex-1 border border-theme rounded-lg px-3 py-2 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <button
              onClick={handleCreate}
              disabled={creating || !newTitle.trim()}
              className="bg-accent text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-accent-hover disabled:opacity-50 transition"
            >
              {creating ? 'Creating...' : 'Create'}
            </button>
          </div>
          {error && <p className="text-danger text-sm mt-3">{error}</p>}
        </div>

        {/* Test list */}
        <div className="bg-card border border-theme rounded-xl shadow-theme-sm">
          <div className="px-6 py-4 border-b border-theme">
            <h2 className="font-semibold text-primary">All Tests</h2>
          </div>
          {tests.length === 0 ? (
            <div className="p-6 text-center text-muted">No tests created yet.</div>
          ) : (
            <div className="divide-y divide-theme">
              {tests.map((test) => (
                <div key={test.id} className="px-6 py-4 flex items-center justify-between hover:bg-elevated transition">
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                        test.status === 'published'
                          ? 'bg-tint-success text-success'
                          : test.status === 'draft'
                          ? 'bg-tint-warning text-warning'
                          : 'bg-elevated text-secondary'
                      }`}
                    >
                      {test.status}
                    </span>
                    <div>
                      <p className="font-medium text-primary">{test.title}</p>
                      <p className="text-xs text-secondary">
                        {new Date(test.created_at).toLocaleDateString('en-IN')}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={`/admin/tests/${test.id}`}
                      className="border border-theme px-3 py-1.5 rounded-lg text-xs font-medium text-primary hover:bg-elevated transition"
                    >
                      Edit
                    </Link>
                    {test.status === 'draft' && (
                      <button
                        onClick={() => handlePublish(test.id)}
                        className="bg-success text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-success-hover transition"
                      >
                        Publish
                      </button>
                    )}
                    {test.status !== 'archived' && (
                      <button
                        onClick={() => handleArchive(test.id)}
                        className="border border-theme px-3 py-1.5 rounded-lg text-xs text-danger hover:bg-tint-danger transition"
                      >
                        Archive
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
