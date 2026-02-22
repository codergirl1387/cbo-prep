import { getDb } from '@/lib/db';
import { PerformanceRecord, Topic, TopicBreakdown } from '@/types';
import { updateTopicWeightsInDb } from '@/lib/utils/adaptive-weights';

function rowToRecord(row: Record<string, unknown>): PerformanceRecord {
  return {
    id: row.id as number,
    topic: row.topic as Topic,
    date: row.date as string,
    totalAttempted: row.total_attempted as number,
    totalCorrect: row.total_correct as number,
    accuracyRate: row.accuracy_rate as number,
    source: row.source as 'exam' | 'quiz' | 'flashcard',
  };
}

export async function recordSessionPerformance(
  topicBreakdown: TopicBreakdown,
  date: string,
  source: 'exam' | 'quiz'
): Promise<void> {
  const db = getDb();
  for (const [topic, { correct, total }] of Object.entries(topicBreakdown)) {
    if (total === 0) continue;
    await db.execute({
      sql: `INSERT INTO performance_records (topic, date, total_attempted, total_correct, accuracy_rate, source)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [topic, date, total, correct, correct / total, source],
    });
  }
  await updateTopicWeightsInDb();
}

export async function getAllPerformanceRecords(): Promise<PerformanceRecord[]> {
  const db = getDb();
  const result = await db.execute('SELECT * FROM performance_records ORDER BY date DESC');
  return result.rows.map((r) => rowToRecord(r as Record<string, unknown>));
}

export async function getTopicAccuracySummary(): Promise<{ topic: Topic; accuracy: number; total: number }[]> {
  const db = getDb();
  const result = await db.execute(`
    SELECT topic,
           SUM(total_correct) * 1.0 / NULLIF(SUM(total_attempted), 0) as accuracy,
           SUM(total_attempted) as total
    FROM performance_records
    GROUP BY topic
  `);
  return result.rows.map((r) => ({
    topic: r.topic as Topic,
    accuracy: (r.accuracy as number | null) ?? 0,
    total: r.total as number,
  }));
}

export async function getScoreHistory(): Promise<{ date: string; score: number; sessionType: string }[]> {
  const db = getDb();
  const result = await db.execute(`
    SELECT date(started_at) as date, score, session_type
    FROM exam_sessions
    WHERE completed_at IS NOT NULL AND score IS NOT NULL
    ORDER BY started_at DESC
    LIMIT 30
  `);
  return result.rows.map((r) => ({
    date: r.date as string,
    score: r.score as number,
    sessionType: r.session_type as string,
  }));
}
