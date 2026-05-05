'use client';

import {
  Button,
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from '@memory-palace/ui';
import { Menu } from 'lucide-react';
import { Sidebar } from './Sidebar';

interface UserProfile {
  displayName: string;
  avatarUrl: string | null;
  email?: string | null;
}

interface MobileDrawerProps {
  userProfile?: UserProfile | null;
}

export function MobileDrawer({ userProfile }: MobileDrawerProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
        <SheetTitle className="sr-only">Navigation menu</SheetTitle>
        <SheetDescription className="sr-only">
          Main navigation links for Memory Palace
        </SheetDescription>
        <Sidebar userProfile={userProfile} />
      </SheetContent>
    </Sheet>
  );
}
