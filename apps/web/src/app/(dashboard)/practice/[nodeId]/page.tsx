import { notFound, redirect } from 'next/navigation';
import { getDb, nodes, rooms, palaces, nodeReviewState, and, eq, isNull } from '@memory-palace/db';
import { getCurrentUser } from '@/shared/lib/supabase';
import { QuizSession, type DueNodeWithMeta } from '@/features/practice';

interface Props {
  params: Promise<{ nodeId: string }>;
}

export const dynamic = 'force-dynamic';

export default async function PracticeNodePage({ params }: Props) {
  const { nodeId } = await params;
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const [row] = await getDb()
    .select({
      id: nodes.id,
      title: nodes.title,
      content: nodes.content,
      verseHint: nodes.verseHint,
      bibleRef: nodes.bibleRef,
      roomId: nodes.roomId,
      palaceId: rooms.palaceId,
      palaceTitle: palaces.title,
      palaceMode: palaces.mode,
      roomTitle: rooms.title,
      mastery: nodeReviewState.mastery,
      streak: nodeReviewState.streak,
      practiceCount: nodeReviewState.practiceCount,
      nextReview: nodeReviewState.nextReview,
    })
    .from(nodes)
    .innerJoin(rooms, and(eq(rooms.id, nodes.roomId), isNull(rooms.deletedAt)))
    .innerJoin(palaces, and(eq(palaces.id, rooms.palaceId), isNull(palaces.deletedAt)))
    .leftJoin(
      nodeReviewState,
      and(eq(nodeReviewState.nodeId, nodes.id), eq(nodeReviewState.userId, user.id)),
    )
    .where(and(eq(nodes.id, nodeId), eq(nodes.userId, user.id), isNull(nodes.deletedAt)))
    .limit(1);

  if (!row) notFound();

  const node: DueNodeWithMeta = {
    id: row.id,
    title: row.title,
    content: row.content,
    verseHint: row.verseHint,
    bibleRef: row.bibleRef,
    roomId: row.roomId,
    palaceId: row.palaceId,
    palaceTitle: row.palaceTitle,
    palaceMode: row.palaceMode,
    roomTitle: row.roomTitle,
    mastery: row.mastery ?? 0,
    streak: row.streak ?? 0,
    practiceCount: row.practiceCount ?? 0,
    nextReview: row.nextReview,
    neverPracticed: row.nextReview === null,
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Quiz</h1>
      <QuizSession nodes={[node]} />
    </div>
  );
}
