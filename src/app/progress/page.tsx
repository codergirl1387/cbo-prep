import { TopicHeatmap } from '@/components/progress/TopicHeatmap';
import { PerformanceLine } from '@/components/progress/PerformanceLine';
import { getTopicAccuracySummary, getScoreHistory } from '@/lib/db/queries/performance';
import { getTopicWeights } from '@/lib/utils/adaptive-weights';
import { getTotalQuestionCount } from '@/lib/db/queries/questions';
import { daysUntilExam, examDateFormatted } from '@/lib/utils/date';
import { TOPIC_LABELS, Topic } from '@/types';

export const dynamic = 'force-dynamic';

export default async function ProgressPage() {
  const [topicAccuracy, weights, scoreHistory, totalQuestions] = await Promise.all([
    getTopicAccuracySummary(),
    getTopicWeights(),
    getScoreHistory(),
    getTotalQuestionCount(),
  ]);
  const days = daysUntilExam();

  const weightMap = new Map(weights.map((w) => [w.topic, w.weight]));

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Progress</h1>
        <p className="text-gray-500 text-sm mt-1">
          {days} days until CBO ({examDateFormatted()}) · {totalQuestions} questions in bank
        </p>
      </div>

      <section className="mb-8">
        <h2 className="font-semibold text-gray-800 mb-4">Topic Accuracy</h2>
        <TopicHeatmap stats={topicAccuracy} />
      </section>

      <section className="mb-8">
        <h2 className="font-semibold text-gray-800 mb-4">Score History</h2>
        <PerformanceLine data={scoreHistory} />
      </section>

      <section>
        <h2 className="font-semibold text-gray-800 mb-4">Study Focus (Adaptive Weights)</h2>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs text-gray-400 mb-3">
            These weights determine how much today&apos;s quizzes and flashcards focus on each topic.
            Weak topics (lower accuracy) get higher weight.
          </p>
          <div className="space-y-2">
            {weights
              .slice()
              .sort((a, b) => b.weight - a.weight)
              .map((w) => (
                <div key={w.topic} className="flex items-center gap-3">
                  <span className="text-xs font-medium text-gray-600 w-36 shrink-0">
                    {TOPIC_LABELS[w.topic as Topic]}
                  </span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${Math.round(w.weight * 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-400 w-10 text-right">
                    {Math.round(w.weight * 100)}%
                  </span>
                </div>
              ))}
          </div>
        </div>
      </section>
    </div>
  );
}
