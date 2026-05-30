'use client';

import { useEffect, useState } from 'react';
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
  const [value, setValue] = useState(0);

  useEffect(() => {
    const idx = NAV_ITEMS.findIndex((item) => pathname.startsWith(item.path));
    setValue(idx !== -1 ? idx : 0);
  }, [pathname]);

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
        value={value}
        onChange={(_, newValue: number) => {
          setValue(newValue);
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
