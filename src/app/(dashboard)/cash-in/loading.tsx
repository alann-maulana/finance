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
      {/* Title area with back navigation */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <Skeleton variant="circular" width={36} height={36} sx={{ bgcolor: skeletonBg, flexShrink: 0 }} />
        <Skeleton variant="text" width={140} height={32} sx={{ bgcolor: skeletonBg }} />
      </Box>

      {/* Period filter row - year selector */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <Skeleton variant="rounded" width={120} height={40} sx={{ bgcolor: skeletonBg, borderRadius: 2 }} />
      </Box>

      {/* 5 transaction cards */}
      {[0, 1, 2, 3, 4].map((i) => (
        <TransactionItem key={i} />
      ))}

      {/* FAB button placeholder */}
      <Box sx={{ position: 'fixed', bottom: 80, right: 24 }}>
        <Skeleton variant="circular" width={56} height={56} sx={{ bgcolor: skeletonBg }} />
      </Box>
    </Box>
  );
}
