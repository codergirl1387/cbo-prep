import { NextResponse } from 'next/server';
import { createSession, getRecentSessions } from '@/lib/db/queries/sessions';
import { getQuestionsSampled, getTotalQuestionCount } from '@/lib/db/queries/questions';
import { getTopicWeights } from '@/lib/utils/adaptive-weights';

export async function GET() {
  const sessions = await getRecentSessions(20);
  return NextResponse.json({ sessions });
}

export async function POST() {
  const total = await getTotalQuestionCount();
  if (total < 5) {
    return NextResponse.json(
      { error: 'Not enough questions in database. Run POST /api/seed first.' },
      { status: 400 }
    );
  }

  const weights = await getTopicWeights();
  const questionCount = Math.min(50, total);
  const questions = await getQuestionsSampled(weights, questionCount);

  const sessionId = await createSession('exam', 3600);

  return NextResponse.json({ sessionId, questions });
}
