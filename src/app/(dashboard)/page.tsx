'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';

import { useAppContext } from '@/lib/context/AppContext';
import { useState } from 'react';

const INDONESIAN_MONTHS = [
  'Januari','Februari','Maret','April','Mei','Juni',
  'Juli','Agustus','September','Oktober','November','Desember',
];

function getCurrentPeriodLabel() {
  const now = new Date();
  return `${INDONESIAN_MONTHS[now.getMonth()]} ${now.getFullYear()}`;
}

export default function DashboardPage() {
  const { user, vendorCode, vendorName, vendorRole } = useAppContext();
  const [copied, setCopied] = useState(false);

  const handleCopyCode = async () => {
    if (!vendorCode) return;
    await navigator.clipboard.writeText(vendorCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const displayName = user?.displayName ?? user?.email ?? 'Pengguna';
  const initials = displayName
    .split(' ')
    .slice(0, 2)
    .map((n: string) => n[0])
    .join('')
    .toUpperCase();

  return (
    <Box sx={{ px: { xs: 2, sm: 3 }, py: 3, maxWidth: 600, mx: 'auto' }}>
      {/* ── Header ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Dashboard
          </Typography>
          <Typography variant="h5" fontWeight={700} sx={{ mt: 0.25 }}>
            Halo, {displayName.split(' ')[0]} 👋
          </Typography>
        </Box>
        <Avatar
          src={user?.photoURL ?? undefined}
          alt={displayName}
          sx={{
            width: 44,
            height: 44,
            background: 'linear-gradient(135deg, #7C3AED, #06B6D4)',
            fontWeight: 700,
            fontSize: '1rem',
            border: '2px solid rgba(124,58,237,0.4)',
          }}
        >
          {!user?.photoURL && initials}
        </Avatar>
      </Box>

      {/* ── Period Banner ── */}
      <Card
        sx={{
          mb: 3,
          background: 'linear-gradient(135deg, #7C3AED 0%, #5B21B6 50%, #0891B2 100%)',
          border: 'none',
        }}
      >
        <CardContent sx={{ py: '20px !important' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <AccessTimeRoundedIcon sx={{ fontSize: 16, opacity: 0.8 }} />
            <Typography variant="caption" sx={{ opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Periode Saat Ini
            </Typography>
          </Box>
          <Typography variant="h4" fontWeight={800} sx={{ color: '#fff' }}>
            {getCurrentPeriodLabel()}
          </Typography>
        </CardContent>
      </Card>

      {/* ── Stats Placeholder ── */}
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3 }}>
        {[
          { label: 'Total Masuk', emoji: '📈', color: '#34D399' },
          { label: 'Total Keluar', emoji: '📉', color: '#F87171' },
        ].map((stat) => (
          <Card key={stat.label} sx={{ textAlign: 'center' }}>
            <CardContent>
              <Typography sx={{ fontSize: 28, mb: 1 }}>{stat.emoji}</Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>
                {stat.label}
              </Typography>
              <Typography
                variant="h6"
                fontWeight={700}
                sx={{ color: 'text.secondary', fontStyle: 'italic' }}
              >
                —
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.65rem' }}>
                Tersedia di Fase 2
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* ── Recent Transactions Placeholder ── */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
            Transaksi Terakhir
          </Typography>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              py: 4,
              gap: 1,
            }}
          >
            <Typography sx={{ fontSize: 40 }}>📋</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Belum ada transaksi
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.disabled' }}>
              Fitur ini tersedia di Fase 2
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* ── Vendor Info ── */}
      <Card>
        <CardContent>
          <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 1.5 }}>
            Info Vendor
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body1" fontWeight={600}>
              {vendorName ?? '—'}
            </Typography>
            <Chip
              label={vendorRole === 'admin' ? '👑 Admin' : '👤 Member'}
              size="small"
              sx={{
                background: vendorRole === 'admin'
                  ? 'rgba(124,58,237,0.2)'
                  : 'rgba(6,182,212,0.15)',
                color: vendorRole === 'admin' ? 'primary.light' : 'secondary.light',
                fontWeight: 600,
                border: '1px solid',
                borderColor: vendorRole === 'admin'
                  ? 'rgba(124,58,237,0.3)'
                  : 'rgba(6,182,212,0.3)',
              }}
            />
          </Box>
          <Divider sx={{ my: 1.5, borderColor: 'rgba(124,58,237,0.1)' }} />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Kode vendor:
            </Typography>
            <Typography
              variant="caption"
              fontWeight={700}
              sx={{ fontFamily: 'monospace', letterSpacing: '0.15em', color: 'primary.light' }}
            >
              {vendorCode ?? '—'}
            </Typography>
            <Tooltip title={copied ? 'Disalin!' : 'Salin kode'}>
              <IconButton size="small" onClick={handleCopyCode} sx={{ ml: 'auto', color: copied ? 'success.main' : 'text.secondary' }}>
                {copied ? <CheckRoundedIcon sx={{ fontSize: 16 }} /> : <ContentCopyIcon sx={{ fontSize: 16 }} />}
              </IconButton>
            </Tooltip>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
