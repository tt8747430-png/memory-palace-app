'use client';

import { createContext, useContext, type ReactNode } from 'react';

export interface SearchResult {
  id: string;
  title: string;
  content: string | null;
  nodeType: string;
  roomId: string;
  palaceId: string;
  createdAt: Date;
}

type SearchFn = (input: {
  query: string;
  limit: number;
}) => Promise<
  | { success: true; data: SearchResult[] }
  | { success: false; error: { code: string; message: string } }
>;

const SearchContext = createContext<SearchFn | null>(null);

export function SearchProvider({ children, value }: { children: ReactNode; value: SearchFn }) {
  return <SearchContext.Provider value={value}>{children}</SearchContext.Provider>;
}

export function useSearch(): SearchFn | null {
  return useContext(SearchContext);
}
