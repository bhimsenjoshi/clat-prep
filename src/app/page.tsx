import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Nav */}
      <header className="border-b bg-white">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-xl font-bold tracking-tight">CLAT Prep Hub</h1>
          <div className="flex gap-3 items-center">
            <Link href="/auth/login" className="text-sm font-medium text-gray-600 hover:text-gray-900">
              Login
            </Link>
            <Link
              href="/auth/signup"
              className="text-sm font-medium bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 max-w-5xl mx-auto px-4 pt-20 pb-16">
        <div className="text-center space-y-6">
          <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Master the{' '}
            <span className="text-indigo-600">CLAT</span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            AI-powered practice tests across all 5 CLAT sections. Track your progress,
            compete on the leaderboard, and sharpen your skills with regularly generated mock papers.
          </p>
          <div className="flex justify-center gap-4 pt-4">
            <Link
              href="/auth/signup"
              className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-indigo-700 transition text-lg"
            >
              Get Started
            </Link>
            <Link
              href="/auth/login"
              className="border px-8 py-3 rounded-lg font-medium hover:bg-gray-100 transition text-lg"
            >
              I have an account
            </Link>
          </div>
        </div>

        {/* Feature cards */}
        <div className="grid md:grid-cols-3 gap-6 mt-20">
          {[
            { title: 'AI-Generated Tests', desc: 'Fresh questions generated for every section using Gemini AI — never the same test twice.' },
            { title: 'Detailed Analytics', desc: 'Section-wise scores, accuracy trends, and time tracking across every attempt.' },
            { title: 'Leaderboard', desc: 'See how you stack up against other students per test and all-time.' },
          ].map((f) => (
            <div key={f.title} className="bg-white border rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-gray-600 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Section breakdown */}
        <div className="mt-20">
          <h3 className="text-2xl font-bold text-center mb-8">5 CLAT Sections Covered</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              'English Language',
              'Current Affairs / GK',
              'Legal Reasoning',
              'Logical Reasoning',
              'Quantitative Techniques',
            ].map((s) => (
              <div key={s} className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 text-center text-sm font-medium text-indigo-800">
                {s}
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white py-6 text-center text-sm text-gray-500">
        CLAT Prep Hub &mdash; Built for serious preparation.
      </footer>
    </div>
  );
}
