import type { Metadata } from 'next';
import { Varela_Round, Nunito_Sans } from 'next/font/google';
import './globals.css';

const varela = Varela_Round({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
});

const nunito = Nunito_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Tính Lương | Coffee Shop',
  description: 'Calculate employee salaries from Google Sheets schedule',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site-manifest.json',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" suppressHydrationWarning className={`${varela.variable} ${nunito.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
