import { cookies } from 'next/headers';
import Link from 'next/link';

const SECTION_NAMES = [
  'English',
  'Current Affairs',
  'Legal Reasoning',
  'Logical Reasoning',
  'Quantitative Techniques',
];

/** Raw Supabase REST API call using service_role key */
async function supabaseQuery(path: string) {
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL!}/rest/v1/${path}`;
  const res = await fetch(url, {
    headers: {
      'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
      'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });
  if (!res.ok) {
    console.error(`Supabase query failed (${res.status}): ${path}`);
    return [];
  }
  return res.json();
}

export default async function AdminStudentsPage() {
  // Fetch all profiles directly via REST API
  const students: any[] = await supabaseQuery('profiles?select=*&order=created_at.desc&limit=100');

  // For each student, get their attempt stats
  const studentStats = await Promise.all(
    students.map(async (student: any) => {
      const attempts: any[] = await supabaseQuery(
        `attempts?select=total_score,submitted_at,test_id&student_id=eq.${student.id}&submitted_at=not.is.null&order=started_at.desc`
      );

      const completed = attempts ?? [];
      const avgScore = completed.length
        ? Math.round(completed.reduce((s: number, a: any) => s + (a.total_score ?? 0), 0) / completed.length)
        : 0;
      const bestScore = completed.length ? Math.max(...completed.map((a: any) => a.total_score ?? 0)) : 0;

      return { ...student, testsTaken: completed.length, avgScore, bestScore };
    })
  );

  const totalAttempts = studentStats.reduce((s, st) => s + st.testsTaken, 0);
  const activeStudents = studentStats.filter((s) => s.testsTaken > 0);
  const overallAvg = activeStudents.length
    ? Math.round(activeStudents.reduce((s, st) => s + st.avgScore, 0) / activeStudents.length)
    : 0;

  // Per-section analysis
  const allAttempts: any[] = await supabaseQuery(
    'attempts?select=section_scores&submitted_at=not.is.null'
  );

  const sectionTotals: Record<string, { correct: number; count: number }> = {};
  SECTION_NAMES.forEach((n) => { sectionTotals[n] = { correct: 0, count: 0 }; });

  allAttempts.forEach((a: any) => {
    if (a.section_scores) {
      SECTION_NAMES.forEach((n) => {
        const score = a.section_scores[n];
        if (score !== undefined && score !== null) {
          sectionTotals[n].correct += score;
          sectionTotals[n].count += 1;
        }
      });
    }
  });

  const sectionAvg = SECTION_NAMES.map((name) => ({
    name,
    avgScore: sectionTotals[name].count
      ? Math.round((sectionTotals[name].correct / sectionTotals[name].count) * 10)
      : 0,
  }));

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Student Analytics</h1>
        <Link href="/admin/dashboard" className="text-sm text-accent hover:underline">← Dashboard</Link>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Users', value: students?.length ?? 0 },
          { label: 'Tests Taken', value: totalAttempts },
          { label: 'Avg Score', value: `${overallAvg}%` },
          { label: 'Active Users', value: activeStudents.length },
        ].map((s) => (
          <div key={s.label} className="bg-card border border-theme rounded-xl p-4 shadow-theme-sm">
            <p className="text-2xl font-bold text-accent">{s.value}</p>
            <p className="text-xs text-secondary mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-card border border-theme shadow-theme-sm mb-8">
        <div className="px-6 py-4 border-b border-theme">
          <h2 className="font-semibold text-primary">Section-Wise Average Scores</h2>
        </div>
        <div className="p-6 grid grid-cols-5 gap-4">
          {sectionAvg.map((s) => (
            <div key={s.name} className="text-center">
              <p className="text-2xl font-bold text-accent">{s.avgScore}/10</p>
              <p className="text-xs text-secondary mt-1">{s.name}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-card border border-theme shadow-theme-sm">
        <div className="px-6 py-4 border-b border-theme">
          <h2 className="font-semibold text-primary">All Users</h2>
        </div>
        {studentStats.length === 0 ? (
          <div className="p-6 text-center text-muted">No users registered.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-elevated text-secondary">
                <tr>
                  <th className="text-left px-6 py-3 font-medium">Name</th>
                  <th className="text-center px-4 py-3 font-medium">Role</th>
                  <th className="text-center px-4 py-3 font-medium">Tests</th>
                  <th className="text-center px-4 py-3 font-medium">Avg</th>
                  <th className="text-center px-4 py-3 font-medium">Best</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {studentStats.map((s: any) => (
                  <tr key={s.id} className="hover:bg-elevated">
                    <td className="px-6 py-3 font-medium">{s.full_name || '—'}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        s.role === 'admin' ? 'bg-tint-indigo text-accent' : 'bg-elevated text-secondary'
                      }`}>{s.role}</span>
                    </td>
                    <td className="px-4 py-3 text-center">{s.testsTaken}</td>
                    <td className={`px-4 py-3 text-center font-medium ${
                      s.testsTaken > 0 ? (s.avgScore >= 70 ? 'text-stat-green' : s.avgScore >= 40 ? 'text-stat-amber' : 'text-danger') : ''
                    }`}>{s.testsTaken > 0 ? `${s.avgScore}%` : '—'}</td>
                    <td className="px-4 py-3 text-center font-medium text-accent">
                      {s.testsTaken > 0 ? `${s.bestScore}%` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
