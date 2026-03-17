import { getRequestConfig } from 'next-intl/server';

// next-intl request configuration — Phase 1.B.5
// Single locale (en) for now; add routing-based locale detection when needed.
export default getRequestConfig(async () => ({
  locale: 'en',
  messages: (await import('../../messages/en.json')).default,
}));
