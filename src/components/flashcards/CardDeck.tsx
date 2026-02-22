'use client';

import { useState } from 'react';
import { StudyCard } from '@/types';
import { FlipCard } from './FlipCard';

interface CardDeckProps {
  cards: StudyCard[];
}

export function CardDeck({ cards }: CardDeckProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [ratedCount, setRatedCount] = useState(0);

  if (cards.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No cards for today yet. Check back later!
      </div>
    );
  }

  const handleRate = async (result: 'easy' | 'hard' | 'again') => {
    await fetch('/api/flashcards/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cardId: cards[currentIndex].id, result }),
    });
    setRatedCount((c) => c + 1);
    setTimeout(() => {
      if (currentIndex < cards.length - 1) {
        setCurrentIndex((i) => i + 1);
      }
    }, 800);
  };

  const done = ratedCount >= cards.length;

  return (
    <div className="max-w-xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <span className="text-sm font-medium text-gray-500">
          Card {Math.min(currentIndex + 1, cards.length)} of {cards.length}
        </span>
        <div className="flex gap-1">
          {cards.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 w-6 rounded-full ${i < ratedCount ? 'bg-green-400' : i === currentIndex ? 'bg-blue-400' : 'bg-gray-200'}`}
            />
          ))}
        </div>
      </div>

      {done ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">🎉</div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">All done for today!</h3>
          <p className="text-gray-500">You reviewed all {cards.length} cards. Come back tomorrow for new ones.</p>
        </div>
      ) : (
        <FlipCard key={cards[currentIndex].id} card={cards[currentIndex]} onRate={handleRate} />
      )}
    </div>
  );
}
