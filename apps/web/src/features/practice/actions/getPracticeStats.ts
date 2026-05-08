'use server';

import {
  getDb,
  nodes,
  rooms,
  palaces,
  practiceSessions,
  nodeReviewState,
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  isNull,
  sql,
} from '@memory-palace/db';
import { defineAction } from '@/shared/lib/action';

export type WeakestNode = {
  id: string;
  title: string;
  palaceId: string;
  roomId: string;
  mastery: number;
};

export type RecentSession = {
  id: string;
  nodeId: string;
  nodeTitle: string;
  score: number;
  correct: boolean;
  mode: 'multiple-choice' | 'typed-recall' | 'flashcard';
  practicedAt: Date;
};

export type PracticeStats = {
  totalPracticed: number;
  /** Sum of streak across all reviewed nodes — proxy for daily-streak shape. */
  totalStreak: number;
  /** Top streak across nodes (used in StreakCounter). */
  topStreak: number;
  weakestNodes: WeakestNode[];
  recentSessions: RecentSession[];
  /** Count of attempts per day for the last 7 days, oldest → newest. */
  weeklyActivity: number[];
};

const WEAKEST_LIMIT = 5;
const RECENT_LIMIT = 8;
const WEEK_DAYS = 7;

function startOfDayUtc(d: Date): Date {
  const next = new Date(d);
  next.setUTCHours(0, 0, 0, 0);
  return next;
}

export const getPracticeStats = defineAction({
  name: 'getPracticeStats',
  handler: async ({ user }): Promise<PracticeStats> => {
    const db = getDb();
    const now = new Date();
    const weekStart = startOfDayUtc(new Date(now.getTime() - (WEEK_DAYS - 1) * 86_400_000));

    const [totalRow, streakRow, weakest, recent, weeklyRows] = await Promise.all([
      db
        .select({ value: count() })
        .from(practiceSessions)
        .where(eq(practiceSessions.userId, user.id)),
      db
        .select({
          totalStreak: sql<number>`COALESCE(SUM(${nodeReviewState.streak}), 0)::int`,
          topStreak: sql<number>`COALESCE(MAX(${nodeReviewState.streak}), 0)::int`,
        })
        .from(nodeReviewState)
        .where(eq(nodeReviewState.userId, user.id)),
      db
        .select({
          id: nodes.id,
          title: nodes.title,
          palaceId: rooms.palaceId,
          roomId: nodes.roomId,
          mastery: nodeReviewState.mastery,
        })
        .from(nodeReviewState)
        .innerJoin(nodes, and(eq(nodes.id, nodeReviewState.nodeId), isNull(nodes.deletedAt)))
        .innerJoin(rooms, and(eq(rooms.id, nodes.roomId), isNull(rooms.deletedAt)))
        .innerJoin(palaces, and(eq(palaces.id, rooms.palaceId), isNull(palaces.deletedAt)))
        .where(eq(nodeReviewState.userId, user.id))
        .orderBy(asc(nodeReviewState.mastery))
        .limit(WEAKEST_LIMIT),
      db
        .select({
          id: practiceSessions.id,
          nodeId: practiceSessions.nodeId,
          nodeTitle: nodes.title,
          score: practiceSessions.score,
          correct: practiceSessions.correct,
          mode: practiceSessions.mode,
          practicedAt: practiceSessions.practicedAt,
        })
        .from(practiceSessions)
        .innerJoin(nodes, eq(nodes.id, practiceSessions.nodeId))
        .where(eq(practiceSessions.userId, user.id))
        .orderBy(desc(practiceSessions.practicedAt))
        .limit(RECENT_LIMIT),
      db
        .select({
          day: sql<string>`date_trunc('day', ${practiceSessions.practicedAt})::date::text`,
          value: count(),
        })
        .from(practiceSessions)
        .where(
          and(eq(practiceSessions.userId, user.id), gte(practiceSessions.practicedAt, weekStart)),
        )
        .groupBy(sql`date_trunc('day', ${practiceSessions.practicedAt})`),
    ]);

    const dayCounts = new Map<string, number>();
    for (const row of weeklyRows) dayCounts.set(row.day, row.value);
    const weeklyActivity: number[] = [];
    for (let i = 0; i < WEEK_DAYS; i += 1) {
      const day = new Date(weekStart.getTime() + i * 86_400_000);
      const key = day.toISOString().slice(0, 10);
      weeklyActivity.push(dayCounts.get(key) ?? 0);
    }

    return {
      totalPracticed: totalRow[0]?.value ?? 0,
      totalStreak: streakRow[0]?.totalStreak ?? 0,
      topStreak: streakRow[0]?.topStreak ?? 0,
      weakestNodes: weakest,
      recentSessions: recent,
      weeklyActivity,
    };
  },
});
