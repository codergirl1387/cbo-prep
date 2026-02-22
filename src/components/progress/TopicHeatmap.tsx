'use client';

import { Topic, TOPIC_LABELS, TOPICS } from '@/types';

interface TopicStat {
  topic: Topic;
  accuracy: number;
  total: number;
}

interface TopicHeatmapProps {
  stats: TopicStat[];
}

function accuracyColor(accuracy: number, total: number): string {
  if (total === 0) return 'bg-gray-100 text-gray-400';
  if (accuracy >= 0.85) return 'bg-green-100 text-green-800 border-green-300';
  if (accuracy >= 0.70) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
  if (accuracy >= 0.50) return 'bg-orange-100 text-orange-800 border-orange-300';
  return 'bg-red-100 text-red-800 border-red-300';
}

export function TopicHeatmap({ stats }: TopicHeatmapProps) {
  const statMap = new Map(stats.map((s) => [s.topic, s]));

  return (
    <div className="grid grid-cols-3 gap-3">
      {TOPICS.map((topic) => {
        const stat = statMap.get(topic);
        const accuracy = stat?.accuracy ?? 0;
        const total = stat?.total ?? 0;
        const colorClass = accuracyColor(accuracy, total);

        return (
          <div
            key={topic}
            className={`rounded-xl border-2 p-4 text-center ${colorClass}`}
          >
            <p className="text-xs font-semibold mb-1">{TOPIC_LABELS[topic]}</p>
            {total > 0 ? (
              <>
                <p className="text-2xl font-bold">{Math.round(accuracy * 100)}%</p>
                <p className="text-xs opacity-70">{total} attempts</p>
              </>
            ) : (
              <p className="text-sm opacity-50">No data</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
