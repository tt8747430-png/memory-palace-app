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
    <Card className="flex flex-col">
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
