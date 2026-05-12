import Link from 'next/link';
import type { SelectPalace } from '@memory-palace/db';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@memory-palace/ui';
import { EditPalaceDialog } from './EditPalaceDialog';
import { DeletePalaceButton } from './DeletePalaceButton';
import { DuplicatePalaceButton } from './DuplicatePalaceButton';

interface PalaceCardProps {
  palace: SelectPalace;
}

export function PalaceCard({ palace }: PalaceCardProps) {
  return (
    <Card
      className={[
        'group relative flex flex-col overflow-hidden rounded-3xl',

        'shadow-[0_1px_0_inset_rgba(255,255,255,0.5),_0_1px_2px_rgba(0,0,0,0.04),_0_8px_24px_-8px_rgba(0,0,0,0.08)]',
        'dark:shadow-[0_1px_0_inset_rgba(255,255,255,0.06),_0_1px_2px_rgba(0,0,0,0.4),_0_12px_32px_-12px_rgba(0,0,0,0.6)]',
        'transition-all duration-300 ease-out',
        'hover:-translate-y-0.5 hover:shadow-[0_1px_0_inset_rgba(255,255,255,0.6),_0_2px_4px_rgba(0,0,0,0.04),_0_18px_40px_-12px_rgba(0,0,0,0.12)]',
        'dark:hover:shadow-[0_1px_0_inset_rgba(255,255,255,0.08),_0_2px_4px_rgba(0,0,0,0.5),_0_24px_48px_-12px_rgba(0,0,0,0.7)]',
      ].join(' ')}
    >
      <CardHeader className="flex-1 pb-3">
        <CardTitle className="text-base">
          <Link
            href={`/palaces/${palace.id}`}
            className="hover:text-primary hover:underline underline-offset-4"
          >
            {palace.title}
          </Link>
        </CardTitle>
        {palace.description ? (
          <CardDescription className="line-clamp-2">{palace.description}</CardDescription>
        ) : null}
      </CardHeader>
      <CardFooter className="flex-wrap gap-2 pt-0">
        <EditPalaceDialog palace={palace} />
        <DuplicatePalaceButton id={palace.id} title={palace.title} />
        <DeletePalaceButton id={palace.id} title={palace.title} />
      </CardFooter>
    </Card>
  );
}
