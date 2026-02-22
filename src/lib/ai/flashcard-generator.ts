import { Topic, StudyCard, TOPICS } from '@/types';
import { anthropic } from './client';
import { buildFlashcardPrompt } from './prompts';
import { getTopicWeights, sampleTopicsByWeight } from '@/lib/utils/adaptive-weights';
import { insertCards, getTodayCards } from '@/lib/db/queries/flashcards';
import { todayString } from '@/lib/utils/date';

interface RawCard {
  front: string;
  back: string;
}

async function generateCardsForTopic(topic: Topic, count: number): Promise<RawCard[]> {
  const prompt = buildFlashcardPrompt(topic, count);
  const message = await anthropic.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = message.content[0].type === 'text' ? message.content[0].text : '';
  try {
    // Strip markdown code fences if present
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const cards = JSON.parse(cleaned) as RawCard[];
    return Array.isArray(cards) ? cards : [];
  } catch {
    console.error('Failed to parse flashcard response for topic:', topic, text.slice(0, 200));
    return [];
  }
}

export async function generateDailyFlashcards(date?: string): Promise<StudyCard[]> {
  const today = date ?? todayString();

  // Idempotent: return existing cards if already generated
  const existing = await getTodayCards(today);
  if (existing.length > 0) return existing;

  const weights = await getTopicWeights();
  const totalCards = 9;
  const sampledTopics = sampleTopicsByWeight(weights, totalCards);

  const topicCounts = new Map<Topic, number>();
  for (const topic of sampledTopics) {
    topicCounts.set(topic, (topicCounts.get(topic) ?? 0) + 1);
  }

  const allCards: Omit<StudyCard, 'id' | 'createdAt'>[] = [];
  for (const [topic, count] of topicCounts) {
    const rawCards = await generateCardsForTopic(topic, count);
    for (const card of rawCards) {
      allCards.push({
        topic,
        front: card.front,
        back: card.back,
        generatedDate: today,
        source: 'claude',
      });
    }
  }

  await insertCards(allCards);
  return getTodayCards(today);
}

export async function ensureDailyFlashcards(): Promise<StudyCard[]> {
  return generateDailyFlashcards();
}
