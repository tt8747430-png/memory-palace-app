'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

export type DialogId = 'create-palace' | 'create-room';

interface AppDialogContextValue {
  pending: DialogId | null;
  open: (id: DialogId) => void;

  consume: () => void;
}

const AppDialogContext = createContext<AppDialogContextValue | null>(null);

export function AppDialogProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<DialogId | null>(null);
  const open = useCallback((id: DialogId) => setPending(id), []);
  const consume = useCallback(() => setPending(null), []);
  const value = useMemo<AppDialogContextValue>(
    () => ({ pending, open, consume }),
    [pending, open, consume],
  );

  return <AppDialogContext.Provider value={value}>{children}</AppDialogContext.Provider>;
}

export function useAppDialog(): AppDialogContextValue {
  const ctx = useContext(AppDialogContext);
  if (!ctx) {
    throw new Error('useAppDialog must be used inside AppDialogProvider');
  }
  return ctx;
}
