'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TopicBreakdown, TOPIC_LABELS, Topic } from '@/types';

interface ResultsChartProps {
  topicBreakdown: TopicBreakdown;
}

export function ResultsChart({ topicBreakdown }: ResultsChartProps) {
  const data = Object.entries(topicBreakdown)
    .filter(([, v]) => v.total > 0)
    .map(([topic, { correct, total }]) => ({
      name: TOPIC_LABELS[topic as Topic] ?? topic,
      accuracy: Math.round((correct / total) * 100),
      correct,
      total,
    }));

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Performance by Topic</h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="name"
            angle={-40}
            textAnchor="end"
            tick={{ fontSize: 11 }}
            interval={0}
          />
          <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11 }} />
          <Tooltip formatter={(value) => [`${value}%`, 'Accuracy']} />
          <Bar dataKey="accuracy" radius={[4, 4, 0, 0]}>
            {data.map((entry, i) => (
              <Cell
                key={i}
                fill={entry.accuracy >= 85 ? '#22c55e' : entry.accuracy >= 70 ? '#eab308' : '#ef4444'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
