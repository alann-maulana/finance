'use client';

import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

export default function LoadingScreen() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0A0A15 0%, #1A0A3A 60%, #0A1530 100%)',
        gap: 2,
      }}
    >
      {/* Glow ring */}
      <Box
        sx={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 72,
          height: 72,
        }}
      >
        <CircularProgress
          size={72}
          thickness={2}
          sx={{ color: '#7C3AED', opacity: 0.3, position: 'absolute' }}
          variant="determinate"
          value={100}
        />
        <CircularProgress
          size={72}
          thickness={2}
          sx={{ color: '#7C3AED' }}
        />
        {/* Center dot */}
        <Box
          sx={{
            position: 'absolute',
            width: 20,
            height: 20,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #7C3AED, #06B6D4)',
            boxShadow: '0 0 20px rgba(124, 58, 237, 0.6)',
          }}
        />
      </Box>
      <Typography
        variant="caption"
        sx={{ color: 'text.secondary', letterSpacing: '0.1em', textTransform: 'uppercase' }}
      >
        Memuat…
      </Typography>
    </Box>
  );
}
