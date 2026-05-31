'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';
import type { Metadata } from 'next';

import { signInWithGoogle } from '@/lib/firebase/auth';
import { getUserVendor } from '@/lib/firebase/firestore';
import { useAppContext } from '@/lib/context/AppContext';
import GoogleSignInButton from '@/components/common/GoogleSignInButton';
import { APP_VERSION } from '@/lib/version';

export default function LoginPage() {
  const router = useRouter();
  const { user, loading, vendorId, setVendorInfo } = useAppContext();
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Prefetch post-login destinations eagerly so the redirect after
  // Google Sign-In is instant with no server round-trip.
  useEffect(() => {
    router.prefetch('/connect-vendor');
    router.prefetch('/dashboard');
  }, [router]);

  // Already logged in — redirect
  useEffect(() => {
    if (!loading && user) {
      if (vendorId) {
        router.replace('/dashboard');
      } else {
        router.replace('/connect-vendor');
      }
    }
  }, [loading, user, vendorId, router]);

  const handleGoogleSignIn = async () => {
    setError(null);
    setSigningIn(true);
    try {
      const firebaseUser = await signInWithGoogle();
      const vendor = await getUserVendor(firebaseUser.uid);
      if (vendor) {
        setVendorInfo(vendor.vendorId, vendor.role, vendor.vendorCode, vendor.vendorName);
        router.replace('/dashboard');
      } else {
        router.replace('/connect-vendor');
      }
    } catch (err: unknown) {
      console.error(err);
      const msg =
        err instanceof Error && err.message.includes('popup-closed')
          ? 'Login dibatalkan.'
          : 'Login gagal. Periksa koneksi internet dan coba lagi.';
      setError(msg);
      setSigningIn(false);
    }
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
        background: 'linear-gradient(135deg, #0A0A15 0%, #1A0A3A 55%, #0A1530 100%)',
        px: 2,
      }}
    >
      {/* ── Decorative background blobs ── */}
      <Box
        className="animate-float-slow"
        sx={{
          position: 'absolute',
          top: '-15%',
          left: '-10%',
          width: { xs: 300, sm: 500 },
          height: { xs: 300, sm: 500 },
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124,58,237,0.25) 0%, transparent 70%)',
          filter: 'blur(40px)',
          pointerEvents: 'none',
        }}
      />
      <Box
        className="animate-float-medium"
        sx={{
          position: 'absolute',
          bottom: '-10%',
          right: '-8%',
          width: { xs: 250, sm: 400 },
          height: { xs: 250, sm: 400 },
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(6,182,212,0.2) 0%, transparent 70%)',
          filter: 'blur(40px)',
          pointerEvents: 'none',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          top: '40%',
          right: '15%',
          width: 180,
          height: 180,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)',
          filter: 'blur(30px)',
          pointerEvents: 'none',
        }}
      />

      {/* ── Main card ── */}
      <Box
        className="animate-fade-in-up glass"
        sx={{
          width: '100%',
          maxWidth: 420,
          borderRadius: '24px',
          p: { xs: 3, sm: 4 },
          zIndex: 1,
        }}
      >
        {/* Logo + Brand */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4 }}>
          {/* Icon */}
          <Box
            className="animate-pulse-glow"
            sx={{
              width: 72,
              height: 72,
              borderRadius: '20px',
              background: 'linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 2.5,
              fontSize: 36,
            }}
          >
            💰
          </Box>

          <Typography
            component="h1"
            variant="h3"
            className="gradient-text"
            sx={{ fontWeight: 800, mb: 0.5, textAlign: 'center' }}
          >
            KasKu
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: 'text.secondary', textAlign: 'center', lineHeight: 1.5 }}
          >
            Catat keuanganmu dengan mudah &amp; cerdas
          </Typography>
        </Box>

        {/* Divider */}
        <Divider sx={{ mb: 3, borderColor: 'rgba(124,58,237,0.15)' }} />

        {/* Sign-in section */}
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="subtitle2"
            sx={{ color: 'text.secondary', textAlign: 'center', mb: 2 }}
          >
            Masuk untuk melanjutkan
          </Typography>

          {error && (
            <Alert
              severity="error"
              sx={{ mb: 2, borderRadius: '12px' }}
              onClose={() => setError(null)}
            >
              {error}
            </Alert>
          )}

          <GoogleSignInButton onClick={handleGoogleSignIn} loading={signingIn} />
        </Box>

        {/* Footer */}
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            textAlign: 'center',
            color: 'text.secondary',
            opacity: 0.7,
            lineHeight: 1.6,
          }}
        >
          Dengan masuk, Anda menyetujui{' '}
          <Box component="span" sx={{ color: 'primary.light', cursor: 'pointer' }}>
            Syarat &amp; Ketentuan
          </Box>{' '}
          dan{' '}
          <Box component="span" sx={{ color: 'primary.light', cursor: 'pointer' }}>
            Kebijakan Privasi
          </Box>{' '}
          kami.
        </Typography>

        {/* App Version */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            mt: 2.5,
          }}
        >
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.75,
              px: 1.5,
              py: 0.5,
              borderRadius: '20px',
              background: 'rgba(124,58,237,0.08)',
              border: '1px solid rgba(124,58,237,0.18)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <Box
              sx={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #7C3AED, #06B6D4)',
                boxShadow: '0 0 6px rgba(124,58,237,0.6)',
              }}
            />
            <Typography
              variant="caption"
              sx={{
                color: 'rgba(167,139,250,0.8)',
                fontFamily: 'monospace',
                fontSize: '0.65rem',
                fontWeight: 600,
                letterSpacing: '0.05em',
              }}
            >
              v{APP_VERSION}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
