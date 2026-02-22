import { getDb } from './index';
import { TOPICS } from '@/types';

export async function runMigrations() {
  const db = getDb();

  await db.batch([
    `CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source TEXT NOT NULL,
      source_year INTEGER,
      topic TEXT NOT NULL,
      difficulty TEXT DEFAULT 'medium',
      question_text TEXT NOT NULL,
      option_a TEXT NOT NULL,
      option_b TEXT NOT NULL,
      option_c TEXT NOT NULL,
      option_d TEXT NOT NULL,
      correct_answer TEXT NOT NULL CHECK(correct_answer IN ('A','B','C','D')),
      explanation TEXT,
      page_number INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS study_cards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      topic TEXT NOT NULL,
      front TEXT NOT NULL,
      back TEXT NOT NULL,
      generated_date TEXT NOT NULL,
      source TEXT DEFAULT 'claude',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS card_reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      card_id INTEGER NOT NULL REFERENCES study_cards(id),
      result TEXT NOT NULL CHECK(result IN ('easy','hard','again')),
      reviewed_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS exam_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_type TEXT NOT NULL CHECK(session_type IN ('exam','quiz')),
      started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME,
      time_limit_seconds INTEGER NOT NULL,
      score REAL,
      topic_breakdown TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS session_answers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER NOT NULL REFERENCES exam_sessions(id),
      question_id INTEGER NOT NULL REFERENCES questions(id),
      selected_answer TEXT CHECK(selected_answer IN ('A','B','C','D')),
      is_correct INTEGER NOT NULL DEFAULT 0,
      answered_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS performance_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      topic TEXT NOT NULL,
      date TEXT NOT NULL,
      total_attempted INTEGER DEFAULT 0,
      total_correct INTEGER DEFAULT 0,
      accuracy_rate REAL DEFAULT 0.0,
      source TEXT NOT NULL CHECK(source IN ('exam','quiz','flashcard'))
    )`,
    `CREATE TABLE IF NOT EXISTS topic_weights (
      topic TEXT PRIMARY KEY,
      weight REAL NOT NULL DEFAULT 0.111,
      last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS pdf_sources (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      url TEXT NOT NULL,
      local_path TEXT NOT NULL,
      downloaded_at DATETIME,
      parse_status TEXT DEFAULT 'pending',
      question_count INTEGER DEFAULT 0
    )`,
    `CREATE INDEX IF NOT EXISTS idx_questions_topic ON questions(topic)`,
    `CREATE INDEX IF NOT EXISTS idx_session_answers_session ON session_answers(session_id)`,
    `CREATE INDEX IF NOT EXISTS idx_performance_topic_date ON performance_records(topic, date)`,
    `CREATE INDEX IF NOT EXISTS idx_study_cards_date ON study_cards(generated_date)`,
  ], 'deferred');

  // Seed initial equal topic weights if not present
  const result = await db.execute('SELECT COUNT(*) as count FROM topic_weights');
  const count = result.rows[0].count as number;
  if (count === 0) {
    const equalWeight = 1 / TOPICS.length;
    for (const topic of TOPICS) {
      await db.execute({
        sql: 'INSERT OR IGNORE INTO topic_weights (topic, weight) VALUES (?, ?)',
        args: [topic, equalWeight],
      });
    }
  }
}
