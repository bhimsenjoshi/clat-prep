1|'use client';
2|
3|import { useEffect, useState, useMemo } from 'react';
4|import { createClient } from '@/lib/supabase/client';
5|import { useRouter } from 'next/navigation';
6|import Link from 'next/link';
7|import type { Profile } from '@/types';
8|
9|const SECTION_NAMES = [
10|  'English',
11|  'Current Affairs',
12|  'Legal Reasoning',
13|  'Logical Reasoning',
14|  'Quantitative Techniques',
15|] as const;
16|
17|interface AttemptWithMeta {
18|  id: string;
19|  test_id: string;
20|  test_title: string;
21|  attempt_number: number;
22|  started_at: string;
23|  submitted_at: string | null;
24|  total_score: number | null;
25|  section_scores: Record<string, number> | null;
26|  total_questions: number;
27|  answered_count: number;
28|  correct_count: number;
29|  total_time_seconds: number;
30|  section_time: Record<string, number>;
31|  section_totals: Record<string, number>;
32|}
33|
34|export default function StudentDashboard() {
35|  const [profile, setProfile] = useState<Profile | null>(null);
36|  const [attempts, setAttempts] = useState<AttemptWithMeta[]>([]);
37|  const [loading, setLoading] = useState(true);
38|  const router = useRouter();
39|  const supabase = createClient();
40|
41|  useEffect(() => {
42|    const loadDashboard = async () => {
43|      const { data: { user } } = await supabase.auth.getUser();
44|      if (!user) { router.push('/auth/login'); return; }
45|
46|      const { data: prof } = await supabase
47|        .from('profiles')
48|        .select('*')
49|        .eq('id', user.id)
50|        .single();
51|      setProfile(prof);
52|
53|      // Fetch all attempts with test info
54|      const { data: rawAttempts } = await supabase
55|        .from('attempts')
56|        .select('*, tests(title)')
57|        .eq('student_id', user.id)
58|        .order('started_at', { ascending: false });
59|
60|      if (!rawAttempts || rawAttempts.length === 0) {
61|        setLoading(false);
62|        return;
63|      }
64|
65|      // Enrich each attempt with response stats
66|      const enriched: AttemptWithMeta[] = [];
67|      for (const a of rawAttempts as any[]) {
68|        const { data: responses } = await supabase
69|          .from('responses')
70|          .select('*')
71|          .eq('attempt_id', a.id);
72|
73|        const respList = responses ?? [];
74|        const totalQuestions = respList.length;
75|        const answeredCount = respList.filter((r: any) => r.selected_option !== null).length;
76|        const correctCount = respList.filter((r: any) => r.is_correct === true).length;
77|        const totalTimeSeconds = respList.reduce((s: number, r: any) => s + (r.time_taken_seconds ?? 0), 0);
78|
79|        // Calculate time per section by fetching question -> section mapping
80|        const qIds = respList.map((r: any) => r.question_id);
81|        const sectionTime: Record<string, number> = {};
82|        let sectionTotals: Record<string, number> = {};
83|        if (qIds.length > 0) {
84|          const { data: questions } = await supabase
85|            .from('questions')
86|            .select('id, section_id')
87|            .in('id', qIds);
88|          const qToSection = new Map((questions ?? []).map((q: any) => [q.id, q.section_id]));
89|
90|          // Also fetch section names and total question counts per section
91|          const sectionIds = [...new Set((questions ?? []).map((q: any) => q.section_id))];
92|          const { data: secs } = await supabase
93|            .from('sections')
94|            .select('id, name')
95|            .in('id', sectionIds);
96|
97|          // Get actual question count per section for this test
98|          const { data: allTestQuestions } = await supabase
99|            .from('questions')
100|            .select('section_id', { count: 'exact' })
101|            .in('section_id', sectionIds);
102|
103|          const sectionNames = new Map((secs ?? []).map((s: any) => [s.id, s.name]));
104|          // Count questions per section from the fetched data
105|          const qCountBySection: Record<string, number> = {};
106|          for (const q of questions ?? []) {
107|            qCountBySection[q.section_id] = (qCountBySection[q.section_id] ?? 0) + 1;
108|          }
109|          // Get totals by fetching ALL questions for these sections (not just the answered ones)
110|          const { data: allQs } = await supabase
111|            .from('questions')
112|            .select('section_id')
113|            .in('section_id', sectionIds);
114|          for (const q of allQs ?? []) {
115|            const name = sectionNames.get(q.section_id) || q.section_id;
116|            sectionTotals[name] = (sectionTotals[name] ?? 0) + 1;
117|          }
118|
119|          for (const r of respList) {
120|            const secId = qToSection.get(r.question_id);
121|            const secName = secId ? (sectionNames.get(secId) || secId) : 'Unknown';
122|            sectionTime[secName] = (sectionTime[secName] ?? 0) + (r.time_taken_seconds ?? 0);
123|          }
124|        }
125|
126|        // Count attempts for this test
127|        const { count: attemptCount } = await supabase
128|          .from('attempts')
129|          .select('id', { count: 'exact', head: true })
130|          .eq('test_id', a.test_id)
131|          .eq('student_id', user.id);
132|
133|        enriched.push({
134|          id: a.id,
135|          test_id: a.test_id,
136|          test_title: a.tests?.title ?? 'Unknown Test',
137|          attempt_number: attemptCount ?? 1,
138|          started_at: a.started_at,
139|          submitted_at: a.submitted_at,
140|          total_score: a.total_score,
141|          section_scores: a.section_scores,
142|          total_questions: totalQuestions,
143|          answered_count: answeredCount,
144|          correct_count: correctCount,
145|          total_time_seconds: totalTimeSeconds,
146|          section_time: sectionTime,
147|          section_totals: sectionTotals,
148|        });
149|      }
150|
151|      setAttempts(enriched);
152|      setLoading(false);
153|    };
154|    loadDashboard();
155|  }, []);
156|
157|  // Stats
158|  const completed = attempts.filter((a) => a.submitted_at);
159|  const inProgress = attempts.filter((a) => !a.submitted_at);
160|  const avgScore = completed.length
161|    ? Math.round(completed.reduce((s, a) => s + (a.total_score ?? 0), 0) / completed.length)
162|    : 0;
163|  const bestScore = completed.length ? Math.max(...completed.map((a) => a.total_score ?? 0)) : 0;
164|
165|  // Unique tests
166|  const uniqueTests = useMemo(() => {
167|    const seen = new Set<string>();
168|    return attempts.filter((a) => {
169|      if (seen.has(a.test_id)) return false;
170|      seen.add(a.test_id);
171|      return true;
172|    });
173|  }, [attempts]);
174|
175|  const formatTime = (seconds: number) => {
176|    const h = Math.floor(seconds / 3600);
177|    const m = Math.floor((seconds % 3600) / 60);
178|    const s = seconds % 60;
179|    if (h > 0) return `${h}h ${m}m`;
180|    if (m > 0) return `${m}m ${s}s`;
181|    return `${s}s`;
182|  };
183|
184|  if (loading) return (
185|    <div className="min-h-screen flex items-center justify-center bg-gray-50">
186|      <div className="animate-pulse flex flex-col items-center gap-3">
187|        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
188|        <p className="text-gray-500 text-sm">Loading dashboard...</p>
189|      </div>
190|    </div>
191|  );
192|
193|  return (
194|    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50/30">
195|      {/* Header */}
196|      <div className="bg-white border-b shadow-sm sticky top-0 z-10">
197|        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
198|          <div className="flex items-center gap-3">
199|            <span className="text-2xl">🎯</span>
200|            <div>
201|              <h1 className="text-xl font-bold text-gray-900">My Dashboard</h1>
202|              <p className="text-xs text-gray-500">
203|                Welcome{profile?.full_name ? `, ${profile.full_name}` : ''}
204|              </p>
205|            </div>
206|          </div>
207|          <div className="flex items-center gap-3">
208|            <Link href="/student/leaderboard"
209|              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition">
210|              🏆 Leaderboard
211|            </Link>
212|            <Link href="/student/practice"
213|              className="px-4 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700 transition shadow-sm">
214|              🎯 Practice
215|            </Link>
216|            <Link href="/student/tests"
217|              className="px-4 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 transition shadow-sm">
218|              + Available Tests
219|            </Link>
220|            <button onClick={() => supabase.auth.signOut().then(() => router.push('/'))}
221|              className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:bg-gray-100 transition">
222|              Sign Out
223|            </button>
224|          </div>
225|        </div>
226|      </div>
227|
228|      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
229|        {/* Stats cards */}
230|        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
231|          {[
232|            { label: 'Tests Completed', value: completed.length, icon: '✅', color: 'text-green-600' },
233|            { label: 'In Progress', value: inProgress.length, icon: '⏳', color: 'text-amber-600' },
234|            { label: 'Avg Score', value: `${avgScore}%`, icon: '📊', color: avgScore >= 70 ? 'text-green-600' : avgScore >= 40 ? 'text-amber-600' : 'text-red-600' },
235|            { label: 'Best Score', value: completed.length ? `${bestScore}%` : '-', icon: '🏆', color: 'text-indigo-600' },
236|            { label: 'Unique Tests', value: uniqueTests.length, icon: '📚', color: 'text-purple-600' },
237|          ].map((s) => (
238|            <div key={s.label} className="bg-white border rounded-xl p-4 shadow-sm hover:shadow transition">
239|              <div className="flex items-center justify-between mb-1">
240|                <span className="text-lg">{s.icon}</span>
241|                <span className={`text-2xl font-bold ${s.color}`}>{s.value}</span>
242|              </div>
243|              <p className="text-xs text-gray-500">{s.label}</p>
244|            </div>
245|          ))}
246|        </div>
247|
248|        {attempts.length === 0 ? (
249|          <div className="bg-white border-2 border-dashed border-gray-200 rounded-xl p-16 text-center">
250|            <div className="text-5xl mb-4">📭</div>
251|            <h2 className="text-xl font-bold text-gray-800 mb-2">No Test Attempts Yet</h2>
252|            <p className="text-gray-500 mb-6 max-w-md mx-auto">
253|              Start your CLAT preparation by taking your first practice test.
254|            </p>
255|            <Link href="/student/tests"
256|              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 transition shadow-sm">
257|              Browse Available Tests →
258|            </Link>
259|          </div>
260|        ) : (
261|          <>
262|            {/* Attempt history */}
263|            <div className="space-y-4">
264|              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
265|                <span>📋</span> Attempt History
266|                <span className="text-sm font-normal text-gray-400 ml-1">({attempts.length} total)</span>
267|              </h2>
268|
269|              {attempts.map((a) => {
270|                const isCompleted = !!a.submitted_at;
271|                const pct = a.total_score ?? 0;
272|                return (
273|                  <div key={a.id} className={`bg-white border rounded-xl shadow-sm hover:shadow transition overflow-hidden ${
274|                    !isCompleted ? 'ring-1 ring-amber-200' : ''
275|                  }`}>
276|                    {/* Header */}
277|                    <div className={`px-5 py-3 flex items-center justify-between border-b ${
278|                      isCompleted ? 'bg-gray-50' : 'bg-amber-50'
279|                    }`}>
280|                      <div className="flex items-center gap-3">
281|                        <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
282|                          isCompleted ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
283|                        }`}>
284|                          #{a.attempt_number}
285|                        </span>
286|                        <div>
287|                          <p className="font-semibold text-gray-900">{a.test_title}</p>
288|                          <p className="text-xs text-gray-500">
289|                            {new Date(a.started_at).toLocaleDateString('en-IN', {
290|                              day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
291|                            })}
292|                            {isCompleted && a.submitted_at && (
293|                              <>
294|                                <span className="mx-1.5">·</span>
295|                                Duration: {formatTime(
296|                                  Math.round((new Date(a.submitted_at).getTime() - new Date(a.started_at).getTime()) / 1000)
297|                                )}
298|                              </>
299|                            )}
300|                          </p>
301|                        </div>
302|                      </div>
303|                      <div className="flex items-center gap-3">
304|                        {isCompleted && (
305|                          <div className="text-right">
306|                            <p className={`text-xl font-bold ${
307|                              pct >= 70 ? 'text-green-600' : pct >= 40 ? 'text-amber-600' : 'text-red-600'
308|                            }`}>
309|                              {pct}%
310|                            </p>
311|                            <p className="text-[10px] text-gray-400">score</p>
312|                          </div>
313|                        )}
314|                        {!isCompleted && (
315|                          <span className="text-xs font-medium text-amber-700 bg-amber-100 px-2 py-1 rounded-full">
316|                            ⏳ In Progress
317|                          </span>
318|                        )}
319|                      </div>
320|                    </div>
321|
322|                    {/* Stats grid */}
323|                    <div className="px-5 py-4">
324|                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
325|                        <div className="bg-gray-50 rounded-lg p-3 text-center">
326|                          <p className="text-lg font-bold text-gray-800">{a.answered_count}</p>
327|                          <p className="text-[10px] text-gray-500">Attempted</p>
328|                          <p className="text-[10px] text-gray-400">of {a.total_questions} total</p>
329|                        </div>
330|                        <div className="bg-gray-50 rounded-lg p-3 text-center">
331|                          <p className="text-lg font-bold text-green-600">{a.correct_count}</p>
332|                          <p className="text-[10px] text-gray-500">Correct</p>
333|                          <p className="text-[10px] text-gray-400">
334|                            {a.answered_count > 0
335|                              ? `${Math.round((a.correct_count / a.answered_count) * 100)}% accuracy`
336|                              : '—'}
337|                          </p>
338|                        </div>
339|                        <div className="bg-gray-50 rounded-lg p-3 text-center">
340|                          <p className="text-lg font-bold text-amber-600">{a.answered_count - a.correct_count}</p>
341|                          <p className="text-[10px] text-gray-500">Incorrect</p>
342|                          <p className="text-[10px] text-gray-400">{a.total_questions > 0 ? `${a.total_questions - a.answered_count} unanswered` : ''}</p>
343|                        </div>
344|                        <div className="bg-gray-50 rounded-lg p-3 text-center">
345|                          <p className="text-lg font-bold text-indigo-600">{formatTime(a.total_time_seconds)}</p>
346|                          <p className="text-[10px] text-gray-500">Total Time</p>
347|                          <p className="text-[10px] text-gray-400">
348|                            {a.answered_count > 0
349|                              ? `${Math.round(a.total_time_seconds / a.answered_count)}s per question`
350|                              : '—'}
351|                          </p>
352|                        </div>
353|                      </div>
354|
355|                      {/* Section breakdown */}
356|                      {isCompleted && a.section_scores && (
357|                        <div className="mb-4">
358|                          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
359|                            Section Breakdown
360|                          </p>
361|                          <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
362|                            {SECTION_NAMES.map((name) => {
363|                              const correct = a.section_scores?.[name] ?? 0;
364|                              const total = a.section_totals[name] ?? Math.round(a.total_questions / 5);
365|                              const time = a.section_time[name] ?? 0;
366|                              return (
367|                                <div key={name} className="bg-white border border-gray-100 rounded-lg p-2.5">
368|                                  <p className="text-[10px] font-semibold text-gray-500 truncate">{name}</p>
369|                                  <p className="text-sm font-bold text-gray-800">{correct}<span className="text-xs font-normal text-gray-400">/{total}</span></p>
370|                                  <div className="flex items-center gap-1 mt-0.5">
371|                                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
372|                                      <div className={`h-full rounded-full ${
373|                                        total > 0 && (correct / total) >= 0.7 ? 'bg-green-500' :
374|                                        total > 0 && (correct / total) >= 0.4 ? 'bg-amber-500' : 'bg-red-500'
375|                                      }`} style={{ width: `${total > 0 ? (correct / total) * 100 : 0}%` }} />
376|                                    </div>
377|                                    <span className="text-[9px] text-gray-400">{time > 0 ? `${Math.round(time / 60)}m` : '-'}</span>
378|                                  </div>
379|                                </div>
380|                              );
381|                            })}
382|                          </div>
383|                        </div>
384|                      )}
385|
386|                      {/* Actions */}
387|                      <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
388|                        {isCompleted && (
389|                          <Link href={`/student/tests/${a.test_id}/review?attempt=${a.id}`}
390|                            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition">
391|                            📝 Review Paper
392|                          </Link>
393|                        )}
394|                        {isCompleted && (
395|                          <Link href={`/student/tests/${a.test_id}`}
396|                            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-green-50 text-green-700 hover:bg-green-100 transition">
397|                            🔄 Retake Test
398|                          </Link>
399|                        )}
400|                        {!isCompleted && (
401|                          <Link href={`/student/tests/${a.test_id}`}
402|                            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-50 text-amber-700 hover:bg-amber-100 transition">
403|                            ▶️ Resume Test
404|                          </Link>
405|                        )}
406|                        <span className="ml-auto text-[10px] text-gray-400">
407|                          Attempt #{a.attempt_number}
408|                        </span>
409|                      </div>
410|                    </div>
411|                  </div>
412|                );
413|              })}
414|            </div>
415|
416|            {/* Section-wise aggregate performance */}
417|            {completed.length > 0 && (
418|              <div className="bg-white border rounded-xl shadow-sm">
419|                <div className="px-6 py-4 border-b">
420|                  <h2 className="font-semibold text-gray-900 flex items-center gap-2">
421|                    <span>📈</span> Section Performance (across all attempts)
422|                  </h2>
423|                </div>
424|                <div className="p-6 space-y-4">
425|                  {(() => {
426|                    const sectionAggs = SECTION_NAMES.map((name) => {
427|                      const scores = completed
428|                        .map((a) => a.section_scores?.[name])
429|                        .filter((s): s is number => s !== undefined && s !== null);
430|                      const times = SECTION_NAMES.map((n) =>
431|                        completed.map((a) => a.section_time[n] ?? 0).reduce((s, t) => s + t, 0)
432|                      );
433|                      const totalTime = times.reduce((s, t) => s + t, 0);
434|                      const avg = scores.length ? Math.round(scores.reduce((s, c) => s + c, 0) / scores.length) : 0;
435|                      const max = scores.length ? Math.max(...scores) : 0;
436|                      const avgTime = scores.length
437|                        ? Math.round(completed
438|                            .map((a) => a.section_time[name] ?? 0)
439|                            .filter((t) => t > 0)
440|                            .reduce((s, t) => s + t, 0) / completed.filter((a) => (a.section_time[name] ?? 0) > 0).length)
441|                        : 0;
442|                      return { name, avg, max, count: scores.length, avgTime };
443|                    });
444|
445|                    const maxAvg = Math.max(...sectionAggs.map((s) => s.avg), 1);
446|
447|                    return sectionAggs.map((s) => {
448|                      // Get typical total for this section from latest attempt
449|                      const latestWithTotal = completed.find((a) => a.section_totals?.[s.name]);
450|                      const sectionTotal = latestWithTotal?.section_totals?.[s.name] ?? 10;
451|                      const pct = sectionTotal > 0 ? (s.avg / sectionTotal) * 100 : 0;
452|                      return (
453|                        <div key={s.name}>
454|                          <div className="flex items-center justify-between mb-1.5">
455|                            <span className="text-sm font-medium text-gray-800">{s.name}</span>
456|                            <div className="flex items-center gap-3 text-xs text-gray-500">
457|                              <span className="font-semibold text-indigo-600">{s.avg}<span className="text-gray-400 font-normal">/{sectionTotal} avg</span></span>
458|                              <span className="font-semibold text-green-600">{s.max}<span className="text-gray-400 font-normal"> max</span></span>
459|                              {s.avgTime > 0 && <span>{Math.round(s.avgTime / 60)}m avg</span>}
460|                            </div>
461|                          </div>
462|                          <div className="w-full bg-gray-100 rounded-full h-2.5">
463|                            <div
464|                              className={`h-2.5 rounded-full transition-all ${
465|                                pct >= 70 ? 'bg-green-500' : pct >= 40 ? 'bg-amber-500' : 'bg-red-500'
466|                              }`}
467|                              style={{ width: `${pct}%` }}
468|                            />
469|                          </div>
470|                        </div>
471|                      );
472|                    });
473|                  })()}
474|                </div>
475|              </div>
476|            )}
477|          </>
478|        )}
479|      </div>
480|    </div>
481|  );
482|}
483|
484|// ─── WhatsApp Card Component ───
485|
486|function WhatsAppCard({ supabase }: { supabase: any; userId?: string }) {
487|  const [phone, setPhone] = useState('');
488|  const [registered, setRegistered] = useState(false);
489|  const [loading, setLoading] = useState(true);
490|  const [saving, setSaving] = useState(false);
491|  const [status, setStatus] = useState<{ ok?: boolean; msg: string } | null>(null);
492|  const businessPhone = process.env.NEXT_PUBLIC_WHATSAPP_BUSINESS_PHONE ?? '';
493|
494|  useEffect(() => {
495|    const check = async () => {
496|      try {
497|        const res = await fetch('/api/whatsapp/register');
498|        if (!res.ok) { setLoading(false); return; }
499|        const data = await res.json();
500|        if (data.registered) {
501|