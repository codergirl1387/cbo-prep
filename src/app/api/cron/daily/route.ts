import { NextRequest, NextResponse } from 'next/server';
import { generateDailyFlashcards } from '@/lib/ai/flashcard-generator';
import { generateDailyQuiz } from '@/lib/ai/quiz-generator';
import { sendFlashcardsEmail } from '@/lib/email/mailer';
import { getTodayCards } from '@/lib/db/queries/flashcards';
import { todayString } from '@/lib/utils/date';

// Vercel calls this endpoint at 6:00 AM EST every day (11:00 UTC)
// Protected by CRON_SECRET to prevent unauthorized calls
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('[Cron/Daily] Starting daily content generation...');

    await generateDailyFlashcards();
    await generateDailyQuiz();

    console.log('[Cron/Daily] Content generated. Sending flashcards email...');

    const cards = await getTodayCards(todayString());
    const recipient = process.env.RECIPIENT_EMAIL;

    if (recipient && cards.length > 0) {
      await sendFlashcardsEmail(cards, recipient);
      console.log(`[Cron/Daily] Email sent to ${recipient} with ${cards.length} cards.`);
      return NextResponse.json({ ok: true, cards: cards.length, emailed: true });
    } else {
      console.warn('[Cron/Daily] No cards or no recipient — skipping email.');
      return NextResponse.json({ ok: true, cards: cards.length, emailed: false });
    }
  } catch (err) {
    console.error('[Cron/Daily] Failed:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
