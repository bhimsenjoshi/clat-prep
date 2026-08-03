'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import PageHeader from '@/components/PageHeader';
import StudentTable from '@/components/admin/StudentTable';

const SECTION_NAMES = [
  'English',
  'Current Affairs',
  'Legal Reasoning',
  'Logical Reasoning',
  'Quantitative Techniques',
];

export default function AdminStudentsPage() {
  const supabase = createClient();

  const [students, setStudents] = useState<any[]>([]);
  const [studentStats, setStudentStats] = useState<any[]>([]);
  const [sectionAvg, setSectionAvg] = useState<{ name: string; avgScore: number }[]>([]);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [activeStudentsCount, setActiveStudentsCount] = useState(0);
  const [overallAvg, setOverallAvg] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      const studentsData = profiles ?? [];
      setStudents(studentsData);

      // For each student, get their attempt stats — ONE batched query
      const studentIds = studentsData.map((s: any) => s.id);
      const { data: allAttemptsForStats } = studentIds.length
        ? await supabase
            .from('attempts')
            .select('student_id,total_score,submitted_at,test_id')
            .in('student_id', studentIds)
            .not('submitted_at', 'is', null)
            .order('started_at', { ascending: false })
        : { data: [] };

      const attemptsByStudent = new Map<string, any[]>();
      (allAttemptsForStats ?? []).forEach((a: any) => {
        const list = attemptsByStudent.get(a.student_id) ?? [];
        list.push(a);
        attemptsByStudent.set(a.student_id, list);
      });

      const stats = studentsData.map((student: any) => {
        const completed = attemptsByStudent.get(student.id) ?? [];
        const avgScore = completed.length
          ? Math.round(completed.reduce((s: number, a: any) => s + (a.total_score ?? 0), 0) / completed.length)
          : 0;
        const bestScore = completed.length ? Math.max(...completed.map((a: any) => a.total_score ?? 0)) : 0;
        return { ...student, testsTaken: completed.length, avgScore, bestScore };
      });
      setStudentStats(stats);

      const total = stats.reduce((s, st) => s + st.testsTaken, 0);
      setTotalAttempts(total);

      const active = stats.filter((s) => s.testsTaken > 0);
      setActiveStudentsCount(active.length);

      setOverallAvg(active.length
        ? Math.round(active.reduce((s, st) => s + st.avgScore, 0) / active.length)
        : 0
      );

      // Per-section analysis
      const { data: allAttempts } = await supabase
        .from('attempts')
        .select('section_scores')
        .not('submitted_at', 'is', null);

      const sectionTotals: Record<string, { correct: number; count: number }> = {};
      SECTION_NAMES.forEach((n) => { sectionTotals[n] = { correct: 0, count: 0 }; });

      (allAttempts ?? []).forEach((a: any) => {
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

      setSectionAvg(
        SECTION_NAMES.map((name) => ({
          name,
          avgScore: sectionTotals[name].count
            ? Math.round((sectionTotals[name].correct / sectionTotals[name].count) * 10)
            : 0,
        }))
      );

      setLoading(false);
    };

    fetchData();
  }, [supabase]);

  if (loading) return <div className="p-8 text-center text-secondary">Loading...</div>;

  return (
    <div className="min-h-screen bg-page text-primary">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <PageHeader title='Students' isAdmin navItems={[{href:'/admin/dashboard',label:'Dashboard',icon:'⚙️'}]} />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Users', value: students?.length ?? 0, color: 'text-accent' },
            { label: 'Tests Taken', value: totalAttempts, color: 'text-info' },
            { label: 'Avg Score', value: `${overallAvg}%`, color: 'text-success' },
            { label: 'Active Users', value: activeStudentsCount, color: 'text-warning' },
          ].map((s) => (
            <div key={s.label} className="bg-card border border-theme rounded-xl p-4 text-center shadow-theme-sm">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-secondary mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="bg-card border border-theme shadow-theme-sm mb-8">
          <div className="px-6 py-4 border-b border-theme">
            <h2 className="font-semibold text-primary">Section-Wise Average Scores</h2>
          </div>
          <div className="p-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {sectionAvg.map((s) => (
              <div key={s.name} className="text-center">
                <p className="text-2xl font-bold text-accent">{s.avgScore}/10</p>
                <p className="text-xs text-secondary mt-1">{s.name}</p>
              </div>
            ))}
          </div>
        </div>

        <StudentTable initialStudents={studentStats} />
      </div>
    </div>
  );
}
