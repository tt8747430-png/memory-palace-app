import type { User } from '@supabase/supabase-js';
import type { ZodType } from 'zod';
import { getCurrentUser } from './supabase';
import { checkRateLimit } from './ratelimit';
import type { ActionResponse, ErrorCode } from '@/shared/types';

type RateLimitBucket = 'write' | 'search';

interface DefineActionConfig<TInput, TOutput> {
  /**
   * Optional Zod schema for input validation. When omitted, the action
   * receives `undefined` for `input` (used for parameter-less reads/mutations).
   */
  schema?: ZodType<TInput>;
  /**
   * Optional rate limit bucket. Reads typically omit this; mutations and
   * search-style reads should set it.
   */
  rateLimit?: RateLimitBucket;
  /**
   * The handler runs only after auth, rate-limit, and validation succeed.
   * Throw `new ActionError(code, message)` to short-circuit with a typed
   * failure; throw anything else to fall through to INTERNAL_ERROR.
   */
  handler: (ctx: { user: User; input: TInput }) => Promise<TOutput>;
  /** Used in console.error logs and INTERNAL_ERROR fallbacks. */
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

/**
 * Build a server action with auth, rate-limiting, validation, and error
 * envelope handling applied uniformly. The returned function is callable
 * either with raw input (when a schema is provided) or with no arguments.
 */
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
