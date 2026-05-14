import type { ComponentPropsWithoutRef, HTMLAttributes, Ref } from 'react';
import { Command as CommandPrimitive } from 'cmdk';
import { Search } from 'lucide-react';
import { cn } from '../lib/cn';

export function Command({
  className,
  ref,
  ...props
}: ComponentPropsWithoutRef<typeof CommandPrimitive> & { ref?: Ref<HTMLDivElement> }) {
  return (
    <CommandPrimitive
      ref={ref}
      className={cn(
        'flex h-full w-full flex-col overflow-hidden rounded-xl bg-popover text-popover-foreground',
        className,
      )}
      {...props}
    />
  );
}

export function CommandInput({
  className,
  ref,
  ...props
}: ComponentPropsWithoutRef<typeof CommandPrimitive.Input> & { ref?: Ref<HTMLInputElement> }) {
  return (
    <div className="flex items-center border-b px-3" cmdk-input-wrapper="">
      <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" aria-hidden />
      <CommandPrimitive.Input
        ref={ref}
        className={cn(
          'flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none',
          'placeholder:text-muted-foreground',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        {...props}
      />
    </div>
  );
}

export function CommandList({
  className,
  ref,
  ...props
}: ComponentPropsWithoutRef<typeof CommandPrimitive.List> & { ref?: Ref<HTMLDivElement> }) {
  return (
    <CommandPrimitive.List
      ref={ref}
      className={cn('max-h-[300px] overflow-y-auto overflow-x-hidden', className)}
      {...props}
    />
  );
}

export const CommandEmpty = CommandPrimitive.Empty;

export function CommandGroup({
  className,
  ref,
  ...props
}: ComponentPropsWithoutRef<typeof CommandPrimitive.Group> & { ref?: Ref<HTMLDivElement> }) {
  return (
    <CommandPrimitive.Group
      ref={ref}
      className={cn(
        'overflow-hidden p-1 text-foreground',
        '[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5',
        '[&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground',
        className,
      )}
      {...props}
    />
  );
}

export function CommandSeparator({
  className,
  ref,
  ...props
}: ComponentPropsWithoutRef<typeof CommandPrimitive.Separator> & { ref?: Ref<HTMLDivElement> }) {
  return (
    <CommandPrimitive.Separator
      ref={ref}
      className={cn('-mx-1 h-px bg-border', className)}
      {...props}
    />
  );
}

export function CommandItem({
  className,
  ref,
  ...props
}: ComponentPropsWithoutRef<typeof CommandPrimitive.Item> & { ref?: Ref<HTMLDivElement> }) {
  return (
    <CommandPrimitive.Item
      ref={ref}
      className={cn(
        'relative flex cursor-default select-none items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none',
        'data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground',
        'data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50',
        '[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
        className,
      )}
      {...props}
    />
  );
}

export function CommandShortcut({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn('ml-auto text-xs tracking-widest text-muted-foreground', className)}
      {...props}
    />
  );
}
