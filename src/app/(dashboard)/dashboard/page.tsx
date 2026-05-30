'use client';

import useSWR from 'swr';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Skeleton from '@mui/material/Skeleton';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import TrendingDownRoundedIcon from '@mui/icons-material/TrendingDownRounded';
import AccountBalanceWalletRoundedIcon from '@mui/icons-material/AccountBalanceWalletRounded';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Alert from '@mui/material/Alert';
import { useState } from 'react';

import { useAppContext } from '@/lib/context/AppContext';
import { getDashboardData } from '@/lib/firebase/firestore';
import type { DashboardData } from '@/types';

import { INDONESIAN_MONTHS } from '@/lib/constants';
import { formatRupiah, formatDateTime } from '@/lib/formatters';

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCardSkeleton() {
  return (
    <Card>
      <CardContent sx={{ pb: '16px !important' }}>
        <Skeleton variant="rounded" width={36} height={36} sx={{ mb: 1 }} />
        <Skeleton variant="text" width="60%" sx={{ mb: 0.5 }} />
        <Skeleton variant="text" width="80%" height={32} />
      </CardContent>
    </Card>
  );
}

function TransactionSkeleton() {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1 }}>
      <Skeleton variant="circular" width={36} height={36} />
      <Box sx={{ flex: 1 }}>
        <Skeleton variant="text" width="50%" />
        <Skeleton variant="text" width="70%" />
      </Box>
      <Skeleton variant="text" width={80} />
    </Box>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
  bgColor: string;
}

