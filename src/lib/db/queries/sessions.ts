import { getDb } from '@/lib/db';
import { ExamSession, SessionAnswer, TopicBreakdown } from '@/types';

function rowToSession(row: Record<string, unknown>): ExamSession {
  return {
    id: row.id as number,
    sessionType: row.session_type as 'exam' | 'quiz',
    startedAt: row.started_at as string,
    completedAt: row.completed_at as string | null,
    timeLimitSeconds: row.time_limit_seconds as number,
    score: row.score as number | null,
    topicBreakdown: row.topic_breakdown as string | null,
  };
}

export async function createSession(sessionType: 'exam' | 'quiz', timeLimitSeconds: number): Promise<number> {
  const db = getDb();
  const result = await db.execute({
    sql: 'INSERT INTO exam_sessions (session_type, time_limit_seconds) VALUES (?, ?)',
    args: [sessionType, timeLimitSeconds],
  });
  return Number(result.lastInsertRowid);
}

export async function getSessionById(id: number): Promise<ExamSession | null> {
  const db = getDb();
  const result = await db.execute({ sql: 'SELECT * FROM exam_sessions WHERE id = ?', args: [id] });
  return result.rows[0] ? rowToSession(result.rows[0] as Record<string, unknown>) : null;
}

export async function getRecentSessions(limit = 10): Promise<ExamSession[]> {
  const db = getDb();
  const result = await db.execute({
    sql: 'SELECT * FROM exam_sessions WHERE completed_at IS NOT NULL ORDER BY completed_at DESC LIMIT ?',
    args: [limit],
  });
  return result.rows.map((r) => rowToSession(r as Record<string, unknown>));
}

export async function completeSession(
  sessionId: number,
  score: number,
  topicBreakdown: TopicBreakdown
): Promise<void> {
  const db = getDb();
  await db.execute({
    sql: `UPDATE exam_sessions SET completed_at = CURRENT_TIMESTAMP, score = ?, topic_breakdown = ? WHERE id = ?`,
    args: [score, JSON.stringify(topicBreakdown), sessionId],
  });
}

export async function insertSessionAnswers(
  sessionId: number,
  answers: { questionId: number; selectedAnswer: string | null; isCorrect: boolean }[]
): Promise<void> {
  const db = getDb();
  for (const a of answers) {
    await db.execute({
      sql: `INSERT INTO session_answers (session_id, question_id, selected_answer, is_correct) VALUES (?, ?, ?, ?)`,
      args: [sessionId, a.questionId, a.selectedAnswer, a.isCorrect ? 1 : 0],
    });
  }
}

export async function getSessionAnswers(sessionId: number): Promise<SessionAnswer[]> {
  const db = getDb();
  const result = await db.execute({
    sql: 'SELECT * FROM session_answers WHERE session_id = ?',
    args: [sessionId],
  });
  return result.rows.map((r) => ({
    id: r.id as number,
    sessionId: r.session_id as number,
    questionId: r.question_id as number,
    selectedAnswer: r.selected_answer as 'A' | 'B' | 'C' | 'D' | null,
    isCorrect: Boolean(r.is_correct),
    answeredAt: r.answered_at as string,
  }));
}

export async function getTodayQuizSession(): Promise<ExamSession | null> {
  const db = getDb();
  const today = new Date().toISOString().split('T')[0];
  const result = await db.execute({
    sql: `SELECT * FROM exam_sessions
          WHERE session_type = 'quiz' AND date(started_at) = ?
          ORDER BY id DESC LIMIT 1`,
    args: [today],
  });
  return result.rows[0] ? rowToSession(result.rows[0] as Record<string, unknown>) : null;
}
