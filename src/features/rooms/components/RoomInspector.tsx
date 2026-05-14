'use client';

import { useSyncExternalStore } from 'react';
import { Activity, Info, X } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, cn } from '@/ui';
import { useRoomInspector, type InspectorTab } from '@/features/rooms';

const LG_QUERY = '(min-width: 1024px)';

function subscribeLg(callback: () => void): () => void {
  if (typeof window === 'undefined' || !window.matchMedia) return () => {};
  const mql = window.matchMedia(LG_QUERY);
  mql.addEventListener('change', callback);
  return () => mql.removeEventListener('change', callback);
}

function getLgSnapshot(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return true;
  return window.matchMedia(LG_QUERY).matches;
}

function getLgServerSnapshot(): boolean {
  return true;
}

function useIsLg(): boolean {
  return useSyncExternalStore(subscribeLg, getLgSnapshot, getLgServerSnapshot);
}

type Row = {
  id: string;
  description: string;
  timestamp: string;
};

interface Props {
  room: {
    title: string;
    nodeCount: number;
    createdAt: Date;
    updatedAt: Date;
  };
  palace: {
    title: string;
    mode: 'bible' | 'simple';
  };
  activityRows: Row[];
}

const TABS: ReadonlyArray<{ id: InspectorTab; label: string; Icon: typeof Info }> = [
  { id: 'overview', label: 'Overview', Icon: Info },
  { id: 'activity', label: 'Activity', Icon: Activity },
];

function formatDate(date: Date): string {
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function InspectorBody({
  tab,
  room,
  palace,
  activityRows,
}: {
  tab: InspectorTab;
  room: Props['room'];
  palace: Props['palace'];
  activityRows: Row[];
}) {
  if (tab === 'overview') {
    return (
      <dl className="divide-y text-sm">
        <Row label="Palace" value={palace.title} />
        <Row label="Mode" value={palace.mode === 'bible' ? 'Bible' : 'Simple'} />
        <Row label="Nodes" value={String(room.nodeCount)} />
        <Row label="Created" value={formatDate(room.createdAt)} />
        <Row label="Updated" value={formatDate(room.updatedAt)} />
      </dl>
    );
  }

  if (activityRows.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
        <Activity className="h-6 w-6 text-muted-foreground" aria-hidden />
        <p className="text-sm text-muted-foreground">No practice activity in this room yet.</p>
      </div>
    );
  }
  return (
    <ul className="divide-y">
      {activityRows.map((row) => (
        <li key={row.id} className="px-4 py-3">
          <p className="truncate text-sm">{row.description}</p>
          <p className="text-xs text-muted-foreground">{row.timestamp}</p>
        </li>
      ))}
    </ul>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[110px_1fr] gap-3 px-4 py-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium tabular-nums">{value}</dd>
    </div>
  );
}

function Tabs({ tab, setTab }: { tab: InspectorTab; setTab: (t: InspectorTab) => void }) {
  return (
    <div role="tablist" aria-label="Inspector tabs" className="flex gap-1 border-b px-2">
      {TABS.map(({ id, label, Icon }) => (
        <button
          key={id}
          role="tab"
          aria-selected={tab === id ? 'true' : 'false'}
          type="button"
          onClick={() => setTab(id)}
          className={cn(
            'inline-flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm transition-colors',
            tab === id
              ? 'border-primary text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground',
          )}
        >
          <Icon className="h-3.5 w-3.5" aria-hidden />
          {label}
        </button>
      ))}
    </div>
  );
}

export function RoomInspector({ room, palace, activityRows }: Props) {
  const { open, tab, setOpen, setTab } = useRoomInspector();
  const isLg = useIsLg();

  return (
    <>
      {}
      <aside
        aria-label="Room inspector"
        className={cn(
          'hidden border-l bg-card lg:flex lg:flex-col',
          'w-80 shrink-0 overflow-hidden transition-[width] duration-200 motion-reduce:transition-none',
          !open && 'lg:w-0 lg:border-l-0',
        )}
      >
        {open ? (
          <>
            <header className="flex items-center justify-between border-b px-4 py-3">
              <h2 className="text-sm font-semibold tracking-tight">Inspector</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close inspector"
                className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </header>
            <Tabs tab={tab} setTab={setTab} />
            <div className="flex-1 overflow-y-auto">
              <InspectorBody tab={tab} room={room} palace={palace} activityRows={activityRows} />
            </div>
          </>
        ) : null}
      </aside>

      {}
      {!isLg ? (
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent side="right" className="flex w-full max-w-sm flex-col p-0">
            <SheetHeader className="border-b px-4 py-3 text-left">
              <SheetTitle>Inspector</SheetTitle>
            </SheetHeader>
            <Tabs tab={tab} setTab={setTab} />
            <div className="flex-1 overflow-y-auto">
              <InspectorBody tab={tab} room={room} palace={palace} activityRows={activityRows} />
            </div>
          </SheetContent>
        </Sheet>
      ) : null}
    </>
  );
}
