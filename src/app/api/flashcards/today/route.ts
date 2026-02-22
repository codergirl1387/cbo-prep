import { NextResponse } from 'next/server';
import { generateDailyFlashcards } from '@/lib/ai/flashcard-generator';

export async function GET() {
  try {
    const cards = await generateDailyFlashcards();
    return NextResponse.json({ cards });
  } catch (err) {
    console.error('[Flashcards] Error generating daily cards:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
