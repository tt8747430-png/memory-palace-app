import { headers } from 'next/headers';
import { env } from './env';

export async function buildCallbackUrl(next: string = '/'): Promise<string> {
  const encodedNext = encodeURIComponent(next);

  if (env.NEXT_PUBLIC_SITE_URL) {
    return `${env.NEXT_PUBLIC_SITE_URL}/callback?next=${encodedNext}`;
  }

  const requestHeaders = await headers();
  const host = requestHeaders.get('x-forwarded-host') ?? requestHeaders.get('host');
  const proto = requestHeaders.get('x-forwarded-proto') ?? 'https';
  if (!host) throw new Error('Cannot derive callback URL: missing Host header.');
  return `${proto}://${host}/callback?next=${encodedNext}`;
}
