import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import ThemeRegistry from '@/lib/mui/ThemeRegistry';
import { AppProvider } from '@/lib/context/AppContext';
import ServiceWorkerRegistration from '@/components/common/ServiceWorkerRegistration';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'KasKu – Pencatatan Keuangan',
    template: '%s | KasKu',
  },
  description:
    'Aplikasi pencatatan keuangan pribadi dan usaha kecil. Catat arus kas, kelola saldo per periode, dan lihat laporan keuangan dengan mudah.',
  keywords: ['keuangan', 'pencatatan', 'kas masuk', 'kas keluar', 'laporan keuangan'],
  appleWebApp: {
    capable: true,
    title: 'KasKu',
    statusBarStyle: 'black-translucent',
  },
  icons: {
    icon: '/icons/icon-192x192.png',
    apple: '/icons/icon-192x192.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#7C3AED',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={inter.variable} suppressHydrationWarning>
      <body>
        <ThemeRegistry>
          <AppProvider>{children}</AppProvider>
        </ThemeRegistry>
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
