'use client';

import { useState, useEffect, useCallback, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Fab from '@mui/material/Fab';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Skeleton from '@mui/material/Skeleton';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import AccountBalanceWalletRoundedIcon from '@mui/icons-material/AccountBalanceWalletRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import EditNoteRoundedIcon from '@mui/icons-material/EditNoteRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';

import { useAppContext } from '@/lib/context/AppContext';
import { getBalanceAdjustments } from '@/lib/firebase/firestore';
import type { BalanceAdjustment } from '@/types';
import { formatRupiah, formatDateTime } from '@/lib/formatters';
import { MONTHS } from '@/lib/constants';

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function AdjustmentSkeleton() {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1.5 }}>
      <Skeleton variant="circular" width={40} height={40} />
      <Box sx={{ flex: 1 }}>
        <Skeleton variant="text" width="55%" height={18} sx={{ mb: 0.5 }} />
        <Skeleton variant="text" width="75%" height={14} />
      </Box>
      <Skeleton variant="rounded" width={90} height={20} />
    </Box>
  );
}

// ─── Item row ─────────────────────────────────────────────────────────────────

interface AdjItemProps {
  adj: BalanceAdjustment;
  isLast: boolean;
}

function AdjItem({ adj, isLast }: AdjItemProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const periodLabel =
    adj.year && adj.month
      ? `${MONTHS.find((m) => m.value === adj.month)?.label ?? adj.month} ${adj.year}`
      : '—';

  const isSubmitted = adj.status === 'submitted';

  return (
    <Box
      onClick={() => startTransition(() => router.push(`/balance-adjustment/${adj.id}`))}
      sx={{ cursor: 'pointer', '&:hover .adj-row': { background: 'rgba(139,92,246,0.04)' } }}
    >
      <Box
        className="adj-row"
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          py: 1.5,
          borderRadius: 2,
          mx: -1,
          px: 1,
          transition: 'background 0.15s',
        }}
      >
        {/* Avatar */}
        <Avatar
          sx={{
            width: 40,
            height: 40,
            background: isSubmitted
              ? 'linear-gradient(135deg, rgba(52,211,153,0.2), rgba(16,185,129,0.35))'
              : 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(124,58,237,0.35))',
            color: isSubmitted ? '#34D399' : '#A78BFA',
            fontWeight: 700,
            fontSize: '0.8rem',
            border: `1.5px solid ${isSubmitted ? 'rgba(52,211,153,0.25)' : 'rgba(139,92,246,0.25)'}`,
          }}
        >
          {isSubmitted
            ? <CheckCircleRoundedIcon sx={{ fontSize: 20 }} />
            : <EditNoteRoundedIcon sx={{ fontSize: 20 }} />}
        </Avatar>

        {/* Info */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
            <Typography variant="body2" fontWeight={600} noWrap>
              {adj.items.length} Sumber Dana
            </Typography>
            <Chip
              size="small"
              label={isSubmitted ? 'Disubmit' : 'Draft'}
              sx={{
                height: 18,
                fontSize: '0.65rem',
                fontWeight: 600,
                background: isSubmitted
                  ? 'rgba(52,211,153,0.12)'
                  : 'rgba(139,92,246,0.12)',
                color: isSubmitted ? '#34D399' : '#A78BFA',
                border: `1px solid ${isSubmitted ? 'rgba(52,211,153,0.25)' : 'rgba(139,92,246,0.25)'}`,
              }}
            />
          </Box>
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }} noWrap>
            Total: {formatRupiah(adj.totalSources)} · {periodLabel}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block' }} noWrap>
            {adj.createdByName ?? adj.createdBy} · {formatDateTime(adj.createdAt)}
          </Typography>
        </Box>

        {/* Selisih + chevron */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
          {adj.selisih !== null && (
            <Typography
              variant="body2"
              fontWeight={700}
              sx={{ color: adj.selisih >= 0 ? '#F87171' : '#34D399' }}
            >
              {adj.selisih >= 0 ? '-' : '+'}{formatRupiah(Math.abs(adj.selisih))}
            </Typography>
          )}
          <ChevronRightRoundedIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
        </Box>
      </Box>
      {!isLast && <Divider sx={{ borderColor: 'rgba(139,92,246,0.08)' }} />}
    </Box>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function BalanceAdjustmentPage() {
  const router = useRouter();
  const { vendorId } = useAppContext();
  const [, startTransition] = useTransition();

  const [adjustments, setAdjustments] = useState<BalanceAdjustment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAdjustments = useCallback(async () => {
    if (!vendorId) return;
    setLoading(true);
    setError(null);
    try {
      const list = await getBalanceAdjustments(vendorId);
      setAdjustments(list);
    } catch (err) {
      console.error('[BalanceAdjustment] fetch error:', err);
      setError('Gagal memuat data. Coba lagi.');
    } finally {
      setLoading(false);
    }
  }, [vendorId]);

  useEffect(() => {
    fetchAdjustments();
  }, [fetchAdjustments]);

  return (
    <Box sx={{ px: { xs: 2, sm: 3 }, py: 3, maxWidth: 600, mx: 'auto', pb: '80px' }}>

      {/* ── Header ── */}
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="caption"
          sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.08em' }}
        >
          Penyesuaian
        </Typography>
        <Typography variant="h5" fontWeight={700} sx={{ mt: 0.25 }}>
          Penyesuaian Saldo
        </Typography>
      </Box>

      {/* ── Error ── */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* ── List Card ── */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <TuneRoundedIcon sx={{ fontSize: 18, color: '#A78BFA' }} />
            <Typography variant="subtitle1" fontWeight={600}>
              Riwayat Penyesuaian
            </Typography>
          </Box>

          {/* Skeletons */}
          {loading && (
            <Box>
              {[...Array(4)].map((_, i) => (
                <Box key={i}>
                  <AdjustmentSkeleton />
                  {i < 3 && <Divider sx={{ borderColor: 'rgba(139,92,246,0.08)' }} />}
                </Box>
              ))}
            </Box>
          )}

          {/* Empty state */}
          {!loading && adjustments.length === 0 && !error && (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                py: 6,
                gap: 1.5,
              }}
            >
              <Box
                sx={{
                  width: 72,
                  height: 72,
                  borderRadius: 4,
                  background: 'rgba(139,92,246,0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 0.5,
                }}
              >
                <AccountBalanceWalletRoundedIcon sx={{ fontSize: 36, color: 'rgba(139,92,246,0.5)' }} />
              </Box>
              <Typography variant="body1" fontWeight={600} sx={{ color: 'text.secondary' }}>
                Belum ada penyesuaian saldo
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: 'text.disabled', textAlign: 'center', maxWidth: 260 }}
              >
                Tekan tombol + untuk membuat penyesuaian saldo baru.
              </Typography>
            </Box>
          )}

          {/* List */}
          {!loading && adjustments.length > 0 && (
            <Box>
              {adjustments.map((adj, i) => (
                <AdjItem
                  key={adj.id}
                  adj={adj}
                  isLast={i === adjustments.length - 1}
                />
              ))}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* ── FAB ── */}
      <Fab
        id="fab-add-balance-adjustment"
        aria-label="Tambah penyesuaian saldo"
        onClick={() => startTransition(() => router.push('/balance-adjustment/add'))}
        sx={{
          position: 'fixed',
          bottom: 80,
          right: 20,
          background: 'linear-gradient(135deg, #7C3AED, #6D28D9)',
          color: '#fff',
          boxShadow: '0 4px 24px rgba(139,92,246,0.4)',
          '&:hover': {
            background: 'linear-gradient(135deg, #6D28D9, #5B21B6)',
            boxShadow: '0 6px 28px rgba(139,92,246,0.5)',
          },
        }}
      >
        <AddRoundedIcon />
      </Fab>
    </Box>
  );
}
