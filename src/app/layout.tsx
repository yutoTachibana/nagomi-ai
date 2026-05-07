import type { Metadata, Viewport } from 'next';
import { Shippori_Mincho, Zen_Maru_Gothic } from 'next/font/google';
import { AuthProvider } from '@/components/providers/AuthProvider';
import './globals.css';

const mincho = Shippori_Mincho({
  weight: ['400', '500', '600'],
  subsets: ['latin'],
  variable: '--font-mincho',
  display: 'swap',
});

const maru = Zen_Maru_Gothic({
  weight: ['400', '500', '700'],
  subsets: ['latin'],
  variable: '--font-maru',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'こもれび',
  description: '木漏れ日のような、長期伴走型メンタルケアアプリ',
  applicationName: 'こもれび',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'こもれび',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: 'こもれび',
    description: '木漏れ日のような、長期伴走型メンタルケアアプリ',
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: '#faf6ef',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" className={`${mincho.variable} ${maru.variable}`}>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
