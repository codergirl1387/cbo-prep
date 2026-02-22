'use client';

import { useState } from 'react';
import { Question, TOPIC_LABELS, TOPIC_COLORS } from '@/types';
import { ExplanationStream } from '@/components/shared/ExplanationStream';

interface QuestionCardProps {
  question: Question;
  questionNumber: number;
  selectedAnswer: 'A' | 'B' | 'C' | 'D' | null;
  onSelect: (answer: 'A' | 'B' | 'C' | 'D') => void;
  reviewMode?: boolean;
}

const OPTIONS = ['A', 'B', 'C', 'D'] as const;

export function QuestionCard({
  question,
  questionNumber,
  selectedAnswer,
  onSelect,
  reviewMode = false,
}: QuestionCardProps) {
  const [showExplanation, setShowExplanation] = useState(false);

  const optionText: Record<'A' | 'B' | 'C' | 'D', string> = {
    A: question.optionA,
    B: question.optionB,
    C: question.optionC,
    D: question.optionD,
  };

  const getOptionClass = (opt: 'A' | 'B' | 'C' | 'D') => {
    const base = 'w-full text-left px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all ';
    if (!reviewMode) {
      if (selectedAnswer === opt)
        return base + 'border-blue-500 bg-blue-50 text-blue-800';
      return base + 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50 text-gray-700';
    }
    // Review mode: show correct/wrong
    if (opt === question.correctAnswer)
      return base + 'border-green-500 bg-green-50 text-green-800';
    if (opt === selectedAnswer && opt !== question.correctAnswer)
      return base + 'border-red-500 bg-red-50 text-red-800';
    return base + 'border-gray-200 bg-white text-gray-500';
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-bold text-gray-400">Question {questionNumber}</span>
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${TOPIC_COLORS[question.topic]}`}>
          {TOPIC_LABELS[question.topic]}
        </span>
      </div>

      <p className="text-gray-800 font-medium mb-5 leading-relaxed">{question.questionText}</p>

      <div className="space-y-2">
        {OPTIONS.map((opt) => (
          <button
            key={opt}
            className={getOptionClass(opt)}
            onClick={() => !reviewMode && onSelect(opt)}
            disabled={reviewMode}
          >
            <span className="font-bold mr-2">{opt}.</span>
            {optionText[opt]}
          </button>
        ))}
      </div>

      {reviewMode && (
        <div className="mt-4">
          <button
            onClick={() => setShowExplanation(!showExplanation)}
            className="text-sm text-blue-600 hover:underline font-medium"
          >
            {showExplanation ? 'Hide explanation' : 'Explain this question'}
          </button>
          {showExplanation && <ExplanationStream questionId={question.id} />}
        </div>
      )}
    </div>
  );
}
