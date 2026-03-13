'use client';

import { useState } from 'react';
import { StudyCard } from '@/types';
import { FlipCard } from './FlipCard';

interface AgainDeckProps {
  cards: StudyCard[];
}

export function AgainDeck({ cards }: AgainDeckProps) {
  const [queue, setQueue] = useState<StudyCard[]>([...cards]);
  const [doneCount, setDoneCount] = useState(0);
  const [renderKey, setRenderKey] = useState(0);

  if (cards.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <div className="text-4xl mb-3">✓</div>
        <p className="text-gray-500">No cards in your Again list.</p>
        <p className="text-sm mt-1 text-gray-400">Cards you mark &quot;Again&quot; while studying will appear here.</p>
      </div>
    );
  }

  const currentCard = queue[0];
  const done = !currentCard;

  const handleRate = async (result: 'easy' | 'hard' | 'again') => {
    const card = currentCard;
    await fetch('/api/flashcards/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cardId: card.id, result }),
    });

    setTimeout(() => {
      if (result === 'again') {
        // Card stays in Again list — move to next, it'll be here on next visit
        setQueue((q) => q.slice(1));
      } else {
        // Easy or Hard clears the card from the Again list
        setDoneCount((c) => c + 1);
        setQueue((q) => q.slice(1));
      }
      setRenderKey((k) => k + 1);
    }, 800);
  };

  return (
    <div className="max-w-xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <span className="text-sm font-medium text-gray-500">
          {done ? `Cleared ${doneCount} card${doneCount !== 1 ? 's' : ''}` : `${queue.length} card${queue.length !== 1 ? 's' : ''} remaining`}
        </span>
        <div className="flex gap-1">
          {cards.map((card) => {
            const isPast = !queue.some((c) => c.id === card.id);
            const isCurrent = currentCard?.id === card.id;
            return (
              <div
                key={card.id}
                className={`h-1.5 w-6 rounded-full ${isPast ? 'bg-green-400' : isCurrent ? 'bg-orange-400' : 'bg-gray-200'}`}
              />
            );
          })}
        </div>
      </div>

      {done ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">✅</div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Session complete!</h3>
          <p className="text-gray-500">
            Cards marked Easy or Hard are cleared. Cards marked Again will stay here for next time.
          </p>
          <a href="/flashcards" className="inline-block mt-6 text-sm text-blue-600 hover:text-blue-700 underline">
            Back to today&apos;s cards
          </a>
        </div>
      ) : (
        <FlipCard key={renderKey} card={currentCard} onRate={handleRate} />
      )}
    </div>
  );
}
