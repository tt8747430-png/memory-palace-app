import { Suspense } from 'react';
import { Building2 } from 'lucide-react';
import {
  getPalaces,
  PalaceCard,
  CreatePalaceDialog,
  ExportButton,
  ImportDialog,
} from '@/features/palaces';
import { EmptyState } from '@/shared/components/EmptyState';
import { CardSkeleton } from '@/shared/components/CardSkeleton';
import { EmptyStateCreateButton } from '@/shared/components/EmptyStateCreateButton';

export const metadata = {
  title: 'Palaces',
  description: 'View and manage all your memory palaces.',
};

async function PalaceGrid() {
  const result = await getPalaces();
  const items = result.success ? result.data : [];

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<Building2 />}
        title="No palaces yet"
        description="A Memory Palace is your top-level space. Create one to start adding rooms and nodes."
        headingLevel={2}
        action={
          <EmptyStateCreateButton dialogId="create-palace">
            Create your first palace
          </EmptyStateCreateButton>
        }
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((palace) => (
        <PalaceCard key={palace.id} palace={palace} />
      ))}
    </div>
  );
}

export default async function PalacesPage() {
  return (
    <div className="space-y-6">
      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Palaces</h1>
          <p className="mt-1 text-sm text-muted-foreground">Your top-level memory spaces.</p>
        </div>

        {/* Actions — stacked on mobile, inline on sm+ */}
        <div className="flex flex-wrap items-center gap-2">
          <ImportDialog />
          <ExportButton />
          <CreatePalaceDialog />
        </div>
      </div>

      {/* ── Palace grid ─────────────────────────────────────────────────── */}
      <Suspense fallback={<CardSkeleton count={3} />}>
        <PalaceGrid />
      </Suspense>
    </div>
  );
}
