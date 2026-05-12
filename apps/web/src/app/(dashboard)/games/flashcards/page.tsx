import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { getDueNodes, FlashcardDeck } from '@/features/practice';
import { getPalaces } from '@/features/palaces';
import { getRooms } from '@/features/rooms';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Flashcards',
  description: 'Anki-style flashcard deck powered by your spaced-repetition queue.',
};

interface PageProps {
  searchParams: Promise<{ palaceId?: string; roomId?: string }>;
}

const DECK_LIMIT = 50;

export default async function FlashcardsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const palaceId = params.palaceId?.trim() || undefined;
  const roomId = params.roomId?.trim() || undefined;

  if (!palaceId && !roomId) {
    const palacesResult = await getPalaces();
    const palaces = palacesResult.success ? palacesResult.data : [];
    return (
      <div className="space-y-6">
        <BackToGames />
        <header>
          <h1 className="text-2xl font-bold md:text-3xl">Flashcards</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Pick a scope. Cards cycle through your due-for-review queue with Anki-style ratings.
          </p>
        </header>

        <section className="space-y-3">
          <Link
            href="/games/flashcards?all=1"
            className="flex items-center justify-between rounded-lg border bg-card p-4 hover:bg-muted/40"
          >
            <div>
              <p className="font-medium">All palaces</p>
              <p className="text-xs text-muted-foreground">
                Up to {DECK_LIMIT} due cards across every palace.
              </p>
            </div>
            <span className="text-xs text-primary">Start →</span>
          </Link>

          {palaces.length === 0 ? (
            <p className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
              No palaces yet —{' '}
              <Link href="/palaces" className="text-primary hover:underline">
                create one
              </Link>{' '}
              to start populating decks.
            </p>
          ) : (
            <ul className="grid gap-2 md:grid-cols-2">
              {palaces.map((p) => (
                <li
                  key={p.id}
                  className="rounded-lg border bg-card p-4 transition-colors hover:bg-muted/40"
                >
                  <p className="font-medium">{p.title}</p>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">
                    {p.mode === 'bible' ? 'Bible mode' : 'Simple mode'}
                  </p>
                  <Link
                    href={`/games/flashcards?palaceId=${p.id}`}
                    className="mt-2 inline-flex text-sm text-primary hover:underline"
                  >
                    All rooms in this palace →
                  </Link>
                  <RoomLinks palaceId={p.id} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    );
  }

  const dueResult = await getDueNodes({ palaceId, roomId, limit: DECK_LIMIT });
  const cards = dueResult.success ? dueResult.data : [];

  return <FlashcardDeck nodes={cards} />;
}

function BackToGames() {
  return (
    <Link
      href="/games"
      className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
    >
      <ChevronLeft className="h-4 w-4" /> Games
    </Link>
  );
}

async function RoomLinks({ palaceId }: { palaceId: string }) {
  const result = await getRooms({ palaceId });
  if (!result.success || result.data.length === 0) return null;
  return (
    <ul className="mt-2 flex flex-wrap gap-1">
      {result.data.slice(0, 6).map((room) => (
        <li key={room.id}>
          <Link
            href={`/games/flashcards?roomId=${room.id}`}
            className="inline-flex rounded-full border px-2 py-0.5 text-xs hover:bg-muted"
          >
            {room.title}
          </Link>
        </li>
      ))}
    </ul>
  );
}
