'use client';

import { Download } from 'lucide-react';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@memory-palace/ui';

/**
 * Triggers a palace data export by navigating to GET /api/export.
 * The route handler streams a JSON file attachment — no client-side JSON
 * manipulation required.
 */
export function ExportDataCard() {
  function handleExport() {
    // An anchor-style navigation lets the browser handle the
    // Content-Disposition: attachment header natively without any fetch/blob
    // plumbing, and works correctly in all browsers.
    window.location.href = '/api/export';
  }

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>Export Data</CardTitle>
        <CardDescription>
          Download all your palaces, rooms, and nodes as a JSON file. Use this as a backup or to
          migrate to another account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant="outline" size="md" className="gap-2" onClick={handleExport}>
          <Download className="h-4 w-4" />
          Download Export
        </Button>
      </CardContent>
    </Card>
  );
}
