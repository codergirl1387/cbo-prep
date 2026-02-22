import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { recordCardReview } from '@/lib/db/queries/flashcards';

const ReviewSchema = z.object({
  cardId: z.number(),
  result: z.enum(['easy', 'hard', 'again']),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = ReviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
  await recordCardReview(parsed.data.cardId, parsed.data.result);
  return NextResponse.json({ ok: true });
}
