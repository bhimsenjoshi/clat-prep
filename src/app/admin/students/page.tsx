import { createServerSupabaseClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function AdminStudentsPage() {
  const supabase = await createServerSupabaseClient();

  // All students with their stats
  const { data: students } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'student')
    .order('created_at', { ascending: false });

  // For each student, get their attempt stats
  const studentStats = await Promise.all(
    (students ?? []).map(async (student) => {
      const { data: attempts } = await supabase
        .from('attempts')
        .select('total_score, submitted_at, test_id')
        .eq('student_id', student.id)
        .not('submitted_at', 'is', null)
        .order('started_at', { ascending: false });

      const completed = attempts ?? [];
      const avgScore = completed.length
        ? Math.round(completed.reduce((s, a) => s + (a.total_score ?? 0), 0) / completed.length)
        : 0;
      const bestScore = completed.length ? Math.max(...completed.map((a) => a.total_score ?? 0)) : 0;

      return {
        ...student,
        testsTaken: completed.length,
        avgScore,
        bestScore,
      };
    })
  );

  // Overall stats
  const totalAttempts = studentStats.reduce((s, st) => s + st.testsTaken, 0);
  const overallAvg = studentStats.filter((s) => s.testsTaken > 0).length
    ? Math.round(studentStats.filter((s) => s.testsTaken > 0).reduce((s, st) => s + st.avgScore, 0) / studentStats.filter((s) => s.testsTaken > 0).length)
    : 0;

  // Per-section difficulty analysis
  const { data: allAttempts } = await supabase
    .from('attempts')
    .select('section_scores, test_id')
    .not('submitted_at', 'is', null);

  const sectionNames = [
    'English',
    'Current Affairs',
    'Legal Reasoning',
    'Logical Reasoning',
    'Quantitative Techniques',
  ];

  const sectionTotals: Record<string, { correct: number; count: number }> = {};
  sectionNames.forEach((n) => { sectionTotals[n] = { correct: 0, count: 0 }; });

  (allAttempts ?? []).forEach((a: any) => {
    if (a.section_scores) {
      sectionNames.forEach((n) => {
        const score = a.section_scores[n];
        if (score !== undefined && score !== null) {
          sectionTotals[n].correct += score;
          sectionTotals[n].count += 1;
        }
      });
    }
  });

  const sectionAvg = sectionNames.map((name) => ({
    name,
    avgScore: sectionTotals[name].count
      ? Math.round((sectionTotals[name].correct / sectionTotals[name].count) * 10)
      : 0,
  }));

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Student Analytics</h1>
        <Link href="/admin/dashboard" className="text-sm text-indigo-600 hover:underline">
          ← Dashboard
        </Link>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Students', value: students?.length ?? 0 },
          { label: 'Total Tests Taken', value: totalAttempts },
          { label: 'Overall Avg Score', value: `${overallAvg}%` },
          { label: 'Active Students', value: studentStats.filter(s => s.testsTaken > 0).length },
        ].map((s) => (
          <div key={s.label} className="bg-white border rounded-xl p-4 shadow-sm">
            <p className="text-2xl font-bold text-indigo-600">{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Section difficulty */}
      <div className="bg-white border rounded-xl shadow-sm mb-8">
        <div className="px-6 py-4 border-b">
          <h2 className="font-semibold">Section-Wise Average (out of 10)</h2>
        </div>
        <div className="p-6 grid grid-cols-5 gap-4">
          {sectionAvg.map((s) => (
            <div key={s.name} className="text-center">
              <p className="text-2xl font-bold text-indigo-600">{s.avgScore}/10</p>
              <p className="text-xs text-gray-500 mt-1">{s.name}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Student table */}
      <div className="bg-white border rounded-xl shadow-sm">
        <div className="px-6 py-4 border-b">
          <h2 className="font-semibold">All Students</h2>
        </div>
        {studentStats.length === 0 ? (
          <div className="p-6 text-center text-gray-400">No students registered.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="text-left px-6 py-3 font-medium">Name</th>
                  <th className="text-center px-4 py-3 font-medium">Joined</th>
                  <th className="text-center px-4 py-3 font-medium">Tests Taken</th>
                  <th className="text-center px-4 py-3 font-medium">Avg Score</th>
                  <th className="text-center px-4 py-3 font-medium">Best Score</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {studentStats.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 font-medium">{s.full_name || '—'}</td>
                    <td className="px-4 py-3 text-center text-gray-500">
                      {new Date(s.created_at).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-4 py-3 text-center">{s.testsTaken}</td>
                    <td className={`px-4 py-3 text-center font-medium ${
                      s.avgScore >= 70 ? 'text-green-600' : s.avgScore >= 40 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {s.testsTaken > 0 ? `${s.avgScore}%` : '—'}
                    </td>
                    <td className="px-4 py-3 text-center font-medium text-indigo-600">
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
