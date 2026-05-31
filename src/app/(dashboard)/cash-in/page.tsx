'use client';

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  Suspense,
  useTransition,
} from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Fab from '@mui/material/Fab';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Skeleton from '@mui/material/Skeleton';
import Divider from '@mui/material/Divider';
import CircularProgress from '@mui/material/CircularProgress';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import InputAdornment from '@mui/material/InputAdornment';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import AttachMoneyRoundedIcon from '@mui/icons-material/AttachMoneyRounded';

import { useAppContext } from '@/lib/context/AppContext';
import {
  getCashInTransactions,
  updateBalanceForTransaction,
} from '@/lib/firebase/firestore';
import type { Transaction } from '@/types';
import type { TransactionCursor } from '@/lib/firebase/firestore';

import { PAGE_SIZE, MONTHS, CURRENT_YEAR, CURRENT_MONTH, YEAR_OPTIONS } from '@/lib/constants';
import { formatRupiah, formatDateTime } from '@/lib/formatters';

// ─── Skeleton items ───────────────────────────────────────────────────────────

function TransactionSkeleton() {
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

// ─── Transaction item ─────────────────────────────────────────────────────────

interface TxItemProps {
  tx: Transaction;
  isLast: boolean;
}

function TxItem({ tx, isLast }: TxItemProps) {
  const initials = (tx.createdByName ?? tx.createdBy)
    .split(' ')
    .slice(0, 2)
    .map((n: string) => n[0])
    .join('')
    .toUpperCase();

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1.5 }}>
        {/* Avatar */}
        <Avatar
          sx={{
            width: 40,
            height: 40,
            background: 'linear-gradient(135deg, rgba(52,211,153,0.25), rgba(16,185,129,0.4))',
            color: '#34D399',
            fontWeight: 700,
            fontSize: '0.8rem',
            border: '1.5px solid rgba(52,211,153,0.25)',
          }}
        >
          {initials || <PersonRoundedIcon sx={{ fontSize: 18 }} />}
        </Avatar>

        {/* Info */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body2" fontWeight={600} noWrap>
            {tx.createdByName ?? tx.createdBy}
          </Typography>
          {tx.note && (
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }} noWrap>
              {tx.note}
            </Typography>
          )}
          <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block' }} noWrap>
            {formatDateTime(tx.createdAt)}
          </Typography>
        </Box>

        {/* Amount */}
        <Typography
          variant="body2"
          fontWeight={700}
          sx={{ color: '#34D399', flexShrink: 0 }}
        >
          +{formatRupiah(tx.amount)}
        </Typography>
      </Box>
      {!isLast && <Divider sx={{ borderColor: 'rgba(52,211,153,0.08)' }} />}
    </Box>
  );
}

// ─── Main content (needs Suspense because of useSearchParams) ─────────────────

function CashInContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, vendorId } = useAppContext();
  const [, startRouterTransition] = useTransition();

  // ── Period filter ────────────────────────────────────────────────────────
  const urlYear = parseInt(searchParams.get('year') ?? '', 10);
  const filterYear = !isNaN(urlYear) ? urlYear : CURRENT_YEAR;

  // ── List state ───────────────────────────────────────────────────────────
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [cursor, setCursor] = useState<TransactionCursor>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  // ── Infinite scroll sentinel ─────────────────────────────────────────────
  const sentinelRef = useRef<HTMLDivElement>(null);

  // ── Modal state ──────────────────────────────────────────────────────────
  const [modalOpen, setModalOpen] = useState(false);
  const [formMonth, setFormMonth] = useState(CURRENT_MONTH);
  const [formYear, setFormYear] = useState(CURRENT_YEAR);
  const [formAmount, setFormAmount] = useState('');
  const [formNote, setFormNote] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // ── Snackbar state ───────────────────────────────────────────────────────
  const [snack, setSnack] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  // ── Fetch first page whenever filter changes ─────────────────────────────
  const fetchFirstPage = useCallback(async () => {
    if (!vendorId) return;
    setLoading(true);
    setListError(null);
    try {
      const page = await getCashInTransactions(vendorId, filterYear, PAGE_SIZE);
      setTransactions(page.transactions);
      setCursor(page.cursor);
      setHasMore(page.hasMore);
    } catch (err) {
      console.error('[CashIn] fetch error:', err);
      setListError(
        'Gagal memuat data. Pastikan indeks Firestore sudah dibuat, lalu coba lagi.'
      );
    } finally {
      setLoading(false);
    }
  }, [vendorId, filterYear]);

  useEffect(() => {
    setTransactions([]);
    setCursor(null);
    setHasMore(false);
    fetchFirstPage();
  }, [fetchFirstPage]);

  // ── Load next page ───────────────────────────────────────────────────────
  const loadMore = useCallback(async () => {
    if (!vendorId || loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const page = await getCashInTransactions(vendorId, filterYear, PAGE_SIZE, cursor ?? undefined);
      setTransactions((prev) => [...prev, ...page.transactions]);
      setCursor(page.cursor);
      setHasMore(page.hasMore);
    } catch (err) {
      console.error('[CashIn] loadMore error:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [vendorId, filterYear, cursor, hasMore, loadingMore]);

  // ── IntersectionObserver for infinite scroll ─────────────────────────────
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  // ── Period filter change ─────────────────────────────────────────────────
  function handleFilterChange(newYear: number) {
    startRouterTransition(() => {
      router.push(`/cash-in?year=${newYear}`);
    });
  }

  // ── Open modal (reset form) ──────────────────────────────────────────────
  function openModal() {
    setFormMonth(CURRENT_MONTH);
    setFormYear(CURRENT_YEAR);
    setFormAmount('');
    setFormNote('');
    setFormError('');
    setModalOpen(true);
  }

  // ── Submit new transaction ───────────────────────────────────────────────
  async function handleSubmit() {
    const amount = parseFloat(formAmount.replace(/[^\d]/g, ''));
    if (!amount || amount <= 0) {
      setFormError('Jumlah harus lebih dari 0.');
      return;
    }
    if (!formNote.trim()) {
      setFormError('Catatan tidak boleh kosong.');
      return;
    }
    if (!vendorId || !user) return;

    setSubmitting(true);
    setFormError('');
    try {
      await updateBalanceForTransaction(
        vendorId,
        formYear,
        formMonth,
        amount,
        'IN',
        formNote,
        user.uid,
        user.displayName ?? user.email ?? 'Pengguna'
      );
      setModalOpen(false);
      setSnack({ open: true, message: 'Dana masuk berhasil dicatat!', severity: 'success' });
      // Refresh the list if the submitted period matches the current filter
      if (formYear === filterYear) {
        fetchFirstPage();
      }
    } catch (err) {
      console.error('[CashIn] submit error:', err);
      setSnack({
        open: true,
        message: 'Gagal menyimpan transaksi. Coba lagi.',
        severity: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <Box sx={{ px: { xs: 2, sm: 3 }, py: 3, maxWidth: 600, mx: 'auto', pb: '80px' }}>

      {/* ── Header ── */}
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="caption"
          sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.08em' }}
        >
          Dana Masuk
        </Typography>
        <Typography variant="h5" fontWeight={700} sx={{ mt: 0.25 }}>
          Dana Masuk
        </Typography>
      </Box>

      {/* ── Period Filter ── */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ pb: '16px !important' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <CalendarMonthRoundedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Filter Periode
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <FormControl size="small" sx={{ width: 120 }}>
              <InputLabel id="filter-year-label">Tahun</InputLabel>
              <Select
                labelId="filter-year-label"
                id="filter-year"
                value={filterYear}
                label="Tahun"
                onChange={(e) => handleFilterChange(e.target.value as number)}
              >
                {YEAR_OPTIONS.map((y) => (
                  <MenuItem key={y} value={y}>{y}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {/* Active period badge */}
          <Box sx={{ mt: 1.5 }}>
            <Chip
              size="small"
              icon={<TrendingUpRoundedIcon sx={{ fontSize: '14px !important', color: '#34D399 !important' }} />}
              label={`Tahun ${filterYear}`}
              sx={{
                background: 'rgba(52,211,153,0.12)',
                color: '#34D399',
                fontWeight: 600,
                border: '1px solid rgba(52,211,153,0.25)',
              }}
            />
          </Box>
        </CardContent>
      </Card>

      {/* ── Error ── */}
      {listError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setListError(null)}>
          {listError}
        </Alert>
      )}

      {/* ── Transaction List ── */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <TrendingUpRoundedIcon sx={{ fontSize: 18, color: '#34D399' }} />
            <Typography variant="subtitle1" fontWeight={600}>
              Daftar Transaksi
            </Typography>
          </Box>

          {/* Loading skeletons */}
          {loading && (
            <Box>
              {[...Array(5)].map((_, i) => (
                <Box key={i}>
                  <TransactionSkeleton />
                  {i < 4 && <Divider sx={{ borderColor: 'rgba(52,211,153,0.08)' }} />}
                </Box>
              ))}
            </Box>
          )}

          {/* Empty state */}
          {!loading && transactions.length === 0 && !listError && (
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
                  background: 'rgba(52,211,153,0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 0.5,
                }}
              >
                <AttachMoneyRoundedIcon sx={{ fontSize: 36, color: 'rgba(52,211,153,0.5)' }} />
              </Box>
              <Typography variant="body1" fontWeight={600} sx={{ color: 'text.secondary' }}>
                Belum ada dana masuk
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: 'text.disabled', textAlign: 'center', maxWidth: 260 }}
              >
                Tekan tombol + untuk mencatat dana masuk pertama di periode ini.
              </Typography>
            </Box>
          )}

          {/* List items */}
          {!loading && transactions.length > 0 && (
            <Box>
              {transactions.map((tx, i) => (
                <TxItem key={tx.id} tx={tx} isLast={i === transactions.length - 1 && !hasMore} />
              ))}
            </Box>
          )}

          {/* Load-more spinner */}
          {loadingMore && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <CircularProgress size={24} sx={{ color: '#34D399' }} />
            </Box>
          )}

          {/* No more items label */}
          {!loading && !hasMore && transactions.length > 0 && (
            <Typography
              variant="caption"
              sx={{ display: 'block', textAlign: 'center', color: 'text.disabled', pt: 1.5 }}
            >
              Semua transaksi sudah ditampilkan
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Invisible sentinel for IntersectionObserver */}
      <Box ref={sentinelRef} sx={{ height: 1 }} />

      {/* ── FAB ── */}
      <Fab
        id="fab-add-cash-in"
        aria-label="Tambah dana masuk"
        onClick={openModal}
        sx={{
          position: 'fixed',
          bottom: 80,
          right: 20,
          background: 'linear-gradient(135deg, #059669, #34D399)',
          color: '#fff',
          boxShadow: '0 4px 24px rgba(52,211,153,0.4)',
          '&:hover': {
            background: 'linear-gradient(135deg, #047857, #10B981)',
            boxShadow: '0 6px 28px rgba(52,211,153,0.5)',
          },
        }}
      >
        <AddRoundedIcon />
      </Fab>

      {/* ── Add Transaction Modal ── */}
      <Dialog
        open={modalOpen}
        onClose={() => !submitting && setModalOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: '#13131F',
            border: '1px solid rgba(52,211,153,0.12)',
          },
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: 2,
                background: 'rgba(52,211,153,0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#34D399',
              }}
            >
              <TrendingUpRoundedIcon sx={{ fontSize: 18 }} />
            </Box>
            <Typography variant="subtitle1" fontWeight={700}>
              Tambah Dana Masuk
            </Typography>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ pt: '8px !important' }}>
          {/* Period picker */}
          <Typography
            variant="caption"
            sx={{ color: 'text.secondary', display: 'block', mb: 1, textTransform: 'uppercase', letterSpacing: '0.06em' }}
          >
            Periode
          </Typography>
          <Box sx={{ display: 'flex', gap: 1.5, mb: 2.5 }}>
            <FormControl size="small" sx={{ flex: 1 }}>
              <InputLabel id="form-month-label">Bulan</InputLabel>
              <Select
                labelId="form-month-label"
                id="form-month"
                value={formMonth}
                label="Bulan"
                onChange={(e) => setFormMonth(e.target.value as number)}
              >
                {MONTHS.map((m) => (
                  <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ width: 100 }}>
              <InputLabel id="form-year-label">Tahun</InputLabel>
              <Select
                labelId="form-year-label"
                id="form-year"
                value={formYear}
                label="Tahun"
                onChange={(e) => setFormYear(e.target.value as number)}
              >
                {YEAR_OPTIONS.map((y) => (
                  <MenuItem key={y} value={y}>{y}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {/* Amount */}
          <TextField
            id="form-amount"
            label="Jumlah (Rp)"
            fullWidth
            type="number"
            value={formAmount}
            onChange={(e) => setFormAmount(e.target.value)}
            sx={{ mb: 2 }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>Rp</Typography>
                  </InputAdornment>
                ),
              },
            }}
            error={!!formError}
            helperText={formError}
          />

          {/* Note */}
          <TextField
            id="form-note"
            label="Catatan"
            fullWidth
            size="small"
            multiline
            rows={3}
            required
            value={formNote}
            onChange={(e) => setFormNote(e.target.value)}
          />
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button
            id="btn-cancel-cash-in"
            variant="outlined"
            onClick={() => setModalOpen(false)}
            disabled={submitting}
            sx={{ borderColor: 'rgba(255,255,255,0.12)', color: 'text.secondary' }}
          >
            Batal
          </Button>
          <Button
            id="btn-submit-cash-in"
            variant="contained"
            onClick={handleSubmit}
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <AddRoundedIcon />}
            sx={{
              background: 'linear-gradient(135deg, #059669, #34D399)',
              '&:hover': { background: 'linear-gradient(135deg, #047857, #10B981)' },
              fontWeight: 700,
            }}
          >
            {submitting ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Snackbar ── */}
      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{ bottom: { xs: 80, sm: 80 } }}
      >
        <Alert
          severity={snack.severity}
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
          sx={{ width: '100%' }}
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

// ─── Page export (Suspense required for useSearchParams) ──────────────────────

export default function CashInPage() {
  return (
    <Suspense
      fallback={
        <Box sx={{ px: { xs: 2, sm: 3 }, py: 3, maxWidth: 600, mx: 'auto' }}>
          <Skeleton variant="text" width={120} height={28} sx={{ mb: 0.5 }} />
          <Skeleton variant="text" width={180} height={40} sx={{ mb: 3 }} />
          <Skeleton variant="rounded" height={120} sx={{ mb: 3 }} />
          <Skeleton variant="rounded" height={300} />
        </Box>
      }
    >
      <CashInContent />
    </Suspense>
  );
}
