'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CallMadeRoundedIcon from '@mui/icons-material/CallMadeRounded';

export default function CashOutPage() {
  return (
    <Box sx={{ px: { xs: 2, sm: 3 }, py: 3, maxWidth: 600, mx: 'auto' }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Dana Keluar
        </Typography>
        <Typography variant="h5" fontWeight={700} sx={{ mt: 0.25 }}>
          Dana Keluar
        </Typography>
      </Box>

      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 6, gap: 2 }}>
            <Box
              sx={{
                width: 72,
                height: 72,
                borderRadius: 4,
                background: 'rgba(248,113,113,0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#F87171',
              }}
            >
              <CallMadeRoundedIcon sx={{ fontSize: 36 }} />
            </Box>
            <Typography variant="h6" fontWeight={700}>
              Segera Hadir
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', maxWidth: 280 }}>
              Fitur pencatatan dana keluar akan tersedia di Fase 4. Stay tuned!
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
