'use client';

import { useState } from 'react';
import { StudyCard } from '@/types';
import { FlipCard } from './FlipCard';

interface CardDeckProps {
  cards: StudyCard[];
}

export function CardDeck({ cards }: CardDeckProps) {
  const [queue, setQueue] = useState<StudyCard[]>([...cards]);
  const [againQueue, setAgainQueue] = useState<StudyCard[]>([]);
  const [completedIds, setCompletedIds] = useState<Set<number>>(new Set());
  const [renderKey, setRenderKey] = useState(0);

  if (cards.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No cards for today yet. Check back later!
      </div>
    );
  }

  const inAgainPhase = queue.length === 0 && againQueue.length > 0;
  const currentCard = queue[0] ?? againQueue[0];
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
        setAgainQueue((q) => {
          const rest = inAgainPhase ? q.slice(1) : q;
          return [...rest, card];
        });
        if (!inAgainPhase) {
          setQueue((q) => q.slice(1));
        }
      } else {
        setCompletedIds((s) => new Set([...s, card.id]));
        if (inAgainPhase) {
          setAgainQueue((q) => q.slice(1));
        } else {
          setQueue((q) => q.slice(1));
        }
      }
      setRenderKey((k) => k + 1);
    }, 800);
  };

  return (
    <div className="max-w-xl mx-auto">
      {inAgainPhase && (
        <div className="mb-4 text-center text-sm font-medium text-orange-600 bg-orange-50 rounded-lg py-2 px-4">
          Reviewing {againQueue.length} card{againQueue.length !== 1 ? 's' : ''} marked &quot;Again&quot;
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <span className="text-sm font-medium text-gray-500">
          {inAgainPhase
            ? `Again: ${againQueue.length} remaining`
            : `Card ${cards.length - queue.length + 1} of ${cards.length}`}
        </span>
        <div className="flex gap-1">
          {cards.map((card) => {
            const isCompleted = completedIds.has(card.id);
            const isAgainPending = againQueue.some((c) => c.id === card.id);
            const isCurrent = !inAgainPhase && currentCard?.id === card.id;
            return (
              <div
                key={card.id}
                className={`h-1.5 w-6 rounded-full ${
                  isCompleted
                    ? 'bg-green-400'
                    : isAgainPending
                    ? 'bg-orange-400'
                    : isCurrent
                    ? 'bg-blue-400'
                    : 'bg-gray-200'
                }`}
              />
            );
          })}
        </div>
      </div>

      {done ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">🎉</div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">All done for today!</h3>
          <p className="text-gray-500">You reviewed all {cards.length} cards. Come back tomorrow for new ones.</p>
        </div>
      ) : (
        <FlipCard key={renderKey} card={currentCard} onRate={handleRate} />
      )}
    </div>
  );
}
