import type { User } from '@supabase/supabase-js';
import type { ZodType } from 'zod';
import { getCurrentUser } from './supabase';
import { checkRateLimit } from './ratelimit';
import type { ActionResponse, ErrorCode } from '@/shared/types';

type RateLimitBucket = 'write' | 'search';

interface DefineActionConfig<TInput, TOutput> {
  schema?: ZodType<TInput>;

  rateLimit?: RateLimitBucket;

  handler: (ctx: { user: User; input: TInput }) => Promise<TOutput>;

  name: string;
}

export class ActionError extends Error {
  constructor(
    readonly code: ErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'ActionError';
  }
}

export function defineAction<TInput, TOutput>(
  config: DefineActionConfig<TInput, TOutput>,
): (input?: unknown) => Promise<ActionResponse<TOutput>> {
  return async (rawInput) => {
    try {
      const user = await getCurrentUser();
      if (!user) {
        return fail('UNAUTHORIZED', 'Not authenticated.');
      }

      if (config.rateLimit) {
        const { success } = await checkRateLimit(user.id, config.rateLimit);
        if (!success) {
          return fail('TOO_MANY_REQUESTS', 'Too many requests. Please slow down.');
        }
      }

      let input: TInput;
      if (config.schema) {
        const parsed = config.schema.safeParse(rawInput);
        if (!parsed.success) {
          return fail('VALIDATION_FAILED', parsed.error.issues[0]?.message ?? 'Invalid input.');
        }
        input = parsed.data;
      } else {
        input = undefined as TInput;
      }

      const data = await config.handler({ user, input });
      return { success: true, data };
    } catch (err) {
      if (err instanceof ActionError) {
        return fail(err.code, err.message);
      }
      console.error(`[${config.name}]`, err);
      return fail('INTERNAL_ERROR', `Failed to run ${config.name}.`);
    }
  };
}

function fail(code: ErrorCode, message: string): ActionResponse<never> {
  return { success: false, error: { code, message } };
}
