'use client';

import { useReducer, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { StepIndicator } from './StepIndicator';
import { StepCreateAccount } from './steps/StepCreateAccount';
import { StepNamePalace } from './steps/StepNamePalace';
import { StepChooseTheme } from './steps/StepChooseTheme';
import { StepAddNode } from './steps/StepAddNode';
import { StepComplete } from './steps/StepComplete';

const TOTAL_STEPS = 5;

interface WizardState {
  step: number;
  palaceId: string | null;
  roomId: string | null;
}

type WizardAction =
  | { type: 'NEXT' }
  | { type: 'BACK' }
  | { type: 'SET_PALACE'; palaceId: string; roomId: string }
  | { type: 'RESET_TO_SETUP' };

function clamp(n: number) {
  return Math.max(1, Math.min(TOTAL_STEPS, n));
}

function reducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case 'NEXT':
      return { ...state, step: clamp(state.step + 1) };
    case 'BACK':
      return { ...state, step: clamp(state.step - 1) };
    case 'SET_PALACE':
      return {
        ...state,
        palaceId: action.palaceId,
        roomId: action.roomId,
        step: clamp(state.step + 1),
      };
    case 'RESET_TO_SETUP':
      return { step: 2, palaceId: null, roomId: null };
    default:
      return state;
  }
}

function readStepFromParams(searchParams: ReturnType<typeof useSearchParams>): number {
  const raw = parseInt(searchParams.get('step') ?? '1', 10);
  return clamp(Number.isNaN(raw) ? 1 : raw);
}

export function OnboardingWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [state, dispatch] = useReducer(reducer, undefined, () => ({
    step: readStepFromParams(searchParams),
    palaceId: null,
    roomId: null,
  }));

  useEffect(() => {
    router.replace(`/join?step=${state.step}`, { scroll: false });
  }, [state.step, router]);

  const canGoBack = state.step > 1 && state.step < TOTAL_STEPS;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        {canGoBack ? (
          <button
            type="button"
            onClick={() => dispatch({ type: 'BACK' })}
            className="font-body text-sm text-white/60 transition-colors hover:text-white"
            aria-label="Go back"
          >
            ← Back
          </button>
        ) : (
          <span />
        )}
        <StepIndicator current={state.step} total={TOTAL_STEPS} />
        <span aria-hidden className="w-12" />
      </div>

      <div className="w-full">
        {state.step === 1 && <StepCreateAccount onSuccess={() => dispatch({ type: 'NEXT' })} />}
        {state.step === 2 && (
          <StepNamePalace
            onSuccess={(palaceId, roomId) => dispatch({ type: 'SET_PALACE', palaceId, roomId })}
          />
        )}
        {state.step === 3 && state.palaceId ? (
          <StepChooseTheme palaceId={state.palaceId} onSuccess={() => dispatch({ type: 'NEXT' })} />
        ) : state.step === 3 ? (
          <div className="space-y-4 text-center">
            <p className="font-body text-white/60">
              Your session was interrupted. Let&rsquo;s pick up where you left off.
            </p>
            <button
              type="button"
              onClick={() => dispatch({ type: 'RESET_TO_SETUP' })}
              className="font-body text-sm text-white underline underline-offset-4 hover:text-white"
            >
              Go back to palace setup
            </button>
          </div>
        ) : null}
        {state.step === 4 && state.roomId ? (
          <StepAddNode roomId={state.roomId} onSuccess={() => dispatch({ type: 'NEXT' })} />
        ) : state.step === 4 ? (
          <div className="space-y-4 text-center">
            <p className="font-body text-white/60">
              Your session was interrupted. Let&rsquo;s pick up where you left off.
            </p>
            <button
              type="button"
              onClick={() => dispatch({ type: 'RESET_TO_SETUP' })}
              className="font-body text-sm text-white underline underline-offset-4 hover:text-white"
            >
              Go back to palace setup
            </button>
          </div>
        ) : null}
        {state.step === 5 && <StepComplete />}
      </div>
    </div>
  );
}
