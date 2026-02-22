'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Question } from '@/types';
import { QuestionCard } from '@/components/exam/QuestionCard';
import { ExamTimer } from '@/components/exam/ExamTimer';

interface QuizResponse {
  sessionId: number;
  questions: Question[];
  completed: boolean;
  score?: number;
}

export default function QuizPage() {
  const router = useRouter();
  const [quizData, setQuizData] = useState<QuizResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<number, 'A' | 'B' | 'C' | 'D'>>(new Map());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/quiz/today')
      .then((r) => r.json())
      .then((data: QuizResponse) => {
        if (data.completed) {
          router.push('/quiz/results?score=' + data.score);
          return;
        }
        setQuizData(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(String(err));
        setLoading(false);
      });
  }, [router]);

  const handleSelect = (answer: 'A' | 'B' | 'C' | 'D') => {
    if (!quizData) return;
    setAnswers((prev) => new Map(prev).set(quizData.questions[currentIndex].id, answer));
  };

  const submitQuiz = async () => {
    if (!quizData) return;
    setSubmitting(true);
    const answersPayload = quizData.questions.map((q) => ({
      questionId: q.id,
      selectedAnswer: answers.get(q.id) ?? null,
    }));
    try {
      const res = await fetch('/api/quiz/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: quizData.sessionId, answers: answersPayload }),
      });
      const data = await res.json();
      sessionStorage.setItem(`quiz-${quizData.sessionId}-results`, JSON.stringify({
        ...data,
        questions: quizData.questions,
      }));
      router.push(`/quiz/results?sessionId=${quizData.sessionId}`);
    } catch (err) {
      console.error(err);
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="text-gray-400 mb-2">Generating today&apos;s quiz...</div>
        <div className="text-xs text-gray-300">This may take a moment on the first visit</div>
      </div>
    );
  }

  if (error) {
    return <div className="text-center py-20 text-red-500">{error}</div>;
  }

  if (!quizData || quizData.questions.length === 0) {
    return <div className="text-center py-20 text-gray-400">No quiz available.</div>;
  }

  const currentQuestion = quizData.questions[currentIndex];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Daily Pop Quiz</h1>
          <p className="text-sm text-gray-400">
            {currentIndex + 1} of {quizData.questions.length} questions
          </p>
        </div>
        <div className="flex items-center gap-4">
          <ExamTimer timeLimitSeconds={900} onTimeUp={submitQuiz} />
          <button
            onClick={submitQuiz}
            disabled={submitting}
            className="px-5 py-2 bg-purple-600 text-white text-sm font-semibold rounded-lg hover:bg-purple-700 disabled:opacity-60 transition"
          >
            {submitting ? 'Submitting...' : 'Submit Quiz'}
          </button>
        </div>
      </div>

      <QuestionCard
        question={currentQuestion}
        questionNumber={currentIndex + 1}
        selectedAnswer={answers.get(currentQuestion.id) ?? null}
        onSelect={handleSelect}
      />

      <div className="flex justify-between mt-4">
        <button
          onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
          disabled={currentIndex === 0}
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-30"
        >
          ← Previous
        </button>
        {currentIndex < quizData.questions.length - 1 ? (
          <button
            onClick={() => setCurrentIndex((i) => i + 1)}
            className="px-4 py-2 text-sm text-blue-600 hover:text-blue-800"
          >
            Next →
          </button>
        ) : (
          <button
            onClick={submitQuiz}
            disabled={submitting}
            className="px-4 py-2 text-sm text-purple-600 font-semibold hover:text-purple-800 disabled:opacity-60"
          >
            Finish Quiz →
          </button>
        )}
      </div>
    </div>
  );
}
