'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';

import { useAppContext } from '@/lib/context/AppContext';
import LoadingScreen from '@/components/common/LoadingScreen';

export default function NotVerifiedPage() {
  const router = useRouter();
  const { user, loading, vendorId, isVerified, logout } = useAppContext();

  // Redirect away if conditions change (e.g., admin verifies while page is open)
  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/login');
      } else if (!vendorId) {
        router.replace('/connect-vendor');
      } else if (isVerified === true) {
        router.replace('/dashboard');
      }
    }
  }, [user, loading, vendorId, isVerified, router]);

  if (loading) return <LoadingScreen />;

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #0A0A15 0%, #1A0A2A 55%, #0A1530 100%)',
        px: 2,
        py: 4,
      }}
    >
      {/* Background blobs */}
      <Box
        className="animate-float-slow"
        sx={{
          position: 'absolute',
          top: '-20%',
          right: '-10%',
          width: 450,
          height: 450,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(239,68,68,0.15) 0%, transparent 70%)',
          filter: 'blur(60px)',
          pointerEvents: 'none',
        }}
      />
      <Box
        className="animate-float-medium"
        sx={{
          position: 'absolute',
          bottom: '-15%',
          left: '-8%',
          width: 350,
          height: 350,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124,58,237,0.18) 0%, transparent 70%)',
          filter: 'blur(50px)',
          pointerEvents: 'none',
        }}
      />

      {/* Card */}
      <Box
        className="animate-fade-in-up glass"
        sx={{
          width: '100%',
          maxWidth: 460,
          borderRadius: '24px',
          p: { xs: 3, sm: 4 },
          zIndex: 1,
          textAlign: 'center',
        }}
      >
        {/* Icon */}
        <Box
          className="animate-pulse-glow"
          sx={{
            width: 80,
            height: 80,
            borderRadius: '24px',
            background: 'linear-gradient(135deg, rgba(239,68,68,0.25) 0%, rgba(124,58,237,0.25) 100%)',
            border: '1px solid rgba(239,68,68,0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 40,
            mx: 'auto',
            mb: 3,
          }}
        >
          🔒
        </Box>

        {/* Title */}
        <Typography
          component="h1"
          variant="h5"
          fontWeight={800}
          sx={{ mb: 1, letterSpacing: '-0.02em' }}
        >
          Akun Belum Terverifikasi
        </Typography>

        <Typography
          variant="body2"
          sx={{ color: 'text.secondary', mb: 3, lineHeight: 1.7 }}
        >
          Akun Anda sudah terdaftar, namun belum mendapatkan akses penuh ke aplikasi.
          Silakan hubungi admin untuk melakukan verifikasi akun Anda secara manual.
        </Typography>

        <Divider sx={{ mb: 3, borderColor: 'rgba(124,58,237,0.15)' }} />

        {/* Contact info box */}
        <Box
          sx={{
            background: 'rgba(124,58,237,0.08)',
            border: '1px solid rgba(124,58,237,0.2)',
            borderRadius: '16px',
            px: 3,
            py: 2.5,
            mb: 3,
          }}
        >
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              color: 'text.secondary',
              mb: 0.5,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              fontSize: '0.65rem',
              fontWeight: 600,
            }}
          >
            Email terdaftar
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: 'primary.light',
              fontWeight: 600,
              wordBreak: 'break-all',
            }}
          >
            {user?.email ?? '—'}
          </Typography>
        </Box>

        {/* Info steps */}
        <Box sx={{ textAlign: 'left', mb: 3 }}>
          {[
            { icon: '📧', text: 'Hubungi admin dengan mencantumkan email Anda di atas' },
            { icon: '⏳', text: 'Tunggu konfirmasi dari admin bahwa akun telah diverifikasi' },
            { icon: '✅', text: 'Login kembali untuk mendapatkan akses penuh' },
          ].map((item, i) => (
            <Box
              key={i}
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 1.5,
                mb: 1.5,
                p: 1.5,
                borderRadius: '12px',
                background: 'rgba(255,255,255,0.03)',
              }}
            >
              <Box sx={{ fontSize: 18, lineHeight: 1.4, flexShrink: 0 }}>{item.icon}</Box>
              <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.6 }}>
                {item.text}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Logout button */}
        <Button
          id="not-verified-logout-btn"
          variant="outlined"
          fullWidth
          size="large"
          onClick={handleLogout}
          sx={{
            borderRadius: '12px',
            borderColor: 'rgba(124,58,237,0.4)',
            color: 'primary.light',
            '&:hover': {
              borderColor: 'primary.main',
              background: 'rgba(124,58,237,0.08)',
            },
          }}
        >
          Keluar
        </Button>
      </Box>
    </Box>
  );
}
