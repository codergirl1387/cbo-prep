'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ExamSetupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startExam = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/exam/sessions', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create session');

      // Store questions in sessionStorage so the exam page can access them
      sessionStorage.setItem(`exam-${data.sessionId}-questions`, JSON.stringify(data.questions));
      router.push(`/exam/${data.sessionId}`);
    } catch (err) {
      setError(String(err));
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Exam Simulation</h1>
      <p className="text-gray-500 text-sm mb-8">Simulate the Canadian Biology Olympiad format</p>

      <div className="bg-white rounded-xl border border-gray-200 p-8 max-w-lg">
        <h2 className="font-semibold text-gray-800 mb-4">About the CBO Exam</h2>
        <ul className="text-sm text-gray-600 space-y-2 mb-6">
          <li>📋 ~40-50 multiple choice questions</li>
          <li>⏱ 60-minute time limit</li>
          <li>🎯 Questions sampled from your weak topics</li>
          <li>💡 Claude-powered explanations for wrong answers</li>
        </ul>

        {error && (
          <p className="text-red-600 text-sm mb-4">{error}</p>
        )}

        <button
          onClick={startExam}
          disabled={loading}
          className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition"
        >
          {loading ? 'Loading questions...' : 'Start Full Exam'}
        </button>
      </div>
    </div>
  );
}
