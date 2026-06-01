'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';

export default function DashboardError({
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
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        px: 3,
        textAlign: 'center',
      }}
    >
      <Box
        sx={{
          width: 80,
          height: 80,
          borderRadius: 4,
          background: 'rgba(239,68,68,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#EF4444',
          mb: 3,
        }}
      >
        <ErrorOutlineRoundedIcon sx={{ fontSize: 40 }} />
      </Box>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }}>
        Terjadi Kesalahan
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 400, mb: 4 }}>
        Maaf, sistem mengalami kendala saat memuat data atau memproses permintaan Anda.
        Silakan coba muat ulang halaman atau kembali lagi nanti.
      </Typography>
      <Button
        variant="contained"
        onClick={() => reset()}
        sx={{
          background: '#EF4444',
          '&:hover': { background: '#DC2626' },
          fontWeight: 600,
          px: 4,
          py: 1,
          borderRadius: 2,
        }}
      >
        Coba Lagi
      </Button>
    </Box>
  );
}
