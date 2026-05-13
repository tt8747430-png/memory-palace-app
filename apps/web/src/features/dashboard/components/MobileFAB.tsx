'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Plus, Search } from 'lucide-react';
import { cn } from '@memory-palace/ui';
import { useCommandPalette } from '@/shared/components/CommandPaletteContext';

function useFABAction(pathname: string): { label: string; href: string } {
  if (pathname.startsWith('/palaces/') && pathname.includes('/rooms/')) {
    return { label: 'New Memory', href: `${pathname}?action=new-memory` };
  }
  if (pathname.startsWith('/palaces/') && !pathname.includes('/rooms')) {
    return { label: 'New Room', href: `${pathname}?action=new-room` };
  }
  return { label: 'New Palace', href: '/palaces?action=new' };
}

export function MobileFAB() {
  const pathname = usePathname();
  const router = useRouter();
  const { openPalette } = useCommandPalette();
  const { label, href } = useFABAction(pathname);

  return (
    <div className="flex items-center gap-2 px-4 pb-3 pt-2">
      {/* Primary pill CTA */}
      <button
        type="button"
        onClick={() => router.push(href)}
        className={cn(
          'flex h-12 flex-1 items-center justify-center gap-[7px] rounded-full',
          'bg-foreground text-background',
          'text-[15px] font-semibold tracking-[-0.01em]',
          'transition-transform duration-100 active:scale-[0.97]',
        )}
      >
        <Plus className="h-[18px] w-[18px]" strokeWidth={2.5} aria-hidden />
        <span>{label}</span>
      </button>

      {/* Quick search / command palette */}
      <button
        type="button"
        onClick={openPalette}
        aria-label="Quick search"
        className={cn(
          'flex h-12 w-12 shrink-0 items-center justify-center rounded-full',
          'bg-foreground text-background',
          'transition-transform duration-100 active:scale-[0.97]',
        )}
      >
        <Search className="h-[18px] w-[18px]" strokeWidth={2.5} aria-hidden />
      </button>
    </div>
  );
}
