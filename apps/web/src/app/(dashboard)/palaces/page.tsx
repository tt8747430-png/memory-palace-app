import { Suspense } from 'react';
import { Building2 } from 'lucide-react';
import { getPalaces, PalaceCard, CreatePalaceDialog } from '@/features/palaces';
import { EmptyState } from '@/shared/components/EmptyState';
import { CardSkeleton } from '@/shared/components/CardSkeleton';

export const metadata = { title: 'Palaces — Memory Palace' };

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
        action={<CreatePalaceDialog />}
      />
    );
  }

  return (
    <>
      <div className="flex justify-end">
        <CreatePalaceDialog />
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((palace) => (
          <PalaceCard key={palace.id} palace={palace} />
        ))}
      </div>
    </>
  );
}

export default function PalacesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Palaces</h1>
        <p className="mt-1 text-sm text-muted-foreground">Your top-level memory spaces.</p>
      </div>
      <Suspense fallback={<CardSkeleton count={3} />}>
        <PalaceGrid />
      </Suspense>
    </div>
  );
}