function StatCard({ icon, label, value, color, bgColor }: StatCardProps) {
  return (
    <Card>
      <CardContent sx={{ pb: '16px !important' }}>
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: 2,
            background: bgColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 1.5,
            color,
          }}
        >
          {icon}
        </Box>
        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.25 }}>
          {label}
        </Typography>
        <Typography variant="subtitle1" fontWeight={700} sx={{ color, lineHeight: 1.2 }}>
          {formatRupiah(value)}
        </Typography>
      </CardContent>
    </Card>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user, vendorId, vendorCode, vendorName, vendorRole } = useAppContext();
  const [copied, setCopied] = useState(false);

  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth() + 1;
  const periodLabel = `${INDONESIAN_MONTHS[month - 1]} ${year}`;

  const handlePrevMonth = () => {
    setSelectedDate(prev => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() - 1);
      return d;
    });
  };

  const handleNextMonth = () => {
    setSelectedDate(prev => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + 1);
      return d;
    });
  };

  const { data, error, isLoading } = useSWR<DashboardData>(
    vendorId ? ['dashboard', vendorId, year, month] : null,
    () => getDashboardData(vendorId!, year, month),
    { revalidateOnFocus: false }
  );

  const displayName = user?.displayName ?? user?.email ?? 'Pengguna';
  const initials = displayName
    .split(' ')
    .slice(0, 2)
    .map((n: string) => n[0])
    .join('')
    .toUpperCase();

  const handleCopyCode = async () => {
    if (!vendorCode) return;
    await navigator.clipboard.writeText(vendorCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AccessTimeRoundedIcon sx={{ fontSize: 16, opacity: 0.8 }} />
              <Typography variant="caption" sx={{ opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Periode Dashboard
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Tooltip title="Bulan Sebelumnya">
                <IconButton size="small" onClick={handlePrevMonth} sx={{ color: 'white', opacity: 0.8, '&:hover': { opacity: 1, bgcolor: 'rgba(255,255,255,0.1)' } }}>
                  <ChevronLeftRoundedIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Bulan Selanjutnya">
                <IconButton size="small" onClick={handleNextMonth} sx={{ color: 'white', opacity: 0.8, '&:hover': { opacity: 1, bgcolor: 'rgba(255,255,255,0.1)' } }}>
                  <ChevronRightRoundedIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
          <Typography variant="h4" fontWeight={800} sx={{ color: '#fff' }}>
            {periodLabel}
          </Typography>
          {!isLoading && data && (
            <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
              <AccountBalanceWalletRoundedIcon sx={{ fontSize: 16, opacity: 0.85 }} />
              <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 600 }}>
                Saldo: {formatRupiah(data.currentBalance)}
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* ── Error State ── */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Gagal memuat data. Silakan coba lagi.
        </Alert>
      )}

      {/* ── Stats Grid ── */}
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3 }}>
        {isLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard
              icon={<TrendingUpRoundedIcon sx={{ fontSize: 20 }} />}
              label="Total Masuk"
              value={data?.totalIn ?? 0}
              color="#34D399"
              bgColor="rgba(52,211,153,0.12)"
            />
            <StatCard
              icon={<TrendingDownRoundedIcon sx={{ fontSize: 20 }} />}
              label="Total Keluar"
              value={data?.totalOut ?? 0}
              color="#F87171"
              bgColor="rgba(248,113,113,0.12)"
            />
          </>
        )}
      </Box>

      {/* ── Recent Transactions ── */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <ReceiptLongRoundedIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
            <Typography variant="subtitle1" fontWeight={600}>
              Transaksi Terakhir
            </Typography>
          </Box>

          {isLoading && (
            <Box>
              {[...Array(3)].map((_, i) => (
                <Box key={i}>
                  <TransactionSkeleton />
                  {i < 2 && <Divider sx={{ borderColor: 'rgba(124,58,237,0.08)' }} />}
                </Box>
              ))}
            </Box>
          )}

          {!isLoading && (!data?.recentTransactions || data.recentTransactions.length === 0) && (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4, gap: 1 }}>
              <Typography sx={{ fontSize: 40 }}>📋</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Belum ada transaksi
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                Tambahkan dana masuk atau keluar untuk memulai
              </Typography>
            </Box>
          )}

          {!isLoading && data?.recentTransactions && data.recentTransactions.length > 0 && (
            <Box>
              {data.recentTransactions.map((tx, i) => (
                <Box key={tx.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1.25 }}>
                    {/* Type icon */}
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: tx.type === 'IN'
                          ? 'rgba(52,211,153,0.12)'
                          : 'rgba(248,113,113,0.12)',
                        color: tx.type === 'IN' ? '#34D399' : '#F87171',
                        flexShrink: 0,
                      }}
                    >
                      {tx.type === 'IN'
                        ? <TrendingUpRoundedIcon sx={{ fontSize: 18 }} />
                        : <TrendingDownRoundedIcon sx={{ fontSize: 18 }} />}
                    </Box>

                    {/* Info */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" fontWeight={600} noWrap>
                        {tx.type === 'IN' ? 'Dana Masuk' : 'Dana Keluar'}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }} noWrap>
                        {tx.note || formatDateTime(tx.createdAt)}
                      </Typography>
                      {tx.note && (
                        <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block' }} noWrap>
                          {formatDateTime(tx.createdAt)}
                        </Typography>
                      )}
                    </Box>

                    {/* Amount */}
                    <Typography
                      variant="body2"
                      fontWeight={700}
                      sx={{
                        color: tx.type === 'IN' ? '#34D399' : '#F87171',
                        flexShrink: 0,
                      }}
                    >
                      {tx.type === 'IN' ? '+' : '-'}{formatRupiah(tx.amount)}
                    </Typography>
                  </Box>
                  {i < data.recentTransactions.length - 1 && (
                    <Divider sx={{ borderColor: 'rgba(124,58,237,0.08)' }} />
                  )}
                </Box>
              ))}
            </Box>
          )}
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
              <IconButton
                size="small"
                onClick={handleCopyCode}
                sx={{ ml: 'auto', color: copied ? 'success.main' : 'text.secondary' }}
              >
                {copied
                  ? <CheckRoundedIcon sx={{ fontSize: 16 }} />
                  : <ContentCopyIcon sx={{ fontSize: 16 }} />}
              </IconButton>
            </Tooltip>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
