import { getDb } from '@/lib/db';
import { StudyCard, Topic } from '@/types';

function rowToCard(row: Record<string, unknown>): StudyCard {
  return {
    id: row.id as number,
    topic: row.topic as Topic,
    front: row.front as string,
    back: row.back as string,
    generatedDate: row.generated_date as string,
    source: row.source as 'claude' | 'question-derived',
    createdAt: row.created_at as string,
  };
}

export async function getTodayCards(date: string): Promise<StudyCard[]> {
  const db = getDb();
  const result = await db.execute({
    sql: 'SELECT * FROM study_cards WHERE generated_date = ? ORDER BY id',
    args: [date],
  });
  return result.rows.map((r) => rowToCard(r as Record<string, unknown>));
}

export async function insertCards(cards: Omit<StudyCard, 'id' | 'createdAt'>[]): Promise<void> {
  const db = getDb();
  for (const card of cards) {
    await db.execute({
      sql: `INSERT INTO study_cards (topic, front, back, generated_date, source) VALUES (?, ?, ?, ?, ?)`,
      args: [card.topic, card.front, card.back, card.generatedDate, card.source],
    });
  }
}

export async function recordCardReview(cardId: number, result: 'easy' | 'hard' | 'again'): Promise<void> {
  const db = getDb();
  await db.execute({
    sql: 'INSERT INTO card_reviews (card_id, result) VALUES (?, ?)',
    args: [cardId, result],
  });
}

export async function getAgainQueueCards(): Promise<StudyCard[]> {
  const db = getDb();
  const result = await db.execute(`
    SELECT sc.* FROM study_cards sc
    WHERE (
      SELECT result FROM card_reviews
      WHERE card_id = sc.id
      ORDER BY reviewed_at DESC
      LIMIT 1
    ) = 'again'
    ORDER BY sc.id
  `);
  return result.rows.map((r) => rowToCard(r as Record<string, unknown>));
}

export async function getAgainQueueCount(): Promise<number> {
  const db = getDb();
  const result = await db.execute(`
    SELECT COUNT(*) as count FROM study_cards sc
    WHERE (
      SELECT result FROM card_reviews
      WHERE card_id = sc.id
      ORDER BY reviewed_at DESC
      LIMIT 1
    ) = 'again'
  `);
  return result.rows[0].count as number;
}

export async function getTodayReviewedCount(date: string): Promise<number> {
  const db = getDb();
  const result = await db.execute({
    sql: `SELECT COUNT(DISTINCT cr.card_id) as count
          FROM card_reviews cr
          JOIN study_cards sc ON sc.id = cr.card_id
          WHERE sc.generated_date = ?`,
    args: [date],
  });
  return result.rows[0].count as number;
}
