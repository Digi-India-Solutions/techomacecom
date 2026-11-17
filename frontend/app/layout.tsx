import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import './globals.css';
import AppLayoutClient from '@/components/layout/AppLayoutClient';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-poppins',
  display: 'swap',
});


export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: 'Buy Denmed - Medical & Dental Equipment, Instruments & Consumables Store',
  description: 'Pan-India online store for genuine medical and dental equipment, oxygen concentrators, CPAP/BiPAP, handpieces, operatory chairs, monthly rentals, and home sleep diagnostic tests with GST tax invoices.',
  keywords: [
    'Buy Denmed',
    'dental equipment india',
    'medical equipment online',
    'oxygen concentrator buy rent',
    'resmed cpap bipap',
    'dental handpieces',
    'autoclave class b',
    'home sleep test',
    'medical consumables'
  ],
  authors: [{ name: 'Buy Denmed Healthcare' }],
  openGraph: {
    title: 'Buy Denmed - Medical & Dental Equipment Store India',
    description: '100% Genuine medical and dental equipment with pan-India delivery, easy EMI, and equipment rentals.',
    type: 'website',
    locale: 'en_IN',
    siteName: 'Buy Denmed'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Buy Denmed - Medical & Dental Equipment Store India',
    description: 'Pan-India B2C & B2B medical and dental equipment, instruments, consumables, rentals, and sleep diagnostic tests.'
  },
  icons: {
    icon: '/assets/aistudio/favicon_eead005f.jpeg',
    shortcut: '/assets/aistudio/favicon_eead005f.jpeg',
    apple: '/assets/aistudio/favicon_eead005f.jpeg'
  }
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={poppins.variable}>
      <head>
        <link rel="icon" href="/assets/aistudio/favicon_eead005f.jpeg" type="image/jpeg" />
      </head>
      <body suppressHydrationWarning className="font-body antialiased bg-[#F6F9FD] text-[#12263F]">
        <AppLayoutClient>{children}</AppLayoutClient>
      </body>
    </html>
  );
}
