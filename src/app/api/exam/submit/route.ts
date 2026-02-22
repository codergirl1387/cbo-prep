import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionById, completeSession, insertSessionAnswers } from '@/lib/db/queries/sessions';
import { getQuestionById } from '@/lib/db/queries/questions';
import { recordSessionPerformance } from '@/lib/db/queries/performance';
import { TopicBreakdown } from '@/types';
import { todayString } from '@/lib/utils/date';

const SubmitSchema = z.object({
  sessionId: z.number(),
  answers: z.array(
    z.object({
      questionId: z.number(),
      selectedAnswer: z.enum(['A', 'B', 'C', 'D']).nullable(),
    })
  ),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = SubmitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { sessionId, answers } = parsed.data;
  const session = await getSessionById(sessionId);
  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }
  if (session.completedAt) {
    return NextResponse.json({ error: 'Session already completed' }, { status: 400 });
  }

  const topicBreakdown: TopicBreakdown = {};
  const processedAnswers: { questionId: number; selectedAnswer: string | null; isCorrect: boolean }[] = [];
  const wrongQuestions: { questionId: number; correctAnswer: string; selectedAnswer: string | null }[] = [];

  let correct = 0;
  let total = 0;

  for (const ans of answers) {
    const question = await getQuestionById(ans.questionId);
    if (!question) continue;

    const isCorrect = ans.selectedAnswer === question.correctAnswer;
    if (isCorrect) correct++;
    total++;

    if (!topicBreakdown[question.topic]) {
      topicBreakdown[question.topic] = { correct: 0, total: 0 };
    }
    topicBreakdown[question.topic].total++;
    if (isCorrect) topicBreakdown[question.topic].correct++;

    processedAnswers.push({
      questionId: ans.questionId,
      selectedAnswer: ans.selectedAnswer,
      isCorrect,
    });

    if (!isCorrect) {
      wrongQuestions.push({
        questionId: ans.questionId,
        correctAnswer: question.correctAnswer,
        selectedAnswer: ans.selectedAnswer,
      });
    }
  }

  const score = total > 0 ? (correct / total) * 100 : 0;

  await insertSessionAnswers(sessionId, processedAnswers);
  await completeSession(sessionId, score, topicBreakdown);
  await recordSessionPerformance(topicBreakdown, todayString(), session.sessionType);

  return NextResponse.json({
    score: Math.round(score * 10) / 10,
    correct,
    total,
    topicBreakdown,
    wrongQuestions,
  });
}
