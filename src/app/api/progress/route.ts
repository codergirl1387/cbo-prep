import { NextResponse } from 'next/server';
import { getTopicAccuracySummary, getScoreHistory } from '@/lib/db/queries/performance';
import { getTopicWeights } from '@/lib/utils/adaptive-weights';
import { getRecentSessions } from '@/lib/db/queries/sessions';
import { getTotalQuestionCount } from '@/lib/db/queries/questions';
import { daysUntilExam, examDateFormatted } from '@/lib/utils/date';

export async function GET() {
  const [topicAccuracy, weights, scoreHistory, recentSessions, totalQuestions] = await Promise.all([
    getTopicAccuracySummary(),
    getTopicWeights(),
    getScoreHistory(),
    getRecentSessions(5),
    getTotalQuestionCount(),
  ]);
  const days = daysUntilExam();
  const examDate = examDateFormatted();

  return NextResponse.json({
    topicAccuracy,
    weights,
    scoreHistory,
    recentSessions,
    totalQuestions,
    daysUntilExam: days,
    examDate,
  });
}
