'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { cn } from '@memory-palace/ui';
import { SectionEyebrow } from './SectionEyebrow';
import { BlurText } from '@/shared/components/BlurText';

/**
 * Three-tier pricing with a monthly/yearly toggle.
 *
 * Middle tier is elevated with `liquid-glass-strong` and a gold border to
 * mark it as the recommended plan. The toggle persists only in local
 * state — there is no billing surface yet. CTAs link straight to signup.
 */

type Plan = {
  id: string;
  name: string;
  tagline: string;
  monthly: number | 'custom';
  yearly: number | 'custom';
  highlighted?: boolean;
  features: string[];
  cta: string;
  href: string;
};

const plans: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    tagline: 'One palace, all primitives.',
    monthly: 0,
    yearly: 0,
    features: [
      'One palace, unlimited rooms',
      'Spaced repetition scheduler',
      'Markdown export, anytime',
      'Journey view + statistics',
    ],
    cta: 'Begin Journey',
    href: '/signup',
  },
  {
    id: 'practitioner',
    name: 'Practitioner',
    tagline: 'For serious daily review.',
    monthly: 9,
    yearly: 6,
    highlighted: true,
    features: [
      'Unlimited palaces',
      'Advanced analytics + heatmaps',
      'Priority restore + undo history',
      'Custom themes & accents',
      'Anki / CSV import',
    ],
    cta: 'Start Practitioner',
    href: '/signup?plan=practitioner',
  },
  {
    id: 'cathedral',
    name: 'Cathedral',
    tagline: 'Teams, classrooms, congregations.',
    monthly: 'custom',
    yearly: 'custom',
    features: [
      'Shared palaces & roles',
      'Bulk import & SSO',
      'Dedicated onboarding',
      'Custom integrations',
      'Annual invoicing',
    ],
    cta: 'Talk to us',
    href: 'mailto:hello@memorypalace.app',
  },
];

export function Pricing() {
  const [yearly, setYearly] = useState(true);

  return (
    <section id="pricing" className="relative w-full px-4 py-14 sm:px-6 md:px-10 md:py-20 lg:px-14">
      <div className="mx-auto max-w-6xl">
        <header className="mb-10 max-w-2xl">
          <SectionEyebrow>Pricing &amp; plans</SectionEyebrow>
          <h2 className="mt-3 font-heading text-4xl font-normal leading-[1.05] tracking-[-1.2px] text-foreground md:text-5xl">
            <BlurText text="Build for free. " perWordDelay={60} />
            <em className="not-italic text-muted-foreground">
              <BlurText text="Pay only to go further." perWordDelay={60} startDelay={0.2} />
            </em>
          </h2>
        </header>

        {/* Monthly/Yearly toggle */}
        <div className="mb-10 flex items-center gap-3">
          <div
            role="tablist"
            aria-label="Billing period"
            className="liquid-glass inline-flex items-center gap-1 rounded-full p-1"
          >
            <button
              type="button"
              role="tab"
              aria-selected={!yearly ? 'true' : 'false'}
              onClick={() => setYearly(false)}
              className={cn(
                'rounded-full px-4 py-1.5 font-body text-sm transition-colors',
                !yearly ? 'bg-foreground text-background' : 'text-muted-foreground',
              )}
            >
              Monthly
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={yearly ? 'true' : 'false'}
              onClick={() => setYearly(true)}
              className={cn(
                'rounded-full px-4 py-1.5 font-body text-sm transition-colors',
                yearly ? 'bg-foreground text-background' : 'text-muted-foreground',
              )}
            >
              Yearly
            </button>
          </div>
          <span className="rounded-full bg-emerald/15 px-3 py-1 font-body text-xs uppercase tracking-wider text-emerald">
            30% off yearly
          </span>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {plans.map((plan) => {
            const price = yearly ? plan.yearly : plan.monthly;
            return (
              <article
                key={plan.id}
                className={cn(
                  'flex flex-col rounded-3xl p-6 md:p-8',
                  plan.highlighted
                    ? 'liquid-glass-raised border border-gold/40'
                    : 'liquid-glass border border-foreground/15',
                )}
              >
                <header className="mb-6">
                  <div className="flex items-center justify-between">
                    <h3 className="font-heading text-2xl tracking-tight text-foreground">
                      {plan.name}
                    </h3>
                    {plan.highlighted ? (
                      <span className="rounded-full bg-gold/20 px-2.5 py-0.5 font-body text-[10px] uppercase tracking-wider text-gold">
                        Popular
                      </span>
                    ) : null}
                  </div>
                  <p className="font-body mt-1.5 text-sm text-muted-foreground">{plan.tagline}</p>
                </header>

                <div className="mb-6 flex items-baseline gap-1">
                  {price === 'custom' ? (
                    <span className="font-heading text-4xl tracking-tight text-foreground">
                      Custom
                    </span>
                  ) : (
                    <>
                      <span className="font-heading text-5xl tracking-tight text-foreground">
                        ${price}
                      </span>
                      <span className="font-body text-sm text-muted-foreground">/ month</span>
                    </>
                  )}
                </div>

                <Link
                  href={plan.href}
                  className={cn(
                    'rounded-full px-5 py-3 text-center font-body text-sm transition-transform hover:scale-[1.02]',
                    plan.highlighted ? 'bg-gold text-background' : 'bg-foreground text-background',
                  )}
                >
                  {plan.cta}
                </Link>

                <ul className="mt-8 flex flex-col gap-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald" strokeWidth={2.5} />
                      <span className="font-body text-sm text-foreground/85">{f}</span>
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
