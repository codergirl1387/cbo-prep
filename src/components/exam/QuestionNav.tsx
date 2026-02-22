'use client';

interface QuestionNavProps {
  total: number;
  current: number;
  answered: Set<number>;
  onNavigate: (index: number) => void;
}

export function QuestionNav({ total, current, answered, onNavigate }: QuestionNavProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <p className="text-xs font-semibold text-gray-500 mb-3">
        {answered.size} / {total} answered
      </p>
      <div className="grid grid-cols-5 gap-1">
        {Array.from({ length: total }, (_, i) => (
          <button
            key={i}
            onClick={() => onNavigate(i)}
            className={`text-xs w-8 h-8 rounded font-medium transition-all ${
              i === current
                ? 'bg-blue-600 text-white'
                : answered.has(i)
                ? 'bg-green-100 text-green-700 border border-green-300'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
}
