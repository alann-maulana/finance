'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Skeleton from '@mui/material/Skeleton';
import Alert from '@mui/material/Alert';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import EditNoteRoundedIcon from '@mui/icons-material/EditNoteRounded';
import AccountBalanceWalletRoundedIcon from '@mui/icons-material/AccountBalanceWalletRounded';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';

import { useAppContext } from '@/lib/context/AppContext';
import { getBalanceAdjustments } from '@/lib/firebase/firestore';
import type { BalanceAdjustment } from '@/types';
import { formatRupiah, formatDateTime } from '@/lib/formatters';
import { MONTHS } from '@/lib/constants';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function BalanceAdjustmentDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { vendorId } = useAppContext();

  const [adjustment, setAdjustment] = useState<BalanceAdjustment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAdjustment = useCallback(async () => {
    if (!vendorId) return;
    setLoading(true);
    setError(null);
    try {
      const list = await getBalanceAdjustments(vendorId);
      const found = list.find((a) => a.id === id) ?? null;
      if (!found) {
        setError('Data penyesuaian tidak ditemukan.');
      } else {
        setAdjustment(found);
      }
    } catch (err) {
      console.error('[AdjustmentDetail] fetch error:', err);
      setError('Gagal memuat data. Coba lagi.');
    } finally {
      setLoading(false);
    }
  }, [vendorId, id]);

  useEffect(() => {
    fetchAdjustment();
  }, [fetchAdjustment]);

  const isSubmitted = adjustment?.status === 'submitted';
  const periodLabel =
    adjustment?.year && adjustment?.month
      ? `${MONTHS.find((m) => m.value === adjustment.month)?.label ?? adjustment.month} ${adjustment.year}`
      : '—';

  return (
    <Box sx={{ px: { xs: 2, sm: 3 }, py: 3, maxWidth: 600, mx: 'auto', pb: '80px' }}>

      {/* ── Header ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <IconButton onClick={() => router.back()} size="small" sx={{ color: 'text.secondary', mr: 0.5 }}>
          <ArrowBackRoundedIcon />
        </IconButton>
        <Box>
          <Typography
            variant="caption"
            sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.08em' }}
          >
            Penyesuaian
          </Typography>
          <Typography variant="h5" fontWeight={700} sx={{ mt: 0.25 }}>
            Detail Penyesuaian
          </Typography>
        </Box>
      </Box>

      {/* ── Error ── */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* ── Loading ── */}
      {loading && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Skeleton variant="rounded" height={140} />
          <Skeleton variant="rounded" height={220} />
        </Box>
      )}

      {/* ── Content ── */}
      {!loading && adjustment && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

          {/* Summary Card */}
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: 2,
                      background: isSubmitted
                        ? 'rgba(52,211,153,0.12)'
                        : 'rgba(139,92,246,0.12)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: isSubmitted ? '#34D399' : '#A78BFA',
                    }}
                  >
                    {isSubmitted
                      ? <CheckCircleRoundedIcon sx={{ fontSize: 20 }} />
                      : <EditNoteRoundedIcon sx={{ fontSize: 20 }} />}
                  </Box>
                  <Typography variant="subtitle1" fontWeight={700}>
                    Penyesuaian Saldo
                  </Typography>
                </Box>
                <Chip
                  size="small"
                  label={isSubmitted ? 'Disubmit' : 'Draft'}
                  sx={{
                    fontWeight: 600,
                    background: isSubmitted
                      ? 'rgba(52,211,153,0.12)'
                      : 'rgba(139,92,246,0.12)',
                    color: isSubmitted ? '#34D399' : '#A78BFA',
                    border: `1px solid ${isSubmitted ? 'rgba(52,211,153,0.25)' : 'rgba(139,92,246,0.25)'}`,
                  }}
                />
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {/* Period */}
                <DetailRow
                  icon={<AccountBalanceWalletRoundedIcon sx={{ fontSize: 16 }} />}
                  label="Periode"
                  value={periodLabel}
                />
                {/* Input by */}
                <DetailRow
                  icon={<PersonRoundedIcon sx={{ fontSize: 16 }} />}
                  label="Diinput oleh"
                  value={adjustment.createdByName ?? adjustment.createdBy}
                />
                {/* Created at */}
                <DetailRow
                  icon={<AccessTimeRoundedIcon sx={{ fontSize: 16 }} />}
                  label="Waktu input"
                  value={formatDateTime(adjustment.createdAt)}
                />
                {isSubmitted && adjustment.submittedAt && (
                  <DetailRow
                    icon={<CheckCircleRoundedIcon sx={{ fontSize: 16 }} />}
                    label="Waktu submit"
                    value={formatDateTime(adjustment.submittedAt)}
                  />
                )}
              </Box>

              {/* Balance summary (only if submitted) */}
              {isSubmitted && adjustment.balanceAtSubmit !== null && (
                <>
                  <Divider sx={{ my: 2, borderColor: 'rgba(139,92,246,0.1)' }} />
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <SummaryRow label="Saldo Kas" value={formatRupiah(adjustment.balanceAtSubmit)} />
                    <SummaryRow label="Total Sumber Dana" value={formatRupiah(adjustment.totalSources)} color="#A78BFA" />
                    <Divider sx={{ borderColor: 'rgba(139,92,246,0.06)' }} />
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        Selisih
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {adjustment.selisih !== 0 && (
                          <Chip
                            size="small"
                            label={(adjustment.selisih ?? 0) >= 0 ? 'Pengeluaran' : 'Pemasukan'}
                            sx={{
                              height: 18,
                              fontSize: '0.65rem',
                              fontWeight: 600,
                              background: (adjustment.selisih ?? 0) >= 0
                                ? 'rgba(248,113,113,0.12)'
                                : 'rgba(52,211,153,0.12)',
                              color: (adjustment.selisih ?? 0) >= 0 ? '#F87171' : '#34D399',
                            }}
                          />
                        )}
                        <Typography
                          variant="body2"
                          fontWeight={700}
                          sx={{
                            color: adjustment.selisih === 0
                              ? 'text.secondary'
                              : (adjustment.selisih ?? 0) >= 0
                                ? '#F87171'
                                : '#34D399',
                          }}
                        >
                          {adjustment.selisih === 0
                            ? 'Seimbang'
                            : formatRupiah(Math.abs(adjustment.selisih ?? 0))}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </>
              )}
            </CardContent>
          </Card>

          {/* Source items table */}
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <TuneRoundedIcon sx={{ fontSize: 18, color: '#A78BFA' }} />
                <Typography variant="subtitle1" fontWeight={600}>
                  Daftar Sumber Dana
                </Typography>
              </Box>

              <Box sx={{ overflowX: 'auto' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell
                        sx={{
                          width: 36,
                          color: 'text.disabled',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                          borderBottom: '1px solid rgba(139,92,246,0.12)',
                          pl: 0,
                        }}
                      >
                        #
                      </TableCell>
                      <TableCell
                        sx={{
                          color: 'text.disabled',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                          borderBottom: '1px solid rgba(139,92,246,0.12)',
                        }}
                      >
                        Sumber Dana
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{
                          color: 'text.disabled',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                          borderBottom: '1px solid rgba(139,92,246,0.12)',
                          pr: 0,
                        }}
                      >
                        Saldo
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {adjustment.items.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell
                          sx={{
                            color: 'text.disabled',
                            fontSize: '0.75rem',
                            borderBottom: '1px solid rgba(139,92,246,0.06)',
                            pl: 0,
                          }}
                        >
                          {idx + 1}
                        </TableCell>
                        <TableCell
                          sx={{ borderBottom: '1px solid rgba(139,92,246,0.06)', py: 1 }}
                        >
                          <Typography variant="body2" fontWeight={500}>
                            {item.sourceName}
                          </Typography>
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{
                            borderBottom: '1px solid rgba(139,92,246,0.06)',
                            py: 1,
                            pr: 0,
                          }}
                        >
                          <Typography variant="body2" fontWeight={600} sx={{ color: '#A78BFA' }}>
                            {formatRupiah(item.amount)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                    {/* Total row */}
                    <TableRow>
                      <TableCell
                        colSpan={2}
                        sx={{
                          borderBottom: 'none',
                          pt: 1.5,
                          pl: 0,
                          color: 'text.secondary',
                          fontWeight: 700,
                          fontSize: '0.8rem',
                        }}
                      >
                        Total
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{ borderBottom: 'none', pt: 1.5, pr: 0 }}
                      >
                        <Typography variant="body1" fontWeight={700} sx={{ color: '#A78BFA' }}>
                          {formatRupiah(adjustment.totalSources)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </Box>
            </CardContent>
          </Card>

          {/* Transaction reference (if submitted) */}
          {isSubmitted && adjustment.transactionId && (
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ReceiptLongRoundedIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                  <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
                    Referensi Transaksi
                  </Typography>
                </Box>
                <Typography
                  variant="caption"
                  sx={{
                    fontFamily: 'monospace',
                    color: 'text.disabled',
                    display: 'block',
                    mt: 0.5,
                  }}
                >
                  {adjustment.transactionId}
                </Typography>
              </CardContent>
            </Card>
          )}

        </Box>
      )}
    </Box>
  );
}

// ─── Helper sub-components ────────────────────────────────────────────────────

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
      <Box sx={{ color: 'text.disabled', mt: 0.1, flexShrink: 0 }}>{icon}</Box>
      <Box sx={{ display: 'flex', flex: 1, justifyContent: 'space-between', gap: 1 }}>
        <Typography variant="caption" sx={{ color: 'text.secondary', flexShrink: 0 }}>
          {label}
        </Typography>
        <Typography variant="caption" fontWeight={600} sx={{ textAlign: 'right' }}>
          {value}
        </Typography>
      </Box>
    </Box>
  );
}

function SummaryRow({
  label,
  value,
  color = 'text.primary',
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={600} sx={{ color }}>
        {value}
      </Typography>
    </Box>
  );
}
