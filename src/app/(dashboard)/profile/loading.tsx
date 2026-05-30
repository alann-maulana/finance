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
      {/* Avatar card with gradient background */}
      <Paper
        elevation={0}
        sx={{
          ...paperSx,
          p: 4,
          mb: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          background: 'linear-gradient(135deg, #13132B 0%, rgba(124, 58, 237, 0.15) 100%)',
        }}
      >
        <Skeleton variant="circular" width={80} height={80} sx={{ bgcolor: skeletonBg, mb: 2 }} />
        <Skeleton variant="text" width={160} height={24} sx={{ bgcolor: skeletonBg, mb: 0.5 }} />
        <Skeleton variant="text" width={200} height={18} sx={{ bgcolor: skeletonBg }} />
      </Paper>

      {/* Vendor info card */}
      <Paper elevation={0} sx={{ ...paperSx, p: 2.5, mb: 3 }}>
        {/* Vendor name */}
        <Skeleton variant="text" width="50%" height={16} sx={{ bgcolor: skeletonBg, mb: 1 }} />
        <Skeleton variant="text" width="70%" height={22} sx={{ bgcolor: skeletonBg, mb: 2 }} />

        {/* Role badge */}
        <Skeleton variant="text" width="35%" height={16} sx={{ bgcolor: skeletonBg, mb: 1 }} />
        <Skeleton variant="rounded" width={80} height={26} sx={{ bgcolor: skeletonBg, borderRadius: 3, mb: 2 }} />

        {/* Vendor code */}
        <Skeleton variant="text" width="40%" height={16} sx={{ bgcolor: skeletonBg, mb: 1 }} />
        <Skeleton variant="text" width="55%" height={22} sx={{ bgcolor: skeletonBg }} />
      </Paper>

      {/* Logout button */}
      <Skeleton
        variant="rounded"
        width="100%"
        height={44}
        sx={{ bgcolor: skeletonBg, borderRadius: 2 }}
      />
    </Box>
  );
}
