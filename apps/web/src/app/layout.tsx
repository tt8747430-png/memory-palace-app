import type { Metadata, Viewport } from 'next';
import { headers } from 'next/headers';
import { Geist, Geist_Mono } from 'next/font/google';
import { MotionProvider } from '@/shared/components/MotionProvider';
import { ThemeProvider } from '@/shared/components/ThemeProvider';
import { SkipToContent } from '@/shared/components/SkipToContent';
import { PostHogProvider } from '@/shared/components/PostHogProvider';
import { siteUrl } from '@/shared/lib/env';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  display: 'swap',
});
// Mono is exposed for future <code>/<pre> usage; it is never rendered on the
// initial paint, so disabling preload silences the "preloaded but not used"
// console warning and saves the round-trip on the critical path.
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Memory Palace',
    template: '%s | Memory Palace',
  },
  description: 'A spatial learning platform using virtual palaces with draggable memory nodes',
  keywords: ['memory palace', 'spatial learning', 'mnemonics', 'study', 'memory technique'],
  openGraph: {
    type: 'website',
    siteName: 'Memory Palace',
    title: 'Memory Palace',
    description: 'A spatial learning platform using virtual palaces with draggable memory nodes',
  },
  twitter: {
    card: 'summary',
    title: 'Memory Palace',
    description: 'A spatial learning platform using virtual palaces with draggable memory nodes',
  },
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: '32x32', type: 'image/x-icon' },
    ],
    apple: '/apple-icon',
  },
  // Authenticated routes are not crawlable — keep them private.
  robots: { index: false, follow: false },
  appleWebApp: {
    capable: true,
    title: 'Memory Palace',
    statusBarStyle: 'black-translucent',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // x-nonce is injected by proxy.ts for every pass-through request so that
  // Script components can forward it to browser-side <script> tags, satisfying
  // the per-request nonce-based CSP.
  const nonce = (await headers()).get('x-nonce') ?? '';
  return (
    <html lang="en" suppressHydrationWarning nonce={nonce}>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <SkipToContent />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <PostHogProvider>
            <MotionProvider>{children}</MotionProvider>
          </PostHogProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

export default RootLayout;
