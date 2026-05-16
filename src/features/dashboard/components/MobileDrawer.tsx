'use client';

import { useState } from 'react';
import { Button, Sheet, SheetContent, SheetTitle, SheetDescription, SheetTrigger } from '@/ui';
import { Menu } from 'lucide-react';
import { useBodyScrollLock } from '@/shared/hooks/useBodyScrollLock';
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
  const [open, setOpen] = useState(false);
  useBodyScrollLock(open);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
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
      <SheetContent
        side="left"
        onOpenAutoFocus={(event) => event.preventDefault()}
        className="w-[18rem] max-w-[85vw] border-r border-sidebar-border bg-sidebar p-0"
      >
        <SheetTitle className="sr-only">Navigation menu</SheetTitle>
        <SheetDescription className="sr-only">
          Main navigation links for Memory Palace
        </SheetDescription>
        <Sidebar userProfile={userProfile} onNavigate={() => setOpen(false)} forceExpanded />
      </SheetContent>
    </Sheet>
  );
}
