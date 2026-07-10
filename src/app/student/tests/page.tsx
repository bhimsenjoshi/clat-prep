import { createServerSupabaseClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function StudentTestsPage() {
  const supabase = await createServerSupabaseClient();

  const { data: tests } = await supabase
    .from('tests')
    .select('id, title, published_at, created_at')
    .eq('status', 'published')
    .order('published_at', { ascending: false, nullsFirst: false });

  // Check which tests the user has already attempted
  const { data: { user } } = await supabase.auth.getUser();
  const { data: attempts } = user
    ? await supabase
        .from('attempts')
        .select('test_id, submitted_at')
        .eq('student_id', user.id)
    : { data: [] };

  const attemptedMap = new Map(
    (attempts ?? []).map((a) => [a.test_id, a.submitted_at !== null])
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Practice Tests</h1>
          <p className="text-sm text-secondary mt-1">
            Select a test to begin. Each test covers all 5 CLAT sections.
          </p>
        </div>
        <Link
          href="/student/dashboard"
          className="text-sm text-accent hover:underline"
        >
          ← Dashboard
        </Link>
      </div>

      {!tests || tests.length === 0 ? (
        <div className="bg-card border border-theme rounded-xl p-10 text-center text-muted">
          <p>No tests available yet. Check back soon!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tests.map((test) => {
            const isAttempted = attemptedMap.get(test.id);
            return (
              <div
                key={test.id}
                className="bg-card border border-theme rounded-xl px-6 py-5 flex items-center justify-between shadow-theme-sm"
              >
                <div>
                  <h3 className="font-semibold">{test.title}</h3>
                  <p className="text-xs text-secondary mt-0.5">
                    Published{' '}
                    {test.published_at
                      ? new Date(test.published_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })
                      : '—'}
                  </p>
                </div>
                {isAttempted === true ? (
                  <span className="text-sm text-green-600 font-medium">Completed ✓</span>
                ) : (
                  <Link
                    href={`/student/tests/${test.id}`}
                    className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
                  >
                    {isAttempted === false ? 'Resume' : 'Start Test'}
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
