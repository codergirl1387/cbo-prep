'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Question, TopicBreakdown } from '@/types';
import { QuestionCard } from '@/components/exam/QuestionCard';
import { ResultsChart } from '@/components/exam/ResultsChart';

interface ResultsData {
  score: number;
  correct: number;
  total: number;
  topicBreakdown: TopicBreakdown;
  wrongQuestions: { questionId: number; correctAnswer: string; selectedAnswer: string | null }[];
  questions: Question[];
}

export default function ExamResultsPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [results, setResults] = useState<ResultsData | null>(null);
  const [showReview, setShowReview] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem(`exam-${sessionId}-results`);
    if (stored) setResults(JSON.parse(stored));
  }, [sessionId]);

  if (!results) {
    return <div className="text-center py-20 text-gray-400">Loading results...</div>;
  }

  const wrongQuestionIds = new Set(results.wrongQuestions.map((w) => w.questionId));
  const wrongQuestionsData = results.questions.filter((q) => wrongQuestionIds.has(q.id));

  const getAnswerForQuestion = (questionId: number) => {
    const wrong = results.wrongQuestions.find((w) => w.questionId === questionId);
    return (wrong?.selectedAnswer ?? null) as 'A' | 'B' | 'C' | 'D' | null;
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Exam Results</h1>
        <div className="flex items-center gap-6">
          <div className={`text-5xl font-bold ${results.score >= 70 ? 'text-green-600' : 'text-red-500'}`}>
            {results.score}%
          </div>
          <div>
            <p className="text-gray-600 text-sm">{results.correct} / {results.total} correct</p>
            <p className="text-gray-400 text-xs">{results.wrongQuestions.length} wrong answers</p>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <ResultsChart topicBreakdown={results.topicBreakdown} />
      </div>

      {wrongQuestionsData.length > 0 && (
        <div>
          <button
            onClick={() => setShowReview(!showReview)}
            className="mb-4 px-4 py-2 bg-blue-50 text-blue-700 text-sm font-semibold rounded-lg hover:bg-blue-100 transition"
          >
            {showReview ? 'Hide' : 'Review'} {wrongQuestionsData.length} wrong answer{wrongQuestionsData.length !== 1 ? 's' : ''}
          </button>

          {showReview && (
            <div className="space-y-4">
              {wrongQuestionsData.map((q, i) => (
                <QuestionCard
                  key={q.id}
                  question={q}
                  questionNumber={i + 1}
                  selectedAnswer={getAnswerForQuestion(q.id)}
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
          href="/exam"
          className="px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition"
        >
          Take Another Exam
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
