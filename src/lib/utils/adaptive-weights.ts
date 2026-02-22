import { Topic, TopicWeight, PerformanceRecord, TOPICS } from '@/types';
import { getDb } from '@/lib/db';

export function computeTopicWeights(
  records: PerformanceRecord[],
  decayDays = 14
): TopicWeight[] {
  const now = new Date();

  const topicStats: Map<Topic, { weightedCorrect: number; weightedTotal: number }> =
    new Map(TOPICS.map((t) => [t, { weightedCorrect: 0, weightedTotal: 0 }]));

  for (const record of records) {
    const daysAgo = (now.getTime() - new Date(record.date).getTime()) / 86400000;
    const decayFactor = Math.exp(-daysAgo / decayDays);
    const stats = topicStats.get(record.topic)!;
    stats.weightedCorrect += record.totalCorrect * decayFactor;
    stats.weightedTotal += record.totalAttempted * decayFactor;
  }

  const accuracyByTopic = new Map<Topic, number>();
  for (const [topic, stats] of topicStats) {
    if (stats.weightedTotal < 5) {
      accuracyByTopic.set(topic, 0.5);
    } else {
      accuracyByTopic.set(topic, stats.weightedCorrect / stats.weightedTotal);
    }
  }

  const needScores = new Map<Topic, number>();
  for (const [topic, accuracy] of accuracyByTopic) {
    needScores.set(topic, Math.pow(1 - accuracy, 1.5));
  }

  const totalNeed = [...needScores.values()].reduce((a, b) => a + b, 0);
  const weights: TopicWeight[] = TOPICS.map((topic) => ({
    topic,
    weight: (needScores.get(topic) ?? 0) / totalNeed,
    lastUpdated: new Date().toISOString(),
  }));

  return weights;
}

export function sampleTopicsByWeight(weights: TopicWeight[], count: number): Topic[] {
  const selected: Topic[] = [];
  const sorted = [...weights].sort((a, b) => a.weight - b.weight);
  const cumulative: { topic: Topic; threshold: number }[] = [];
  let sum = 0;
  for (const w of sorted) {
    sum += w.weight;
    cumulative.push({ topic: w.topic, threshold: sum });
  }

  for (let i = 0; i < count; i++) {
    const rand = Math.random();
    const pick = cumulative.find((c) => rand <= c.threshold) ?? cumulative[cumulative.length - 1];
    selected.push(pick.topic);
  }
  return selected;
}

export async function updateTopicWeightsInDb(): Promise<TopicWeight[]> {
  const db = getDb();
  const result = await db.execute('SELECT * FROM performance_records ORDER BY date DESC');
  const records = result.rows.map((r) => ({
    id: r.id as number,
    topic: r.topic as Topic,
    date: r.date as string,
    totalAttempted: r.total_attempted as number,
    totalCorrect: r.total_correct as number,
    accuracyRate: r.accuracy_rate as number,
    source: r.source as 'exam' | 'quiz' | 'flashcard',
  })) as PerformanceRecord[];

  const weights = computeTopicWeights(records);

  for (const w of weights) {
    await db.execute({
      sql: `INSERT INTO topic_weights (topic, weight, last_updated)
            VALUES (?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(topic) DO UPDATE SET weight = excluded.weight, last_updated = excluded.last_updated`,
      args: [w.topic, w.weight],
    });
  }

  return weights;
}

export async function getTopicWeights(): Promise<TopicWeight[]> {
  const db = getDb();
  const result = await db.execute('SELECT topic, weight, last_updated FROM topic_weights');
  return result.rows.map((r) => ({
    topic: r.topic as Topic,
    weight: r.weight as number,
    lastUpdated: r.last_updated as string,
  }));
}
