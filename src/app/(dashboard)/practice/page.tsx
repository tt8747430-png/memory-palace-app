import type { Metadata } from 'next';
import Link from 'next/link';
import { getDueNodes, FlashcardDeck } from '@/features/practice';
import { getPalaces } from '@/features/palaces';
import { getRooms } from '@/features/rooms';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  description: 'Anki-style flashcard deck powered by your spaced-repetition queue.',
};

interface PageProps {
  searchParams: Promise<{ palaceId?: string; roomId?: string }>;
}

const DECK_LIMIT = 50;

export default async function PracticePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const palaceId = params.palaceId?.trim() || undefined;
  const roomId = params.roomId?.trim() || undefined;

  if (!palaceId && !roomId) {
    const palacesResult = await getPalaces();
    const palaces = palacesResult.success ? palacesResult.data : [];
    return (
      <div className="space-y-6 pb-16 md:pb-0">
        <header>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Practice</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Pick a scope. Cards cycle through your due-for-review queue with Anki-style ratings.
          </p>
        </header>

        <section className="space-y-3">
          <Link
            href="/practice?all=1"
            className="flex min-h-touch items-center justify-between gap-3 rounded-lg border bg-card p-4 hover:bg-muted/40"
          >
            <div className="min-w-0">
              <p className="font-medium">All palaces</p>
              <p className="text-xs text-muted-foreground">
                Up to {DECK_LIMIT} due cards across every palace.
              </p>
            </div>
            <span className="shrink-0 text-xs font-medium text-primary">Start →</span>
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
            <ul className="grid gap-2 sm:grid-cols-2">
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
                    href={`/practice?palaceId=${p.id}`}
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

async function RoomLinks({ palaceId }: { palaceId: string }) {
  const result = await getRooms({ palaceId });
  if (!result.success || result.data.length === 0) return null;
  return (
    <ul className="mt-2 flex flex-wrap gap-1.5">
      {result.data.slice(0, 6).map((room) => (
        <li key={room.id}>
          <Link
            href={`/practice?roomId=${room.id}`}
            className="inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium hover:bg-muted"
          >
            {room.title}
          </Link>
        </li>
      ))}
    </ul>
  );
}
