import Link from 'next/link';
import { AgainDeck } from '@/components/flashcards/AgainDeck';
import { getAgainQueueCards } from '@/lib/db/queries/flashcards';

export const dynamic = 'force-dynamic';

export default async function AgainPage() {
  const cards = await getAgainQueueCards();

  return (
    <div>
      <div className="mb-8">
        <Link href="/flashcards" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
          ← Back to Flashcards
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">Again List</h1>
        <p className="text-gray-500 mt-1 text-sm">
          {cards.length > 0
            ? `${cards.length} card${cards.length !== 1 ? 's' : ''} to review — mark Easy or Hard to clear them`
            : 'Cards you flag for review will appear here'}
        </p>
      </div>

      <AgainDeck cards={cards} />
    </div>
  );
}
