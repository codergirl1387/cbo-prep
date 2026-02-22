import { getDb } from '@/lib/db';
import { Question, Topic } from '@/types';

function rowToQuestion(row: Record<string, unknown>): Question {
  return {
    id: row.id as number,
    source: row.source as string,
    sourceYear: row.source_year as number | null,
    topic: row.topic as Topic,
    difficulty: row.difficulty as 'easy' | 'medium' | 'hard',
    questionText: row.question_text as string,
    optionA: row.option_a as string,
    optionB: row.option_b as string,
    optionC: row.option_c as string,
    optionD: row.option_d as string,
    correctAnswer: row.correct_answer as 'A' | 'B' | 'C' | 'D',
    explanation: row.explanation as string | null,
    pageNumber: row.page_number as number | null,
    createdAt: row.created_at as string,
  };
}

export async function getQuestionById(id: number): Promise<Question | null> {
  const db = getDb();
  const result = await db.execute({ sql: 'SELECT * FROM questions WHERE id = ?', args: [id] });
  return result.rows[0] ? rowToQuestion(result.rows[0] as Record<string, unknown>) : null;
}

export async function getQuestionsByTopic(topic: Topic, limit = 50): Promise<Question[]> {
  const db = getDb();
  const result = await db.execute({
    sql: 'SELECT * FROM questions WHERE topic = ? ORDER BY RANDOM() LIMIT ?',
    args: [topic, limit],
  });
  return result.rows.map((r) => rowToQuestion(r as Record<string, unknown>));
}

export async function getQuestionsSampled(
  topicWeights: { topic: Topic; weight: number }[],
  total: number
): Promise<Question[]> {
  const db = getDb();
  const topicCounts = new Map<Topic, number>();
  for (const { topic, weight } of topicWeights) {
    topicCounts.set(topic, Math.max(1, Math.round(weight * total)));
  }

  // Adjust to exactly `total`
  let sum = [...topicCounts.values()].reduce((a, b) => a + b, 0);
  const topicsSorted = [...topicCounts.entries()].sort((a, b) => b[1] - a[1]);
  let i = 0;
  while (sum !== total) {
    const [topic, count] = topicsSorted[i % topicsSorted.length];
    if (sum > total && count > 1) {
      topicCounts.set(topic, count - 1);
      sum--;
    } else if (sum < total) {
      topicCounts.set(topic, count + 1);
      sum++;
    }
    i++;
    if (i > total * 2) break;
  }

  const questions: Question[] = [];
  for (const [topic, count] of topicCounts) {
    const result = await db.execute({
      sql: 'SELECT * FROM questions WHERE topic = ? ORDER BY RANDOM() LIMIT ?',
      args: [topic, count],
    });
    questions.push(...result.rows.map((r) => rowToQuestion(r as Record<string, unknown>)));
  }

  // Shuffle
  for (let j = questions.length - 1; j > 0; j--) {
    const k = Math.floor(Math.random() * (j + 1));
    [questions[j], questions[k]] = [questions[k], questions[j]];
  }

  return questions;
}

export async function getTotalQuestionCount(): Promise<number> {
  const db = getDb();
  const result = await db.execute('SELECT COUNT(*) as count FROM questions');
  return result.rows[0].count as number;
}

export async function insertQuestion(q: Omit<Question, 'id' | 'createdAt'>): Promise<number> {
  const db = getDb();
  const result = await db.execute({
    sql: `INSERT OR IGNORE INTO questions
      (source, source_year, topic, difficulty, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, page_number)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      q.source, q.sourceYear, q.topic, q.difficulty,
      q.questionText, q.optionA, q.optionB, q.optionC, q.optionD,
      q.correctAnswer, q.explanation, q.pageNumber,
    ],
  });
  return Number(result.lastInsertRowid);
}

export async function updateQuestionExplanation(id: number, explanation: string): Promise<void> {
  const db = getDb();
  await db.execute({ sql: 'UPDATE questions SET explanation = ? WHERE id = ?', args: [explanation, id] });
}

export async function getQuestionsForTopics(topics: Topic[], count: number): Promise<Question[]> {
  if (topics.length === 0) return [];
  const db = getDb();
  const placeholders = topics.map(() => '?').join(',');
  const result = await db.execute({
    sql: `SELECT * FROM questions WHERE topic IN (${placeholders}) ORDER BY RANDOM() LIMIT ?`,
    args: [...topics, count],
  });
  return result.rows.map((r) => rowToQuestion(r as Record<string, unknown>));
}
