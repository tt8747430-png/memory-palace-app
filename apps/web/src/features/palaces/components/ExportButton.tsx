'use client';

import { Download } from 'lucide-react';
import { Button } from '@memory-palace/ui';

/**
 * Triggers a palace data export by navigating to GET /api/export.
 * The route handler streams a JSON file attachment — no client-side JSON
 * manipulation required.
 */
export function ExportButton() {
  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-2"
      onClick={() => {
        window.location.href = '/api/export';
      }}
    >
      <Download className="h-4 w-4" />
      Export
    </Button>
  );
}
