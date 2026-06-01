'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

// Root-level global error boundary — menangkap error di luar scope layout biasa
// Harus memiliki <html> dan <body> sendiri karena merender di luar layout root
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="id">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0A0A15',
          color: '#fff',
          fontFamily: 'Inter, system-ui, sans-serif',
          textAlign: 'center',
          padding: '24px',
        }}
      >
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: 16,
            background: 'rgba(239,68,68,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 24,
            fontSize: 40,
          }}
        >
          🚨
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 8px' }}>
          Terjadi Kesalahan Kritis
        </h1>
        <p
          style={{
            color: 'rgba(255,255,255,0.6)',
            maxWidth: 360,
            margin: '0 0 32px',
            lineHeight: 1.6,
          }}
        >
          Aplikasi mengalami error yang tidak terduga. Tim kami telah diberitahu
          secara otomatis.
        </p>
        <button
          onClick={() => reset()}
          style={{
            background: '#7C3AED',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '12px 32px',
            fontSize: 15,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Coba Lagi
        </button>
      </body>
    </html>
  );
}
