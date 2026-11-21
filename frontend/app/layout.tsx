import type { Metadata } from 'next';
import './globals.css';
import AppLayoutClient from '@/components/layout/AppLayoutClient';
import SiteSettingsProvider from '@/components/providers/SiteSettingsProvider';
import { getSiteSettings } from '@/lib/settings/server';

const DEFAULT_ICON = '/assets/aistudio/favicon_eead005f.jpeg';

/** Title, description and favicon follow Settings → Store (cached 30 s). */
export async function generateMetadata(): Promise<Metadata> {
  const { store } = await getSiteSettings();
  const brand = store.brandName || 'Buy Denmed';
  const icon = store.faviconUrl || DEFAULT_ICON;
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
    title: `${brand} - Medical & Dental Equipment, Instruments & Consumables Store`,
    description:
      'Pan-India online store for genuine medical and dental equipment, oxygen concentrators, CPAP/BiPAP, handpieces, operatory chairs, monthly rentals, and home sleep diagnostic tests with GST tax invoices.',
    keywords: [
      brand,
      'dental equipment india',
      'medical equipment online',
      'oxygen concentrator buy rent',
      'resmed cpap bipap',
      'dental handpieces',
      'autoclave class b',
      'home sleep test',
      'medical consumables'
    ],
    authors: [{ name: store.storeName }],
    openGraph: {
      title: `${brand} - Medical & Dental Equipment Store India`,
      description: '100% Genuine medical and dental equipment with pan-India delivery, easy EMI, and equipment rentals.',
      type: 'website',
      locale: 'en_IN',
      siteName: brand,
      ...(store.logoUrl ? { images: [{ url: store.logoUrl }] } : {})
    },
    twitter: {
      card: 'summary_large_image',
      title: `${brand} - Medical & Dental Equipment Store India`,
      description: 'Pan-India B2C & B2B medical and dental equipment, instruments, consumables, rentals, and sleep diagnostic tests.'
    },
    icons: { icon, shortcut: icon, apple: icon }
  };
}

export default async function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const settings = await getSiteSettings();
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,300;1,400;1,500;1,600;1,700;1,800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning className="font-body antialiased bg-[#F6F9FD] text-[#12263F]">
        <SiteSettingsProvider settings={settings}>
          <AppLayoutClient>{children}</AppLayoutClient>
        </SiteSettingsProvider>
      </body>
    </html>
  );
}
