'use client';

import { type ComponentPropsWithoutRef, type HTMLAttributes, type Ref, useRef } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/ui';
import { useDragToDismiss } from '../lib/useDragToDismiss';

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;
export const DialogPortal = DialogPrimitive.Portal;

export function DialogOverlay({
  className,
  ref,
  ...props
}: ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay> & {
  ref?: Ref<HTMLDivElement>;
}) {
  return (
    <DialogPrimitive.Overlay
      ref={ref}
      className={cn(
        'fixed inset-0 z-50 bg-black/60',
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        className,
      )}
      {...props}
    />
  );
}
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

export function DialogContent({
  className,
  children,
  ref,
  ...props
}: ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
  ref?: Ref<HTMLDivElement>;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const drag = useDragToDismiss(() => closeRef.current?.click());

  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={(node) => {
          drag.ref.current = node;
          if (typeof ref === 'function') ref(node);
          else if (ref) (ref as { current: HTMLDivElement | null }).current = node;
        }}
        className={cn(
          'fixed inset-x-0 bottom-0 z-50 w-full max-h-[92dvh] overflow-y-auto',
          'rounded-t-2xl border-x-0 border-b-0 border-t bg-background pb-6 pl-6 pr-6 pt-3 shadow-2xl',
          'data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',

          'sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:max-h-[85dvh] sm:w-full sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2',
          'sm:rounded-lg sm:border sm:pb-6 sm:pt-6',
          'sm:data-[state=closed]:slide-out-to-left-1/2 sm:data-[state=closed]:slide-out-to-top-[48%]',
          'sm:data-[state=open]:slide-in-from-left-1/2 sm:data-[state=open]:slide-in-from-top-[48%]',
          'sm:data-[state=closed]:zoom-out-95 sm:data-[state=open]:zoom-in-95',

          'data-[state=open]:animate-in data-[state=closed]:animate-out',
          'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
          className,
        )}
        {...props}
      >
        <div
          aria-hidden
          onPointerDown={drag.onPointerDown}
          onPointerMove={drag.onPointerMove}
          onPointerUp={drag.onPointerUp}
          onPointerCancel={drag.onPointerUp}
          className="mx-auto mb-3 flex h-6 w-full max-w-[80%] cursor-grab touch-none items-center justify-center sm:hidden"
        >
          <span className="h-1.5 w-10 rounded-full bg-muted-foreground/30" />
        </div>
        {children}
        <DialogPrimitive.Close
          className={cn(
            'absolute right-3 top-3 inline-flex min-h-touch min-w-touch items-center justify-center rounded-md opacity-70 transition-opacity',
            'hover:opacity-100',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            'disabled:pointer-events-none',
          )}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>

        <DialogPrimitive.Close ref={closeRef} className="hidden" tabIndex={-1} aria-hidden />
      </DialogPrimitive.Content>
    </DialogPortal>
  );
}
DialogContent.displayName = DialogPrimitive.Content.displayName;

export function DialogHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex flex-col space-y-1.5 text-center sm:text-left', className)}
      {...props}
    />
  );
}

export function DialogFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex flex-col-reverse gap-2 pt-4 sm:flex-row sm:justify-end', className)}
      {...props}
    />
  );
}

export function DialogTitle({
  className,
  ref,
  ...props
}: ComponentPropsWithoutRef<typeof DialogPrimitive.Title> & {
  ref?: Ref<HTMLHeadingElement>;
}) {
  return (
    <DialogPrimitive.Title
      ref={ref}
      className={cn('text-lg font-semibold leading-none tracking-tight', className)}
      {...props}
    />
  );
}
DialogTitle.displayName = DialogPrimitive.Title.displayName;

export function DialogDescription({
  className,
  ref,
  ...props
}: ComponentPropsWithoutRef<typeof DialogPrimitive.Description> & {
  ref?: Ref<HTMLParagraphElement>;
}) {
  return (
    <DialogPrimitive.Description
      ref={ref}
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  );
}
DialogDescription.displayName = DialogPrimitive.Description.displayName;
