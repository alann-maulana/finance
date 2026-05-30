import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'KasKu – Pencatatan Keuangan',
    short_name: 'KasKu',
    description:
      'Aplikasi pencatatan keuangan pribadi dan usaha kecil. Catat arus kas, kelola saldo per periode, dan lihat laporan keuangan.',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#0A0A15',
    theme_color: '#7C3AED',
    orientation: 'portrait',
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
