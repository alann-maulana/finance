import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import ThemeRegistry from '@/lib/mui/ThemeRegistry';
import { AppProvider } from '@/lib/context/AppContext';

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
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0A0A15',
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
      </body>
    </html>
  );
}
