'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Question } from '@/types';
import { QuestionCard } from '@/components/exam/QuestionCard';
import { QuestionNav } from '@/components/exam/QuestionNav';
import { ExamTimer } from '@/components/exam/ExamTimer';

export default function ExamPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const router = useRouter();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<number, 'A' | 'B' | 'C' | 'D'>>(new Map());
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = sessionStorage.getItem(`exam-${sessionId}-questions`);
    if (stored) {
      setQuestions(JSON.parse(stored));
    }
    setLoading(false);
  }, [sessionId]);

  const handleSelect = (answer: 'A' | 'B' | 'C' | 'D') => {
    setAnswers((prev) => new Map(prev).set(questions[currentIndex].id, answer));
  };

  const submitExam = async () => {
    setSubmitting(true);
    const answersPayload = questions.map((q) => ({
      questionId: q.id,
      selectedAnswer: answers.get(q.id) ?? null,
    }));
    try {
      const res = await fetch('/api/exam/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: Number(sessionId), answers: answersPayload }),
      });
      const data = await res.json();
      sessionStorage.setItem(`exam-${sessionId}-results`, JSON.stringify({ ...data, questions }));
      router.push(`/exam/${sessionId}/results`);
    } catch (err) {
      console.error(err);
      setSubmitting(false);
    }
  };

  if (loading || questions.length === 0) {
    return (
      <div className="text-center py-20 text-gray-400">
        {loading ? 'Loading exam...' : 'No questions found. Please start a new exam.'}
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const answeredIndices = new Set(
    questions
      .map((q, i) => ({ answered: answers.has(q.id), i }))
      .filter((x) => x.answered)
      .map((x) => x.i)
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Exam Simulation</h1>
          <p className="text-sm text-gray-400">{questions.length} questions</p>
        </div>
        <div className="flex items-center gap-4">
          <ExamTimer timeLimitSeconds={3600} onTimeUp={submitExam} />
          <button
            onClick={submitExam}
            disabled={submitting}
            className="px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-60 transition"
          >
            {submitting ? 'Submitting...' : 'Submit Exam'}
          </button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Main question area */}
        <div className="flex-1">
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
            <button
              onClick={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))}
              disabled={currentIndex === questions.length - 1}
              className="px-4 py-2 text-sm text-blue-600 hover:text-blue-800 disabled:opacity-30"
            >
              Next →
            </button>
          </div>
        </div>

        {/* Sidebar navigator */}
        <div className="w-48 shrink-0">
          <QuestionNav
            total={questions.length}
            current={currentIndex}
            answered={answeredIndices}
            onNavigate={setCurrentIndex}
          />
        </div>
      </div>
    </div>
  );
}
