'use client';

import { useState, useEffect, useCallback } from 'react';

interface ExamTimerProps {
  timeLimitSeconds: number;
  onTimeUp: () => void;
}

export function ExamTimer({ timeLimitSeconds, onTimeUp }: ExamTimerProps) {
  const [remaining, setRemaining] = useState(timeLimitSeconds);

  const handleTimeUp = useCallback(onTimeUp, [onTimeUp]);

  useEffect(() => {
    if (remaining <= 0) {
      handleTimeUp();
      return;
    }
    const interval = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [handleTimeUp]);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const urgent = remaining <= 120;
  const warning = remaining <= 300;

  const colorClass = urgent
    ? 'text-red-600 animate-pulse'
    : warning
    ? 'text-amber-600'
    : 'text-gray-700';

  return (
    <div className={`text-xl font-mono font-bold ${colorClass}`}>
      {formatted}
    </div>
  );
}
