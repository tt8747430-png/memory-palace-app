import { Download } from 'lucide-react';
import { buttonVariants, cn } from '@/ui';

export function ExportButton() {
  return (
    <a
      href="/api/export"
      download
      className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-2')}
    >
      <Download className="h-4 w-4" aria-hidden />
      Export
    </a>
  );
}
