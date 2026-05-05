/**
 * Shared action response types used by all server actions that return data
 * to direct callers (TanStack Query, event handlers, etc.).
 *
 * Auth form actions use a separate AuthFormState type for useActionState flows.
 */

export type ErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION_FAILED'
  | 'CONFLICT'
  | 'TOO_MANY_REQUESTS'
  | 'INTERNAL_ERROR';

export type ActionResponse<T> =
  | { success: true; data: T }
  | { success: false; error: { code: ErrorCode; message: string } };

/** Opaque cursor for keyset-based pagination. Encode/decode via `src/shared/lib/cursor.ts`. */
export type CursorPage<T> = {
  items: T[];
  /** null when there are no more pages. */
  nextCursor: string | null;
};
