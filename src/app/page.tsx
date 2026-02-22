import Link from 'next/link';
import { getTotalQuestionCount } from '@/lib/db/queries/questions';
import { getRecentSessions } from '@/lib/db/queries/sessions';
import { getTodayCards, getTodayReviewedCount } from '@/lib/db/queries/flashcards';
import { getTodayQuizSession } from '@/lib/db/queries/sessions';
import { todayString, daysUntilExam } from '@/lib/utils/date';
import { SeedButton } from '@/components/shared/SeedButton';
import { EmailButtons } from '@/components/shared/EmailButtons';
import { ensureMigrated } from '@/lib/db';

export const dynamic = 'force-dynamic';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

export default async function DashboardPage() {
  await ensureMigrated();
  const today = todayString();
  const [totalQuestions, recentSessions, todayCards, reviewedToday, todayQuiz] = await Promise.all([
    getTotalQuestionCount(),
    getRecentSessions(3),
    getTodayCards(today),
    getTodayReviewedCount(today),
    getTodayQuizSession(),
  ]);
  const days = daysUntilExam();
  const lastExam = recentSessions.find((s) => s.sessionType === 'exam');
  const seeded = totalQuestions > 0;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Good {getGreeting()}, Netra! 🧬
        </h1>
        <p className="text-gray-500 mt-1">
          {days} day{days === 1 ? '' : 's'} until the Canadian Biology Olympiad — April 9, 2026
        </p>
      </div>

      {!seeded && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-5">
          <p className="text-amber-800 font-semibold text-sm mb-2">Question bank is empty</p>
          <p className="text-amber-700 text-sm mb-3">
            Download past exam papers to populate the question bank. This will download NBC exam PDFs from the University of Toronto.
          </p>
          <SeedButton />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Link href="/flashcards" className="block">
          <div className="bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 hover:shadow-sm transition">
            <div className="text-2xl mb-2">📚</div>
            <h2 className="font-semibold text-gray-800 mb-1">Today&apos;s Flashcards</h2>
            {todayCards.length > 0 ? (
              <p className="text-sm text-gray-500">{reviewedToday} / {todayCards.length} reviewed</p>
            ) : (
              <p className="text-sm text-gray-400">Not yet generated</p>
            )}
            <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all"
                style={{ width: todayCards.length > 0 ? `${(reviewedToday / todayCards.length) * 100}%` : '0%' }}
              />
            </div>
          </div>
        </Link>

        <Link href="/quiz" className="block">
          <div className="bg-white rounded-xl border border-gray-200 p-5 hover:border-purple-300 hover:shadow-sm transition">
            <div className="text-2xl mb-2">🧪</div>
            <h2 className="font-semibold text-gray-800 mb-1">Daily Pop Quiz</h2>
            {todayQuiz ? (
              todayQuiz.completedAt ? (
                <p className="text-sm text-green-600 font-medium">Completed — {Math.round(todayQuiz.score ?? 0)}%</p>
              ) : (
                <p className="text-sm text-amber-600 font-medium">In progress</p>
              )
            ) : (
              <p className="text-sm text-gray-400">Not yet started</p>
            )}
          </div>
        </Link>

        <Link href="/exam" className="block">
          <div className="bg-white rounded-xl border border-gray-200 p-5 hover:border-green-300 hover:shadow-sm transition">
            <div className="text-2xl mb-2">📝</div>
            <h2 className="font-semibold text-gray-800 mb-1">Exam Simulation</h2>
            {lastExam ? (
              <p className="text-sm text-gray-500">Last score: {Math.round(lastExam.score ?? 0)}%</p>
            ) : (
              <p className="text-sm text-gray-400">{totalQuestions} questions in bank</p>
            )}
          </div>
        </Link>
      </div>

      {recentSessions.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
          <h2 className="font-semibold text-gray-800 mb-3">Recent Sessions</h2>
          <div className="divide-y divide-gray-100">
            {recentSessions.map((s) => (
              <div key={s.id} className="py-2 flex items-center justify-between text-sm">
                <span className="text-gray-600 capitalize">{s.sessionType}</span>
                <span className="text-gray-400">{new Date(s.startedAt).toLocaleDateString('en-CA')}</span>
                <span className={`font-semibold ${(s.score ?? 0) >= 70 ? 'text-green-600' : 'text-red-500'}`}>
                  {Math.round(s.score ?? 0)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {seeded && <EmailButtons />}
    </div>
  );
}
