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

export type CursorPage<T> = {
  items: T[];

  nextCursor: string | null;
};
