import type { ComponentType, SVGProps } from 'react';
import { BookOpen, Brain, DoorOpen, Sparkles, Building2 } from 'lucide-react';

type IconType = ComponentType<SVGProps<SVGSVGElement>>;

export type PracticeMode = 'multiple-choice' | 'typed-recall' | 'flashcard';

export type ActivityEvent =
  | {
      kind: 'practice';
      id: string;
      at: Date;
      nodeTitle: string;
      roomTitle?: string;
      palaceTitle?: string;
      mode: PracticeMode;
      correct: boolean;
      score: number;
    }
  | {
      kind: 'node-added';
      id: string;
      at: Date;
      nodeTitle: string;
      roomTitle?: string;
    }
  | {
      kind: 'room-added';
      id: string;
      at: Date;
      roomTitle: string;
      palaceTitle?: string;
    }
  | {
      kind: 'palace-added';
      id: string;
      at: Date;
      palaceTitle: string;
    };

export type ActivityKind = ActivityEvent['kind'];

const MODE_VERB: Record<PracticeMode, string> = {
  'multiple-choice': 'Reviewed',
  'typed-recall': 'Recalled',
  flashcard: 'Flipped',
};

const KIND_ICON: Record<ActivityKind, IconType> = {
  practice: Brain,
  'node-added': Sparkles,
  'room-added': DoorOpen,
  'palace-added': Building2,
};

const KIND_TONE: Record<ActivityKind, 'primary' | 'success' | 'warning' | 'muted'> = {
  practice: 'primary',
  'node-added': 'success',
  'room-added': 'muted',
  'palace-added': 'muted',
};

export function eventIcon(kind: ActivityKind): IconType {
  return KIND_ICON[kind] ?? BookOpen;
}

export function eventTone(kind: ActivityKind): 'primary' | 'success' | 'warning' | 'muted' {
  return KIND_TONE[kind];
}

export function describeEvent(event: ActivityEvent): string {
  switch (event.kind) {
    case 'practice': {
      const verb = MODE_VERB[event.mode];
      const where = event.roomTitle
        ? ` in ${event.roomTitle}`
        : event.palaceTitle
          ? ` in ${event.palaceTitle}`
          : '';
      const outcome = event.correct ? '' : ' (missed)';
      return `${verb} "${event.nodeTitle}"${where}${outcome}`;
    }
    case 'node-added':
      return event.roomTitle
        ? `Added "${event.nodeTitle}" to ${event.roomTitle}`
        : `Added "${event.nodeTitle}"`;
    case 'room-added':
      return event.palaceTitle
        ? `Created room ${event.roomTitle} in ${event.palaceTitle}`
        : `Created room ${event.roomTitle}`;
    case 'palace-added':
      return `Created palace ${event.palaceTitle}`;
  }
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;

export function formatRelative(date: Date | string, now: Date = new Date()): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const diff = now.getTime() - d.getTime();
  if (diff < MINUTE) return 'just now';
  if (diff < HOUR) return `${Math.round(diff / MINUTE)}m ago`;
  if (diff < DAY) return `${Math.round(diff / HOUR)}h ago`;
  if (diff < WEEK) return `${Math.round(diff / DAY)}d ago`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function formatAbsolute(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function sortByRecency<T extends { at: Date }>(events: T[]): T[] {
  return [...events].sort((a, b) => b.at.getTime() - a.at.getTime());
}
