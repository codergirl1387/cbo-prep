'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Question, TopicBreakdown } from '@/types';
import { QuestionCard } from '@/components/exam/QuestionCard';
import { ResultsChart } from '@/components/exam/ResultsChart';

interface QuizResults {
  score: number;
  correct: number;
  total: number;
  topicBreakdown: TopicBreakdown;
  results: { questionId: number; isCorrect: boolean; correctAnswer: string }[];
  questions: Question[];
}

function QuizResultsContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('sessionId');
  const [results, setResults] = useState<QuizResults | null>(null);
  const [showReview, setShowReview] = useState(false);

  useEffect(() => {
    if (sessionId) {
      const stored = sessionStorage.getItem(`quiz-${sessionId}-results`);
      if (stored) setResults(JSON.parse(stored));
    }
  }, [sessionId]);

  if (!results) {
    return <div className="text-center py-20 text-gray-400">No results found.</div>;
  }

  const wrongQuestionsData = results.questions.filter((q) =>
    results.results.find((r) => r.questionId === q.id && !r.isCorrect)
  );

  const getSelectedAnswer = (questionId: number) => {
    // We don't store selected answers in quiz results — show null (correct answer will be shown)
    return null;
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Quiz Results</h1>
        <div className="flex items-center gap-6">
          <div className={`text-5xl font-bold ${results.score >= 70 ? 'text-green-600' : 'text-red-500'}`}>
            {results.score}%
          </div>
          <div>
            <p className="text-gray-600 text-sm">{results.correct} / {results.total} correct</p>
          </div>
        </div>
      </div>

      {Object.keys(results.topicBreakdown).length > 0 && (
        <div className="mb-8">
          <ResultsChart topicBreakdown={results.topicBreakdown} />
        </div>
      )}

      {wrongQuestionsData.length > 0 && (
        <div>
          <button
            onClick={() => setShowReview(!showReview)}
            className="mb-4 px-4 py-2 bg-purple-50 text-purple-700 text-sm font-semibold rounded-lg hover:bg-purple-100 transition"
          >
            {showReview ? 'Hide' : 'Review'} {wrongQuestionsData.length} missed question{wrongQuestionsData.length !== 1 ? 's' : ''}
          </button>

          {showReview && (
            <div className="space-y-4">
              {wrongQuestionsData.map((q, i) => (
                <QuestionCard
                  key={q.id}
                  question={q}
                  questionNumber={i + 1}
                  selectedAnswer={getSelectedAnswer(q.id)}
                  onSelect={() => {}}
                  reviewMode
                />
              ))}
            </div>
          )}
        </div>
      )}

      <div className="mt-8 flex gap-3">
        <Link
          href="/"
          className="px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition"
        >
          Back to Dashboard
        </Link>
        <Link
          href="/progress"
          className="px-5 py-2 bg-gray-100 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-200 transition"
        >
          View Progress
        </Link>
      </div>
    </div>
  );
}

export default function QuizResultsPage() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-gray-400">Loading...</div>}>
      <QuizResultsContent />
    </Suspense>
  );
}
