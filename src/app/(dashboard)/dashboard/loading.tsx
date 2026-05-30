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

function TransactionItem() {
  return (
    <Paper elevation={0} sx={{ ...paperSx, display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
      <Skeleton variant="circular" width={40} height={40} sx={{ bgcolor: skeletonBg, flexShrink: 0 }} />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Skeleton variant="text" width="60%" height={20} sx={{ bgcolor: skeletonBg }} />
        <Skeleton variant="text" width="40%" height={16} sx={{ bgcolor: skeletonBg }} />
      </Box>
      <Skeleton variant="text" width={80} height={22} sx={{ bgcolor: skeletonBg, flexShrink: 0 }} />
    </Paper>
  );
}

export default function Loading() {
  return (
    <Box sx={{ p: 2, maxWidth: 600, mx: 'auto' }}>
      {/* Title area */}
      <Skeleton variant="text" width={180} height={32} sx={{ bgcolor: skeletonBg, mb: 0.5 }} />
      <Skeleton variant="text" width={240} height={18} sx={{ bgcolor: skeletonBg, mb: 3 }} />

      {/* Stat cards - 2 columns */}
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
        {[0, 1].map((i) => (
          <Paper key={i} elevation={0} sx={{ ...paperSx, p: 2.5 }}>
            <Skeleton variant="text" width="70%" height={16} sx={{ bgcolor: skeletonBg, mb: 1 }} />
            <Skeleton variant="text" width="90%" height={28} sx={{ bgcolor: skeletonBg }} />
          </Paper>
        ))}
      </Box>

      {/* Balance card - full width */}
      <Paper elevation={0} sx={{ ...paperSx, p: 3, mb: 3 }}>
        <Skeleton variant="text" width="40%" height={16} sx={{ bgcolor: skeletonBg, mb: 1 }} />
        <Skeleton variant="text" width="70%" height={36} sx={{ bgcolor: skeletonBg }} />
      </Paper>

      {/* Transaksi Terakhir section title */}
      <Skeleton variant="text" width={160} height={24} sx={{ bgcolor: skeletonBg, mb: 2 }} />

      {/* 5 transaction items */}
      {[0, 1, 2, 3, 4].map((i) => (
        <TransactionItem key={i} />
      ))}
    </Box>
  );
}
