import { CardDeck } from '@/components/flashcards/CardDeck';
import { getTodayCards } from '@/lib/db/queries/flashcards';
import { todayString } from '@/lib/utils/date';

export const dynamic = 'force-dynamic';

export default async function FlashcardsPage() {
  const today = todayString();
  const cards = await getTodayCards(today);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Daily Flashcards</h1>
        <p className="text-gray-500 mt-1 text-sm">
          {cards.length > 0
            ? `${cards.length} cards for today — tap to flip, then rate your confidence`
            : 'Loading today\'s cards...'}
        </p>
      </div>

      {cards.length === 0 ? (
        <GenerateCardsButton />
      ) : (
        <CardDeck cards={cards} />
      )}
    </div>
  );
}

function GenerateCardsButton() {
  return (
    <div className="text-center py-12">
      <p className="text-gray-500 mb-4">No cards generated yet for today.</p>
      <a
        href="/api/flashcards/today"
        className="inline-block px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
      >
        Generate Today&apos;s Cards
      </a>
    </div>
  );
}
