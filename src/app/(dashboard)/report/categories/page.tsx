'use client';

import { useState, useEffect, useCallback, Suspense, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import IconButton from '@mui/material/IconButton';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Skeleton from '@mui/material/Skeleton';
import Divider from '@mui/material/Divider';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import LocalOfferRoundedIcon from '@mui/icons-material/LocalOfferRounded';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';

import { useAppContext } from '@/lib/context/AppContext';
import { getOutTransactionsByPeriod } from '@/lib/firebase/firestore';
import { formatRupiah } from '@/lib/formatters';
import { monthLabel, parsePeriod, periodParam } from '@/lib/helpers';
import type { Transaction } from '@/types';

const UNCATEGORIZED = 'Tanpa Kategori';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Group transactions by categoryName, return sorted entries (highest total first, uncategorized last) */
function groupByCategory(txs: Transaction[]): { name: string; transactions: Transaction[]; total: number }[] {
  const map = new Map<string, Transaction[]>();
  for (const tx of txs) {
    const key = tx.categoryName || UNCATEGORIZED;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(tx);
  }

  const entries = Array.from(map.entries()).map(([name, transactions]) => ({
    name,
    transactions,
    total: transactions.reduce((s, t) => s + t.amount, 0),
  }));

  // Sort: highest total first, UNCATEGORIZED always last
  return entries.sort((a, b) => {
    if (a.name === UNCATEGORIZED) return 1;
    if (b.name === UNCATEGORIZED) return -1;
    return b.total - a.total;
  });
}

// ─── Transaction Row ──────────────────────────────────────────────────────────

function TransactionRow({ tx }: { tx: Transaction }) {
  const date = tx.createdAt
    ? tx.createdAt.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';
  const time = tx.createdAt
    ? tx.createdAt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, py: 1.5 }}>
      <Box
        sx={{
          width: 36,
          height: 36,
          borderRadius: 2,
          background: 'rgba(248,113,113,0.10)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#F87171',
          flexShrink: 0,
          mt: 0.25,
        }}
      >
        <ReceiptLongRoundedIcon sx={{ fontSize: 18 }} />
      </Box>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body2" fontWeight={600} sx={{ color: '#F87171' }}>
          -{formatRupiah(tx.amount)}
        </Typography>
        {tx.note ? (
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }} noWrap>
            {tx.note}
          </Typography>
        ) : null}
        <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block' }}>
          {date}{time ? ` · ${time}` : ''}{tx.createdByName ? ` · ${tx.createdByName}` : ''}
        </Typography>
      </Box>
    </Box>
  );
}

// ─── Main Content ─────────────────────────────────────────────────────────────

function CategoriesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { vendorId } = useAppContext();

  // ── Period ───────────────────────────────────────────────────────────────
  const { year: filterYear, month: filterMonth } = parsePeriod(searchParams.get('period'));
  const period = periodParam(filterYear, filterMonth);
  const initialTab = searchParams.get('tab') ?? '';

  // ── Data state ───────────────────────────────────────────────────────────
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!vendorId) return;
    setLoading(true);
    setError(null);
    try {
      const txs = await getOutTransactionsByPeriod(vendorId, period);
      setTransactions(txs);
    } catch (err) {
      console.error('[CategoriesPage] fetch error:', err);
      setError('Gagal memuat data. Pastikan koneksi internet stabil.');
    } finally {
      setLoading(false);
    }
  }, [vendorId, period]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Grouped data ─────────────────────────────────────────────────────────
  const groups = useMemo(() => groupByCategory(transactions), [transactions]);

  // ── Tab state ─────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<string>('');

  // Once data loads, pick the initial tab from query param or first group
  useEffect(() => {
    if (groups.length === 0) return;
    const match = groups.find((g) => g.name === initialTab);
    setActiveTab(match ? match.name : groups[0].name);
  }, [groups, initialTab]);

  const activeGroup = groups.find((g) => g.name === activeTab);

  // ── Back URL ──────────────────────────────────────────────────────────────
  const backUrl = `/report?period=${period}`;

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', pb: 4 }}>
      {/* ── Header ── */}
      <Box sx={{ px: { xs: 2, sm: 3 }, pt: 3, pb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton
            id="back-btn"
            onClick={() => router.push(backUrl)}
            sx={{ color: 'text.secondary', ml: -1 }}
            aria-label="Kembali ke Laporan"
          >
            <ArrowBackRoundedIcon />
          </IconButton>
          <Box>
            <Typography
              variant="caption"
              sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.08em' }}
            >
              Laporan · {monthLabel(filterMonth)} {filterYear}
            </Typography>
            <Typography variant="h5" fontWeight={700} sx={{ mt: 0.25 }}>
              Pengeluaran per Kategori
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* ── Error ── */}
      {error && (
        <Box sx={{ px: { xs: 2, sm: 3 }, mb: 2 }}>
          <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>
        </Box>
      )}

      {/* ── Loading skeleton ── */}
      {loading && (
        <Box sx={{ px: { xs: 2, sm: 3 } }}>
          <Skeleton variant="rounded" height={48} sx={{ mb: 2, borderRadius: 2 }} />
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} variant="rounded" height={68} sx={{ mb: 1.5, borderRadius: 2 }} />
          ))}
        </Box>
      )}

      {/* ── Empty state ── */}
      {!loading && groups.length === 0 && (
        <Box sx={{ px: { xs: 2, sm: 3 }, textAlign: 'center', py: 6 }}>
          <LocalOfferRoundedIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Tidak ada pengeluaran pada periode ini.
          </Typography>
        </Box>
      )}

      {/* ── Tabs + Content ── */}
      {!loading && groups.length > 0 && (
        <>
          {/* Scrollable Tab Bar */}
          <Box
            sx={{
              borderBottom: '1px solid rgba(124,58,237,0.12)',
              px: { xs: 1, sm: 2 },
              position: 'sticky',
              top: 0,
              zIndex: 10,
              background: 'linear-gradient(180deg, #0A0A15 0%, #0D0D20 100%)',
            }}
          >
            <Tabs
              value={activeTab}
              onChange={(_, val: string) => setActiveTab(val)}
              variant="scrollable"
              scrollButtons="auto"
              allowScrollButtonsMobile
              textColor="inherit"
              TabIndicatorProps={{ style: { background: '#7C3AED', height: 3, borderRadius: 2 } }}
              sx={{
                minHeight: 48,
                '& .MuiTab-root': {
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  minHeight: 48,
                  color: 'text.secondary',
                  '&.Mui-selected': { color: 'primary.light' },
                },
              }}
            >
              {groups.map((g) => (
                <Tab
                  key={g.name}
                  value={g.name}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                      <span>{g.name}</span>
                      <Chip
                        label={formatRupiah(g.total)}
                        size="small"
                        sx={{
                          height: 18,
                          fontSize: '0.6rem',
                          background: 'rgba(248,113,113,0.12)',
                          color: '#F87171',
                          fontWeight: 700,
                          pointerEvents: 'none',
                        }}
                      />
                    </Box>
                  }
                />
              ))}
            </Tabs>
          </Box>

          {/* Tab Panel */}
          <Box sx={{ px: { xs: 2, sm: 3 }, pt: 2 }}>
            {activeGroup && activeGroup.transactions.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Tidak ada transaksi di kategori ini.
                </Typography>
              </Box>
            )}

            {activeGroup && activeGroup.transactions.length > 0 && (
              <Card>
                <CardContent sx={{ pb: '12px !important' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
                      {activeGroup.transactions.length} transaksi
                    </Typography>
                    <Typography variant="subtitle2" fontWeight={700} sx={{ color: '#F87171' }}>
                      -{formatRupiah(activeGroup.total)}
                    </Typography>
                  </Box>
                  {activeGroup.transactions.map((tx, idx) => (
                    <Box key={tx.id}>
                      <TransactionRow tx={tx} />
                      {idx < activeGroup.transactions.length - 1 && (
                        <Divider sx={{ borderColor: 'rgba(124,58,237,0.08)' }} />
                      )}
                    </Box>
                  ))}
                </CardContent>
              </Card>
            )}
          </Box>
        </>
      )}
    </Box>
  );
}

// ─── Page export ───────────────────────────────────────────────────────────────

export default function CategoryBreakdownPage() {
  return (
    <Suspense
      fallback={
        <Box sx={{ px: { xs: 2, sm: 3 }, py: 3, maxWidth: 800, mx: 'auto' }}>
          <Skeleton variant="text" width={160} height={28} sx={{ mb: 0.5 }} />
          <Skeleton variant="text" width={240} height={40} sx={{ mb: 3 }} />
          <Skeleton variant="rounded" height={48} sx={{ mb: 2, borderRadius: 2 }} />
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} variant="rounded" height={68} sx={{ mb: 1.5, borderRadius: 2 }} />
          ))}
        </Box>
      }
    >
      <CategoriesContent />
    </Suspense>
  );
}
