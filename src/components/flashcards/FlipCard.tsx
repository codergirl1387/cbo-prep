'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { StudyCard, TOPIC_LABELS, TOPIC_COLORS } from '@/types';

interface FlipCardProps {
  card: StudyCard;
  onRate: (result: 'easy' | 'hard' | 'again') => void;
}

export function FlipCard({ card, onRate }: FlipCardProps) {
  const [flipped, setFlipped] = useState(false);
  const [rated, setRated] = useState(false);

  const handleRate = (result: 'easy' | 'hard' | 'again') => {
    setRated(true);
    onRate(result);
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <div
        className="w-full max-w-lg cursor-pointer"
        style={{ perspective: '1000px', height: '280px' }}
        onClick={() => !rated && setFlipped(!flipped)}
      >
        <motion.div
          style={{ transformStyle: 'preserve-3d', position: 'relative', width: '100%', height: '100%' }}
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.5, type: 'spring', stiffness: 300, damping: 30 }}
        >
          {/* Front */}
          <div
            style={{ backfaceVisibility: 'hidden', position: 'absolute', width: '100%', height: '100%' }}
            className="bg-white rounded-2xl border-2 border-gray-200 shadow-md p-8 flex flex-col justify-between"
          >
            <span className={`text-xs px-2 py-1 rounded-full font-medium self-start ${TOPIC_COLORS[card.topic]}`}>
              {TOPIC_LABELS[card.topic]}
            </span>
            <p className="text-lg font-semibold text-gray-800 text-center leading-relaxed">{card.front}</p>
            <p className="text-xs text-gray-400 text-center">Tap to reveal answer</p>
          </div>

          {/* Back */}
          <div
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', position: 'absolute', width: '100%', height: '100%' }}
            className="bg-blue-50 rounded-2xl border-2 border-blue-200 shadow-md p-8 flex flex-col justify-between"
          >
            <span className={`text-xs px-2 py-1 rounded-full font-medium self-start ${TOPIC_COLORS[card.topic]}`}>
              {TOPIC_LABELS[card.topic]}
            </span>
            <p className="text-sm text-gray-700 text-center leading-relaxed">{card.back}</p>
            <p className="text-xs text-blue-400 text-center">Rate below</p>
          </div>
        </motion.div>
      </div>

      {/* Rating buttons — only shown when flipped and not yet rated */}
      {flipped && !rated && (
        <div className="flex gap-3">
          <button
            onClick={() => handleRate('again')}
            className="px-5 py-2 rounded-lg bg-red-100 text-red-700 font-semibold text-sm hover:bg-red-200 transition"
          >
            Again
          </button>
          <button
            onClick={() => handleRate('hard')}
            className="px-5 py-2 rounded-lg bg-amber-100 text-amber-700 font-semibold text-sm hover:bg-amber-200 transition"
          >
            Hard
          </button>
          <button
            onClick={() => handleRate('easy')}
            className="px-5 py-2 rounded-lg bg-green-100 text-green-700 font-semibold text-sm hover:bg-green-200 transition"
          >
            Easy
          </button>
        </div>
      )}

      {rated && (
        <p className="text-sm text-gray-400 font-medium">Rated! Moving to next card...</p>
      )}
    </div>
  );
}
