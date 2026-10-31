import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';

export default function BalanceAdjustmentLoading() {
  return (
    <Box sx={{ px: { xs: 2, sm: 3 }, py: 3, maxWidth: 600, mx: 'auto' }}>
      <Skeleton variant="text" width={120} height={20} sx={{ mb: 0.5 }} />
      <Skeleton variant="text" width={220} height={40} sx={{ mb: 3 }} />
      <Skeleton variant="rounded" height={320} />
    </Box>
  );
}
