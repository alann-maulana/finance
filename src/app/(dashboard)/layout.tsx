'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';

import { useAppContext } from '@/lib/context/AppContext';
import LoadingScreen from '@/components/common/LoadingScreen';
import Navbar from '@/components/common/Navbar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, vendorId } = useAppContext();
  const router = useRouter();

  // Client-side guard as a secondary protection layer
  useEffect(() => {
    if (!loading) {
      if (!user) router.replace('/login');
      else if (!vendorId) router.replace('/connect-vendor');
    }
  }, [user, loading, vendorId, router]);

  // Show loading while auth resolves
  if (loading || !user || !vendorId) {
    return <LoadingScreen />;
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        // Leave room for fixed bottom navbar
        pb: '64px',
        background: 'linear-gradient(180deg, #0A0A15 0%, #0D0D20 100%)',
      }}
    >
      <Box component="main" sx={{ flex: 1 }}>
        {children}
      </Box>
      <Navbar />
    </Box>
  );
}

