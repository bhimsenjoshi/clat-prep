1|'use client';
2|
3|import { useState, useRef, useEffect } from 'react';
4|import { useRouter } from 'next/navigation';
5|import Link from 'next/link';
6|
7|const SECTIONS = [
8|  { id: 'English', label: 'English', icon: '📖', color: 'indigo' },
9|  { id: 'Current Affairs', label: 'Current Affairs', icon: '📰', color: 'emerald' },
10|  { id: 'Legal Reasoning', label: 'Legal Reasoning', icon: '⚖️', color: 'amber' },
11|  { id: 'Logical Reasoning', label: 'Logical Reasoning', icon: '🧠', color: 'purple' },
12|  { id: 'Quantitative Techniques', label: 'Quantitative Techniques', icon: '📊', color: 'rose' },
13|] as const;
14|
15|interface Question {
16|  id: string;
17|  section: string;
18|  topic: string;
19|  question_text: string;
20|  passage: string | null;
21|  options: Record<string, string>;
22|  difficulty: string;
23|  explanation?: string;
24|}
25|
26|interface AnswerResult {
27|  is_correct: boolean;
28|  correct_option: string;
29|  explanation: string;
30|  your_answer: string;
31|}
32|
33|export default function PracticeQuiz() {
34|  const router = useRouter();
35|  const [selectedSection, setSelectedSection] = useState<string | null>(null);
36|  const [sessionId, setSessionId] = useState<string | null>(null);
37|  const [question, setQuestion] = useState<Question | null>(null);
38|  const [questionIds, setQuestionIds] = useState<string[]>([]);
39|  const [remainingIds, setRemainingIds] = useState<string[] | null>(null);
40|  const [result, setResult] = useState<AnswerResult | null>(null);
41|  const [selectedOption, setSelectedOption] = useState<string | null>(null);
42|  const [dailyRemaining, setDailyRemaining] = useState<number | string>(10);
43|  const [loading, setLoading] = useState(false);
44|  const [started, setStarted] = useState(false);
45|  const [completed, setCompleted] = useState(false);
46|  const [sessionComplete, setSessionComplete] = useState(false);
47|  const [authCheckDone, setAuthCheckDone] = useState(false);
48|  const timerRef = useRef<number>(Date.now());
49|
50|  // Auth check
51|  useEffect(() => {
52|    fetch('/api/me').then(r => {
53|      if (!r.ok) router.push('/auth/login');
54|      else setAuthCheckDone(true);
55|    });
56|  }, [router]);
57|
58|  const startQuiz = async (section: string) => {
59|    setLoading(true);
60|    setSelectedSection(section);
61|    setResult(null);
62|    setSelectedOption(null);
63|    setSessionComplete(false);
64|    setCompleted(false);
65|    timerRef.current = Date.now();
66|
67|    try {
68|      const res = await fetch('/api/quiz/start', {
69|        method: 'POST',
70|        headers: { 'Content-Type': 'application/json' },
71|        body: JSON.stringify({ section }),
72|      });
73|
74|      const data = await res.json();
75|
76|      if (!res.ok) {
77|        if (data.code === 'DAILY_LIMIT_REACHED') {
78|          alert(data.message);
79|          setLoading(false);
80|          setSelectedSection(null);
81|          return;
82|        }
83|        throw new Error(data.error || 'Failed to start');
84|      }
85|
86|      if (data.needs_seeding) {
87|        alert('No questions available for this section yet. Questions are being generated daily!');
88|        setLoading(false);
89|        setSelectedSection(null);
90|        return;
91|      }
92|
93|      setSessionId(data.session_id);
94|      setQuestion(data.question);
95|      setQuestionIds(data.question_ids || []);
96|      setRemainingIds((data.question_ids || []).filter((id: string) => id !== data.question?.id));
97|      setDailyRemaining(data.daily_remaining);
98|      setStarted(true);
99|    } catch (err) {
100|      console.error('Start error:', err);
101|      alert('Failed to start quiz. Please try again.');
102|      setSelectedSection(null);
103|    }
104|    setLoading(false);
105|  };
106|
107|  const answerQuestion = async (option: string) => {
108|    if (!question || !sessionId || selectedOption) return; // Already answered
109|
110|    setSelectedOption(option);
111|    const timeTaken = Math.round((Date.now() - timerRef.current) / 1000);
112|
113|    try {
114|      const res = await fetch('/api/quiz/respond', {
115|        method: 'POST',
116|        headers: { 'Content-Type': 'application/json' },
117|        body: JSON.stringify({
118|          session_id: sessionId,
119|          question_id: question.id,
120|          selected_option: option,
121|          time_taken_seconds: timeTaken,
122|          remaining_ids: remainingIds,
123|        }),
124|      });
125|
126|      const data = await res.json();
127|
128|      if (!res.ok) throw new Error(data.error || 'Failed to submit answer');
129|
130|      setResult(data.result);
131|
132|      if (data.next_question) {
133|        // Pre-load next question data for instant transition
134|        setQuestion(data.next_question);
135|        setRemainingIds(data.remaining_ids);
136|      } else {
137|        setSessionComplete(true);
138|      }
139|    } catch (err) {
140|      console.error('Respond error:', err);
141|    }
142|  };
143|
144|  const nextQuestion = () => {
145|    setResult(null);
146|    setSelectedOption(null);
147|    timerRef.current = Date.now();
148|  };
149|
150|  const endSession = () => {
151|    setCompleted(true);
152|  };
153|
154|  const startNew = () => {
155|    setStarted(false);
156|    setCompleted(false);
157|    setSelectedSection(null);
158|    setSessionId(null);
159|    setQuestion(null);
160|    setResult(null);
161|    setSelectedOption(null);
162|    setSessionComplete(false);
163|  };
164|
165|  if (!authCheckDone) {
166|    return (
167|      <div className="min-h-screen flex items-center justify-center bg-gray-950">
168|        <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full" />
169|      </div>
170|    );
171|  }
172|
173|  // ── Section Selector ──
174|  if (!started) {
175|    return (
176|      <div className="min-h-screen bg-gray-950 text-white">
177|        <div className="max-w-2xl mx-auto px-4 py-12">
178|          <h1 className="text-2xl font-bold mb-2">📝 Practice Quiz</h1>
179|          <p className="text-gray-400 text-sm mb-8">
180|            Pick a section to practice. Instant feedback on every answer.
181|            {typeof dailyRemaining === 'number' && (
182|              <span className="ml-2 text-indigo-400">({dailyRemaining} free questions remaining today)</span>
183|            )}
184|          </p>
185|          <div className="grid gap-3">
186|            {SECTIONS.map(s => (
187|              <button
188|                key={s.id}
189|                onClick={() => startQuiz(s.id)}
190|                disabled={loading}
191|                className={`flex items-center gap-4 p-4 rounded-xl border border-gray-800 bg-gray-900 hover:border-indigo-500 hover:bg-gray-800/50 transition disabled:opacity-50 text-left`}
192|              >
193|                <span className="text-2xl">{s.icon}</span>
194|                <div>
195|                  <p className="font-medium">{s.label}</p>
196|                  <p className="text-xs text-gray-500">Practice {s.label.toLowerCase()} questions</p>
197|                </div>
198|                {loading && selectedSection === s.id ? (
199|                  <span className="ml-auto animate-spin w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full" />
200|                ) : (
201|                  <span className="ml-auto text-gray-600">→</span>
202|                )}
203|              </button>
204|            ))}
205|          </div>
206|          <Link href="/student/dashboard" className="block text-center text-sm text-gray-500 mt-8 hover:text-gray-300 transition">
207|            ← Back to Dashboard
208|          </Link>
209|        </div>
210|      </div>
211|    );
212|  }
213|
214|  // ── Completed Screen ──
215|  if (completed) {
216|    const correctAnswers = questionIds.length - (remainingIds?.length ?? 0);
217|    return (
218|      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
219|        <div className="text-center max-w-md px-4">
220|          <p className="text-5xl mb-4">🎉</p>
221|          <h2 className="text-2xl font-bold mb-2">Session Complete!</h2>
222|          <p className="text-gray-400 mb-6">
223|            You answered questions across all available questions in this section.
224|          </p>
225|          <div className="flex gap-3 justify-center">
226|            <button onClick={startNew} className="bg-indigo-600 px-6 py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition">
227|              🔄 Practice Again
228|            </button>
229|            <Link href="/student/dashboard" className="border border-gray-700 px-6 py-2.5 rounded-xl font-medium hover:bg-gray-800 transition">
230|              📊 Dashboard
231|            </Link>
232|          </div>
233|        </div>
234|      </div>
235|    );
236|  }
237|
238|  return (
239|    <div className="min-h-screen bg-gray-950 text-white">
240|      {/* Top bar */}
241|      <div className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-10">
242|        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
243|          <button onClick={startNew} className="text-gray-400 hover:text-white transition text-sm">
244|            ← {SECTIONS.find(s => s.id === selectedSection)?.icon} {selectedSection}
245|          </button>
246|          <span className="text-xs text-gray-500">
247|            {typeof dailyRemaining === 'number' ? `${dailyRemaining} free today` : '♾️ Unlimited'}
248|          </span>
249|        </div>
250|      </div>
251|
252|      <div className="max-w-3xl mx-auto px-4 py-6">
253|        {/* Passage */}
254|        {question?.passage && (
255|          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-4">
256|            <p className="text-xs text-indigo-400 uppercase tracking-wide font-medium mb-2">Passage</p>
257|            <p className="text-sm text-gray-300 leading-relaxed">{question.passage}</p>
258|          </div>
259|        )}
260|
261|        {/* Question */}
262|        {question && !result && (
263|          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-4">
264|            <div className="flex items-center justify-between mb-4">
265|              <span className="text-xs text-gray-500">
266|                {selectedSection}
267|                {question.difficulty && (
268|                  <span className={`ml-2 px-1.5 py-0.5 rounded text-[10px] ${
269|                    question.difficulty === 'hard' ? 'bg-red-900/50 text-red-400' :
270|                    question.difficulty === 'easy' ? 'bg-green-900/50 text-green-400' :
271|                    'bg-blue-900/50 text-blue-400'
272|                  }`}>
273|                    {question.difficulty}
274|                  </span>
275|                )}
276|              </span>
277|            </div>
278|            <p className="font-medium text-base mb-5 leading-relaxed">{question.question_text}</p>
279|            <div className="space-y-2">
280|              {Object.entries(question.options).map(([key, value]) => (
281|                <button
282|                  key={key}
283|                  onClick={() => answerQuestion(key)}
284|                  disabled={!!selectedOption}
285|                  className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition ${
286|                    selectedOption === key
287|                      ? 'border-indigo-500 bg-indigo-900/30 text-indigo-300 ring-1 ring-indigo-500'
288|                      : 'border-gray-800 hover:border-gray-600 hover:bg-gray-800/50'
289|                  } disabled:opacity-60`}
290|                >
291|                  <span className="font-semibold mr-3 text-gray-400">{key}.</span>
292|                  {value}
293|                </button>
294|              ))}
295|            </div>
296|          </div>
297|        )}
298|
299|        {/* Result / Feedback */}
300|        {result && (
301|          <div className={`border rounded-xl p-6 mb-4 ${
302|            result.is_correct
303|              ? 'bg-green-900/20 border-green-800'
304|              : 'bg-red-900/20 border-red-800'
305|          }`}>
306|            <div className="flex items-center gap-3 mb-3">
307|              <span className="text-2xl">{result.is_correct ? '✅' : '❌'}</span>
308|              <div>
309|                <p className="font-bold text-lg">
310|                  {result.is_correct ? 'Correct!' : 'Incorrect'}
311|                </p>
312|                <p className="text-xs text-gray-400">
313|                  Your answer: {result.your_answer} · Correct: {result.correct_option}
314|                </p>
315|              </div>
316|            </div>
317|            {result.explanation && (
318|              <div className="text-sm text-gray-300 leading-relaxed bg-gray-900/50 rounded-lg p-4 mt-2">
319|                <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">Explanation</p>
320|                <p>{result.explanation}</p>
321|              </div>
322|            )}
323|
324|            {/* Next / Done button */}
325|            <div className="mt-4">
326|              {sessionComplete ? (
327|                <button onClick={endSession} className="bg-indigo-600 px-6 py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition w-full">
328|                  📊 See Results
329|                </button>
330|              ) : (
331|                <button
332|                  onClick={nextQuestion}
333|                  className="bg-gray-800 hover:bg-gray-700 border border-gray-700 px-6 py-2.5 rounded-xl font-medium transition w-full"
334|                >
335|                  Next Question →
336|                </button>
337|              )}
338|            </div>
339|          </div>
340|        )}
341|
342|        {/* Loading state between questions */}
343|        {loading && !question && !result && (
344|          <div className="text-center py-12">
345|            <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full mx-auto mb-3" />
346|            <p className="text-sm text-gray-500">Loading next question...</p>
347|          </div>
348|        )}
349|      </div>
350|    </div>
351|  );
352|}
353|