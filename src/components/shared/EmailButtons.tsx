'use client';

import { useState } from 'react';

export function EmailButtons() {
  const [cardsStatus, setCardsStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [quizStatus, setQuizStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const sendEmail = async (type: 'flashcards' | 'quiz') => {
    const setStatus = type === 'flashcards' ? setCardsStatus : setQuizStatus;
    setStatus('sending');
    try {
      const res = await fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStatus('sent');
      setTimeout(() => setStatus('idle'), 4000);
    } catch {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 4000);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h2 className="font-semibold text-gray-800 mb-1">Send to Email</h2>
      <p className="text-xs text-gray-400 mb-4">Sends today&apos;s content to netra.iyer23@gmail.com</p>
      <div className="flex gap-3">
        <button
          onClick={() => sendEmail('flashcards')}
          disabled={cardsStatus === 'sending'}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition
            ${cardsStatus === 'sent' ? 'bg-green-100 text-green-700' :
              cardsStatus === 'error' ? 'bg-red-100 text-red-700' :
              'bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-60'}`}
        >
          📚 {cardsStatus === 'sending' ? 'Sending...' : cardsStatus === 'sent' ? 'Cards Sent! ✓' : cardsStatus === 'error' ? 'Failed ✗' : 'Send Flashcards'}
        </button>

        <button
          onClick={() => sendEmail('quiz')}
          disabled={quizStatus === 'sending'}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition
            ${quizStatus === 'sent' ? 'bg-green-100 text-green-700' :
              quizStatus === 'error' ? 'bg-red-100 text-red-700' :
              'bg-purple-50 text-purple-700 hover:bg-purple-100 disabled:opacity-60'}`}
        >
          🧪 {quizStatus === 'sending' ? 'Sending...' : quizStatus === 'sent' ? 'Quiz Sent! ✓' : quizStatus === 'error' ? 'Failed ✗' : 'Send Quiz'}
        </button>
      </div>
    </div>
  );
}
