'use client';

import { useState, useEffect } from 'react';

interface ExplanationStreamProps {
  questionId: number;
}

export function ExplanationStream({ questionId }: ExplanationStreamProps) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setText('');
    setLoading(true);
    setError(null);

    const fetchExplanation = async () => {
      try {
        const res = await fetch('/api/explain', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ questionId }),
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        // Check if it's a cached (non-streaming) response
        const contentType = res.headers.get('content-type') ?? '';
        if (contentType.includes('application/json')) {
          const data = await res.json();
          if (!cancelled) setText(data.explanation);
          return;
        }

        // Streaming response
        const reader = res.body?.getReader();
        if (!reader) throw new Error('No response body');

        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done || cancelled) break;
          setText((prev) => prev + decoder.decode(value, { stream: true }));
        }
      } catch (err) {
        if (!cancelled) setError(String(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchExplanation();
    return () => { cancelled = true; };
  }, [questionId]);

  if (error) {
    return <p className="text-red-500 text-sm mt-2">Could not load explanation: {error}</p>;
  }

  return (
    <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
      <p className="text-xs font-semibold text-blue-600 mb-1">Explanation</p>
      {loading && text.length === 0 ? (
        <div className="flex gap-1 items-center">
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      ) : (
        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{text}</p>
      )}
    </div>
  );
}
