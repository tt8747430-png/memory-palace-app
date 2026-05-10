/**
 * Shared className tokens for the cinematic-dark onboarding wizard.
 *
 * The wizard renders inside `liquid-glass` panels on the cinematic /join
 * page, so its inputs/labels/buttons need explicit dark overrides. Mirrors
 * the auth feature's `authStyles` (cross-feature import is forbidden by
 * the boundaries lint rule) so the two surfaces stay visually identical.
 */
export const onboardingLabelClass = 'font-body text-sm font-medium text-white';

export const onboardingInputClass = [
  'border-white/10 bg-white/5 text-white',
  'placeholder:text-white/40',
  'focus-visible:ring-white/30 focus-visible:ring-offset-0',
].join(' ');

export const onboardingMutedTextClass = 'font-body text-white/60';

export const onboardingLinkClass = 'text-white underline underline-offset-4 hover:text-white';

/* Glass-pill submit — matches the marketing "Begin Journey" CTA. */
export const onboardingSubmitButtonClass = [
  'liquid-glass w-full h-12 rounded-full bg-transparent text-base text-white',
  'transition-transform hover:scale-[1.02] active:scale-[0.98]',
  'disabled:opacity-60 disabled:hover:scale-100',
].join(' ');
