import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { getDueNodes, QuizSession } from '@/features/practice';
import { getPalaces } from '@/features/palaces';
import { getRooms } from '@/features/rooms';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Quiz',
  description: 'Multiple-choice and typed-recall quizzes scoped to a room or palace.',
};

interface PageProps {
  searchParams: Promise<{ palaceId?: string; roomId?: string }>;
}

const QUEUE_LIMIT = 50;

export default async function QuizPage({ searchParams }: PageProps) {
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
          <h1 className="text-2xl font-bold md:text-3xl">Quiz</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose a palace (or a single room) and we&apos;ll build a quiz from your due nodes.
          </p>
        </header>

        {palaces.length === 0 ? (
          <p className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
            No palaces yet —{' '}
            <Link href="/palaces" className="text-primary hover:underline">
              create one
            </Link>{' '}
            to start a quiz.
          </p>
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {palaces.map((p) => (
              <li key={p.id} className="rounded-lg border bg-card p-4">
                <p className="font-medium">{p.title}</p>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  {p.mode === 'bible' ? 'Bible mode' : 'Simple mode'}
                </p>
                <Link
                  href={`/games/quiz?palaceId=${p.id}`}
                  className="mt-3 inline-flex text-sm text-primary hover:underline"
                >
                  Quiz this palace →
                </Link>
                <RoomLinks palaceId={p.id} />
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  const dueResult = await getDueNodes({ palaceId, roomId, limit: QUEUE_LIMIT });
  const queue = dueResult.success ? dueResult.data : [];

  if (queue.length === 0) {
    return (
      <div className="space-y-4">
        <BackToGames />
        <div className="rounded-lg border bg-card p-8 text-center">
          <h1 className="text-lg font-semibold">Nothing to quiz right now</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Add nodes to this scope or come back when reviews are due.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <BackToGames />
      <header>
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          {queue[0]?.palaceTitle}
          {roomId ? ` · ${queue[0]?.roomTitle}` : ''}
        </p>
        <h1 className="mt-1 text-2xl font-bold md:text-3xl">
          {queue.length} {queue.length === 1 ? 'question' : 'questions'} ready
        </h1>
      </header>
      <QuizSession nodes={queue} initialMode="multiple-choice" />
    </div>
  );
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
            href={`/games/quiz?roomId=${room.id}`}
            className="inline-flex rounded-full border px-2 py-0.5 text-xs hover:bg-muted"
          >
            {room.title}
          </Link>
        </li>
      ))}
    </ul>
  );
}
