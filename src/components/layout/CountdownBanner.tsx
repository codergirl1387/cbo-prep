'use client';

import { useEffect, useState } from 'react';
import { differenceInDays } from 'date-fns';

const EXAM_DATE = new Date('2026-04-09');

export function CountdownBanner() {
  const [days, setDays] = useState<number | null>(null);

  useEffect(() => {
    setDays(Math.max(0, differenceInDays(EXAM_DATE, new Date())));
  }, []);

  if (days === null) return null;

  const urgent = days <= 7;
  const warning = days <= 21;

  const bgClass = urgent
    ? 'bg-red-600 text-white'
    : warning
    ? 'bg-amber-500 text-white'
    : 'bg-blue-600 text-white';

  return (
    <div className={`${bgClass} text-center py-2 px-4 text-sm font-semibold`}>
      {days === 0
        ? 'CBO is TODAY! Good luck!'
        : `${days} day${days === 1 ? '' : 's'} until CBO — April 9, 2026`}
    </div>
  );
}
