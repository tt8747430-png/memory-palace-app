import type { ReactNode } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import type { SelectPalace } from '@/db';
import { EditPalaceDialog } from './EditPalaceDialog';
import { DeletePalaceButton } from '@/features/palaces';
import { DuplicatePalaceButton } from './DuplicatePalaceButton';

interface Props {
  palace: SelectPalace;
  primaryAction?: ReactNode;
}

export function PalaceDetailHeader({ palace, primaryAction }: Props) {
  return (
    <header className="space-y-4">
      <nav
        className="flex items-center gap-1 text-sm text-muted-foreground"
        aria-label="Breadcrumb"
      >
        <Link href="/palaces" className="hover:text-foreground">
          Palaces
        </Link>
        <ChevronRight className="h-3.5 w-3.5" aria-hidden />
        <span className="font-medium text-foreground">{palace.title}</span>
      </nav>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{palace.title}</h1>
          {palace.description ? (
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{palace.description}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <EditPalaceDialog palace={palace} />
          <DuplicatePalaceButton id={palace.id} title={palace.title} />
          <DeletePalaceButton id={palace.id} title={palace.title} />
          {primaryAction}
        </div>
      </div>
    </header>
  );
}
