import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { MotionProvider } from '@/shared/components/MotionProvider';
import { ThemeProvider } from '@/shared/components/ThemeProvider';
import { SkipToContent } from '@/shared/components/SkipToContent';
import { env } from '@/shared/lib/env';
import './globals.css';

const siteUrl =
  env.NEXT_PUBLIC_SITE_URL ??
  (env.VERCEL_URL ? `https://${env.VERCEL_URL}` : 'http://localhost:3000');

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
  // Authenticated routes are not crawlable — keep them private.
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <SkipToContent />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <MotionProvider>{children}</MotionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

export default RootLayout;
