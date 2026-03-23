'use client';

import { Sheet, SheetContent, SheetTitle, SheetDescription, SheetTrigger } from '@memory-palace/ui';
import { Menu } from 'lucide-react';
import { Sidebar } from './Sidebar';

export function MobileDrawer() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          type="button"
          className="min-h-touch min-w-touch rounded-full p-2"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
        <SheetTitle className="sr-only">Navigation menu</SheetTitle>
        <SheetDescription className="sr-only">
          Main navigation links for Memory Palace
        </SheetDescription>
        <Sidebar />
      </SheetContent>
    </Sheet>
  );
}
