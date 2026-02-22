import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getTodayCards } from '@/lib/db/queries/flashcards';
import { getTodayQuizSession } from '@/lib/db/queries/sessions';
import { sendFlashcardsEmail, sendQuizEmail } from '@/lib/email/mailer';
import { todayString } from '@/lib/utils/date';

const EmailSchema = z.object({
  type: z.enum(['flashcards', 'quiz']),
  recipientEmail: z.string().email().optional(),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = EmailSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const recipient = parsed.data.recipientEmail || process.env.RECIPIENT_EMAIL;
  if (!recipient) {
    return NextResponse.json({ error: 'No recipient email configured' }, { status: 400 });
  }

  try {
    if (parsed.data.type === 'flashcards') {
      const cards = await getTodayCards(todayString());
      if (cards.length === 0) {
        return NextResponse.json({ error: 'No flashcards generated for today yet' }, { status: 404 });
      }
      await sendFlashcardsEmail(cards, recipient);
      return NextResponse.json({ ok: true, sent: cards.length });
    }

    if (parsed.data.type === 'quiz') {
      const session = await getTodayQuizSession();
      if (!session) {
        return NextResponse.json({ error: 'No quiz generated for today yet' }, { status: 404 });
      }
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      await sendQuizEmail(`${baseUrl}/quiz`, 10, recipient);
      return NextResponse.json({ ok: true });
    }
  } catch (err) {
    console.error('[Email] Failed to send:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
