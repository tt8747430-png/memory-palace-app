/**
 * Shared className tokens for the cinematic-dark auth surface.
 *
 * Forms render directly on the dark `liquid-glass` panel inside AuthShell,
 * so we can't rely on the default light `bg-background`/`text-foreground`
 * shadcn defaults — every input/label/link/button gets a per-instance dark
 * override sourced from this module.
 */
export const authLabelClass = 'text-sm font-medium text-white';

export const authInputClass = [
  'border-white/10 bg-white/5 text-white',
  'placeholder:text-white/40',
  'focus-visible:ring-white/30 focus-visible:ring-offset-0',
].join(' ');

export const authMutedTextClass = 'text-white/60';

export const authLinkClass = 'text-white underline-offset-4 hover:underline';

export const authSubmitButtonClass = [
  'liquid-glass w-full h-12 rounded-full bg-transparent text-base text-white',
  'transition-transform hover:scale-[1.02] active:scale-[0.98]',
  'disabled:opacity-60 disabled:hover:scale-100',
].join(' ');
