'use client';

import {
  useState,
  useEffect,
  useCallback,
  Suspense,
  useTransition,
} from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Alert from '@mui/material/Alert';
import Skeleton from '@mui/material/Skeleton';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid2';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import BarChartRoundedIcon from '@mui/icons-material/BarChartRounded';
import AccountBalanceWalletRoundedIcon from '@mui/icons-material/AccountBalanceWalletRounded';
import SavingsRoundedIcon from '@mui/icons-material/SavingsRounded';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import TrendingDownRoundedIcon from '@mui/icons-material/TrendingDownRounded';

import { useAppContext } from '@/lib/context/AppContext';
import { getReportData } from '@/lib/firebase/firestore';
import type { ReportData } from '@/types';

import { MONTHS, CURRENT_YEAR, YEAR_OPTIONS } from '@/lib/constants';
import { formatRupiah } from '@/lib/formatters';
import { monthLabel, parsePeriod, periodParam } from '@/lib/helpers';

// ─── Main content (needs Suspense because of useSearchParams) ─────────────────

function ReportContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { vendorId } = useAppContext();
  const [, startRouterTransition] = useTransition();

  // ── Period filter ────────────────────────────────────────────────────────
  const { year: filterYear, month: filterMonth } = parsePeriod(
    searchParams.get('period')
  );

  // ── Data state ───────────────────────────────────────────────────────────
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = useCallback(async () => {
    if (!vendorId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getReportData(vendorId, filterYear, filterMonth);
      setReport(data);
    } catch (err) {
      console.error('[Report] fetch error:', err);
      setError('Gagal memuat laporan. Pastikan koneksi internet stabil.');
    } finally {
      setLoading(false);
    }
  }, [vendorId, filterYear, filterMonth]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  // ── Period filter change ─────────────────────────────────────────────────
  function handleFilterChange(newYear: number, newMonth: number) {
    startRouterTransition(() => {
      router.push(`/report?period=${periodParam(newYear, newMonth)}`);
    });
  }

  // ── Render Helpers ───────────────────────────────────────────────────────
  const SummaryCard = ({
    title,
    amount,
    color,
    icon,
    bgColor,
  }: {
    title: string;
    amount: number;
    color: string;
    icon: React.ReactNode;
    bgColor: string;
  }) => (
    <Card sx={{ height: '100%', borderRadius: 3, border: `1px solid ${bgColor}`, background: '#13131F' }}>
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
              {title}
            </Typography>
            <Typography variant="h6" fontWeight={700} sx={{ mt: 1, color }}>
              {color === '#F87171' ? '-' : ''}{formatRupiah(amount)}
            </Typography>
          </Box>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              background: bgColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color,
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ px: { xs: 2, sm: 3 }, py: 3, maxWidth: 800, mx: 'auto', pb: '80px' }}>
      
      {/* ── Header ── */}
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="caption"
          sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.08em' }}
        >
          Laporan
        </Typography>
        <Typography variant="h5" fontWeight={700} sx={{ mt: 0.25 }}>
          Laporan Keuangan
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
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            <FormControl size="small" sx={{ flex: 1, minWidth: 120 }}>
              <InputLabel id="filter-month-label">Bulan</InputLabel>
              <Select
                labelId="filter-month-label"
                id="filter-month"
                value={filterMonth}
                label="Bulan"
                onChange={(e) => handleFilterChange(filterYear, e.target.value as number)}
              >
                {MONTHS.map((m) => (
                  <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ width: 120 }}>
              <InputLabel id="filter-year-label">Tahun</InputLabel>
              <Select
                labelId="filter-year-label"
                id="filter-year"
                value={filterYear}
                label="Tahun"
                onChange={(e) => handleFilterChange(e.target.value as number, filterMonth)}
              >
                {YEAR_OPTIONS.map((y) => (
                  <MenuItem key={y} value={y}>{y}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </CardContent>
      </Card>

      {/* ── Error ── */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* ── Report Loading ── */}
      {loading && !report && (
        <Grid container spacing={2}>
          {[...Array(4)].map((_, i) => (
            <Grid size={{ xs: 12, sm: 6 }} key={i}>
              <Skeleton variant="rounded" height={100} sx={{ borderRadius: 3 }} />
            </Grid>
          ))}
        </Grid>
      )}

      {/* ── Report Data ── */}
      {!loading && report && (
        <Box>
          {/* Active period badge */}
          <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Chip
              size="medium"
              icon={<BarChartRoundedIcon sx={{ fontSize: '18px !important', color: '#818CF8 !important' }} />}
              label={`Ringkasan ${monthLabel(filterMonth)} ${filterYear}`}
              sx={{
                background: 'rgba(129,140,248,0.12)',
                color: '#818CF8',
                fontWeight: 600,
                border: '1px solid rgba(129,140,248,0.25)',
                px: 1,
              }}
            />
          </Box>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <SummaryCard
                title="Saldo Awal Periode"
                amount={report.initialBalance}
                color="#9CA3AF"
                icon={<AccountBalanceWalletRoundedIcon />}
                bgColor="rgba(156,163,175,0.12)"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <SummaryCard
                title="Sisa Saldo Akhir"
                amount={report.finalBalance}
                color="#60A5FA"
                icon={<SavingsRoundedIcon />}
                bgColor="rgba(96,165,250,0.12)"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <SummaryCard
                title="Total Pemasukan"
                amount={report.totalIn}
                color="#34D399"
                icon={<TrendingUpRoundedIcon />}
                bgColor="rgba(52,211,153,0.12)"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <SummaryCard
                title="Total Pengeluaran"
                amount={report.totalOut}
                color="#F87171"
                icon={<TrendingDownRoundedIcon />}
                bgColor="rgba(248,113,113,0.12)"
              />
            </Grid>
          </Grid>
        </Box>
      )}

    </Box>
  );
}

// ─── Page export ──────────────────────────────────────────────────────────────

export default function ReportPage() {
  return (
    <Suspense
      fallback={
        <Box sx={{ px: { xs: 2, sm: 3 }, py: 3, maxWidth: 800, mx: 'auto' }}>
          <Skeleton variant="text" width={120} height={28} sx={{ mb: 0.5 }} />
          <Skeleton variant="text" width={180} height={40} sx={{ mb: 3 }} />
          <Skeleton variant="rounded" height={120} sx={{ mb: 3 }} />
          <Grid container spacing={2}>
            {[...Array(4)].map((_, i) => (
              <Grid size={{ xs: 12, sm: 6 }} key={i}>
                <Skeleton variant="rounded" height={100} sx={{ borderRadius: 3 }} />
              </Grid>
            ))}
          </Grid>
        </Box>
      }
    >
      <ReportContent />
    </Suspense>
  );
}
