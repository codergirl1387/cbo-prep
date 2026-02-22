import { NextResponse } from 'next/server';
import { generateDailyQuiz } from '@/lib/ai/quiz-generator';
import { getTodayQuizSession } from '@/lib/db/queries/sessions';
import { getQuestionsForTopics } from '@/lib/db/queries/questions';
import { TOPICS } from '@/types';

export async function GET() {
  try {
    const existing = await getTodayQuizSession();
    if (existing && existing.completedAt) {
      return NextResponse.json({
        sessionId: existing.id,
        completed: true,
        score: existing.score,
        questions: [],
      });
    }

    const { sessionId, questions } = await generateDailyQuiz();
    return NextResponse.json({ sessionId, questions, completed: false });
  } catch (err) {
    console.error('[Quiz] Error generating daily quiz:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
