import type { Metadata, Viewport } from 'next';
import { headers } from 'next/headers';
import type { ReactNode } from 'react';
import { Geist, Geist_Mono, Space_Grotesk, Instrument_Serif, Barlow } from 'next/font/google';
import { MotionProvider } from '@/shared/components/MotionProvider';
import { ThemeProvider } from '@/shared/components/ThemeProvider';
import { SkipToContent } from '@/shared/components/SkipToContent';
import { StandaloneGestureGuard } from '@/shared/components/StandaloneGestureGuard';
import { ServiceWorkerRegistrar } from '@/shared/components/ServiceWorkerRegistrar';
import { PostHogProvider } from '@/shared/components/PostHogProvider';
import { Toaster } from '@/shared/components/Toaster';
import { siteUrl } from '@/shared/lib/env';
import { SPLASH_LINKS } from './_splash-sizes';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
  preload: false,
});

const spaceGrotesk = Space_Grotesk({
  variable: '--font-space-grotesk',
  subsets: ['latin'],
  display: 'swap',
  preload: false,
});

const instrumentSerif = Instrument_Serif({
  variable: '--font-instrument-serif',
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  display: 'swap',
  preload: false,
});

const barlow = Barlow({
  variable: '--font-barlow',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
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
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  interactiveWidget: 'resizes-content',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
};

async function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  const nonce = (await headers()).get('x-nonce') ?? '';
  return (
    <html lang="en" suppressHydrationWarning nonce={nonce} data-scroll-behavior="smooth">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable} ${instrumentSerif.variable} ${barlow.variable} antialiased`}
      >
        {SPLASH_LINKS.map(({ href, media }) => (
          <link key={href} rel="apple-touch-startup-image" href={href} media={media} />
        ))}
        <SkipToContent />
        <StandaloneGestureGuard />
        <ServiceWorkerRegistrar />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <PostHogProvider>
            <MotionProvider>{children}</MotionProvider>
          </PostHogProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}

export default RootLayout;
