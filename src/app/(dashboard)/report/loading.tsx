'use client';

import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import Paper from '@mui/material/Paper';

const skeletonBg = 'rgba(124, 58, 237, 0.08)';
const paperSx = {
  bgcolor: '#13132B',
  borderRadius: 3,
  border: '1px solid rgba(124, 58, 237, 0.12)',
  p: 2,
};

export default function Loading() {
  return (
    <Box sx={{ p: 2, maxWidth: 600, mx: 'auto' }}>
      {/* Title area */}
      <Skeleton variant="text" width={120} height={32} sx={{ bgcolor: skeletonBg, mb: 3 }} />

      {/* Period filter - month + year */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <Skeleton variant="rounded" width={140} height={40} sx={{ bgcolor: skeletonBg, borderRadius: 2 }} />
        <Skeleton variant="rounded" width={120} height={40} sx={{ bgcolor: skeletonBg, borderRadius: 2 }} />
      </Box>

      {/* 4 summary cards in 2x2 grid */}
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
        {['Saldo Awal', 'Sisa Saldo', 'Total Pemasukan', 'Total Pengeluaran'].map((_, i) => (
          <Paper key={i} elevation={0} sx={{ ...paperSx, p: 2.5 }}>
            <Skeleton variant="text" width="65%" height={16} sx={{ bgcolor: skeletonBg, mb: 1.5 }} />
            <Skeleton variant="text" width="85%" height={28} sx={{ bgcolor: skeletonBg }} />
          </Paper>
        ))}
      </Box>
    </Box>
  );
}
