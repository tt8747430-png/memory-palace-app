import { Download } from 'lucide-react';
import { buttonVariants, cn } from '@memory-palace/ui';

/**
 * Triggers a palace data export via GET /api/export.
 *
 * Using <a download> rather than window.location.href:
 *   - Semantically correct for file downloads (no JS required).
 *   - The browser surfaces 4xx/5xx as a network error instead of silently
 *     navigating into an error page.
 *   - Works without JavaScript.
 */
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
