'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import Paper from '@mui/material/Paper';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import CallReceivedRoundedIcon from '@mui/icons-material/CallReceivedRounded';
import CallMadeRoundedIcon from '@mui/icons-material/CallMadeRounded';
import BarChartRoundedIcon from '@mui/icons-material/BarChartRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';

const NAV_ITEMS = [
  { label: 'Dashboard', icon: <HomeRoundedIcon />, path: '/dashboard' },
  { label: 'Masuk', icon: <CallReceivedRoundedIcon />, path: '/cash-in' },
  { label: 'Keluar', icon: <CallMadeRoundedIcon />, path: '/cash-out' },
  { label: 'Laporan', icon: <BarChartRoundedIcon />, path: '/report' },
  { label: 'Profil', icon: <PersonRoundedIcon />, path: '/profile' },
];

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const idx = NAV_ITEMS.findIndex((item) => pathname.startsWith(item.path));
  const value = idx !== -1 ? idx : 0;

  // Prefetch all dashboard routes eagerly on mount so that tapping any
  // bottom-nav item navigates instantly without waiting for a network round-trip.
  useEffect(() => {
    NAV_ITEMS.forEach(({ path }) => router.prefetch(path));
  }, [router]);

  return (
    <Paper
      elevation={0}
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1200,
        borderRadius: 0,
      }}
    >
      <BottomNavigation
        showLabels
        value={value}
        onChange={(_, newValue: number) => {
          router.push(NAV_ITEMS[newValue].path);
        }}
      >
        {NAV_ITEMS.map((item, i) => (
          <BottomNavigationAction
            key={item.path}
            id={`nav-${item.label.toLowerCase()}`}
            label={item.label}
            icon={item.icon}
            value={i}
          />
        ))}
      </BottomNavigation>
    </Paper>
  );
}
