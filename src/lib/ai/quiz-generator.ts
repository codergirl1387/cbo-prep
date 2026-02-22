import { Topic, Question } from '@/types';
import { anthropic } from './client';
import { buildQuizGenerationPrompt } from './prompts';
import { getTopicWeights, sampleTopicsByWeight } from '@/lib/utils/adaptive-weights';
import { getQuestionsForTopics, insertQuestion } from '@/lib/db/queries/questions';
import { createSession, getTodayQuizSession } from '@/lib/db/queries/sessions';

const QUIZ_QUESTION_COUNT = 10;
const QUIZ_TIME_SECONDS = 900; // 15 minutes

interface RawGeneratedQuestion {
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  difficulty: string;
}

async function generateQuestionsForTopic(topic: Topic, count: number): Promise<Question[]> {
  const prompt = buildQuizGenerationPrompt(topic, count);
  const message = await anthropic.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 3000,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = message.content[0].type === 'text' ? message.content[0].text : '';
  try {
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const raw = JSON.parse(cleaned) as RawGeneratedQuestion[];
    const questions: Question[] = [];
    for (const q of raw) {
      const id = await insertQuestion({
        source: 'Claude-generated',
        sourceYear: null,
        topic,
        difficulty: (q.difficulty as 'easy' | 'medium' | 'hard') || 'medium',
        questionText: q.questionText,
        optionA: q.optionA,
        optionB: q.optionB,
        optionC: q.optionC,
        optionD: q.optionD,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        pageNumber: null,
      });
      questions.push({
        id,
        source: 'Claude-generated',
        sourceYear: null,
        topic,
        difficulty: (q.difficulty as 'easy' | 'medium' | 'hard') || 'medium',
        questionText: q.questionText,
        optionA: q.optionA,
        optionB: q.optionB,
        optionC: q.optionC,
        optionD: q.optionD,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        pageNumber: null,
        createdAt: new Date().toISOString(),
      });
    }
    return questions;
  } catch {
    console.error('Failed to parse quiz generation response:', text.slice(0, 200));
    return [];
  }
}

export async function generateDailyQuiz(): Promise<{ sessionId: number; questions: Question[] }> {
  // Idempotent: return existing quiz session if created today
  const existing = await getTodayQuizSession();
  if (existing) {
    return { sessionId: existing.id, questions: [] };
  }

  const weights = await getTopicWeights();
  const sampledTopics = sampleTopicsByWeight(weights, QUIZ_QUESTION_COUNT);

  const topicCounts = new Map<Topic, number>();
  for (const topic of sampledTopics) {
    topicCounts.set(topic, (topicCounts.get(topic) ?? 0) + 1);
  }

  const questions: Question[] = [];

  for (const [topic, needed] of topicCounts) {
    const fromDb = await getQuestionsForTopics([topic], needed);
    questions.push(...fromDb.slice(0, needed));

    const remaining = needed - Math.min(fromDb.length, needed);
    if (remaining > 0) {
      const generated = await generateQuestionsForTopic(topic, remaining);
      questions.push(...generated);
    }
  }

  const sessionId = await createSession('quiz', QUIZ_TIME_SECONDS);
  return { sessionId, questions };
}
