'use client';

import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Chip from '@mui/material/Chip';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import AccountBalanceWalletRoundedIcon from '@mui/icons-material/AccountBalanceWalletRounded';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';

import { useAppContext } from '@/lib/context/AppContext';
import {
  createAdjustmentDraft,
  updateAdjustmentDraft,
  submitAdjustment,
  getVendorMemberFcmTokens,
} from '@/lib/firebase/firestore';
import { sendVendorNotification } from '@/lib/firebase/messaging';
import { formatRupiah } from '@/lib/formatters';
import { MONTHS, CURRENT_YEAR, CURRENT_MONTH, YEAR_OPTIONS } from '@/lib/constants';
import { loadPeriodAsFallback } from '@/lib/periodStorage';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SourceRow {
  /** Temporary local ID (not persisted to Firestore) */
  localId: string;
  sourceName: string;
  amount: string; // raw string for TextField
}

function makeRow(): SourceRow {
  return {
    localId: crypto.randomUUID(),
    sourceName: '',
    amount: '',
  };
}

// ─── Add Balance Adjustment Page ──────────────────────────────────────────────

export default function AddBalanceAdjustmentPage() {
  const router = useRouter();
  const { user, vendorId } = useAppContext();

  // Load last-used period as default for submit
  const { year: defaultYear, month: defaultMonth } = loadPeriodAsFallback();

  const [rows, setRows] = useState<SourceRow[]>([makeRow()]);
  const [submitYear, setSubmitYear] = useState(defaultYear);
  const [submitMonth, setSubmitMonth] = useState(defaultMonth);

  // Current draft ID (set after first save-draft so subsequent saves patch the same doc)
  const draftIdRef = useRef<string | null>(null);

  const [savingDraft, setSavingDraft] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [snack, setSnack] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({ open: false, message: '', severity: 'success' });

  // ── Result dialog shown after successful submit ───────────────────────────
  const [resultDialog, setResultDialog] = useState<{
    open: boolean;
    selisih: number;
    balanceAtSubmit: number;
    totalSources: number;
  } | null>(null);

  // ── Helper: convert rows to AdjustmentItemInput[] ────────────────────────
  const toItems = useCallback(() => {
    return rows
      .filter((r) => r.sourceName.trim() !== '')
      .map((r) => ({
        sourceName: r.sourceName.trim(),
        amount: parseFloat(r.amount.replace(/[^\d]/g, '')) || 0,
      }));
  }, [rows]);

  const totalSources = rows.reduce(
    (sum, r) => sum + (parseFloat(r.amount.replace(/[^\d]/g, '')) || 0),
    0
  );

  // ── Row CRUD ────────────────────────────────────────────────────────────
  function addRow() {
    setRows((prev) => [...prev, makeRow()]);
  }

  function removeRow(localId: string) {
    setRows((prev) => {
      if (prev.length <= 1) return prev; // keep at least 1 row
      return prev.filter((r) => r.localId !== localId);
    });
  }

  function updateRow(localId: string, field: 'sourceName' | 'amount', value: string) {
    setRows((prev) =>
      prev.map((r) => (r.localId === localId ? { ...r, [field]: value } : r))
    );
  }

  // ── Save Draft ────────────────────────────────────────────────────────────
  async function handleSaveDraft() {
    if (!vendorId || !user) return;
    const items = toItems();
    if (items.length === 0) {
      setSnack({ open: true, message: 'Tambahkan minimal 1 sumber dana.', severity: 'error' });
      return;
    }

    setSavingDraft(true);
    try {
      if (draftIdRef.current) {
        await updateAdjustmentDraft(draftIdRef.current, items);
      } else {
        const id = await createAdjustmentDraft(
          vendorId,
          items,
          user.uid,
          user.displayName ?? user.email ?? null
        );
        draftIdRef.current = id;
      }
      setSnack({ open: true, message: 'Draft berhasil disimpan!', severity: 'success' });
    } catch (err) {
      console.error('[AddAdjustment] saveDraft error:', err);
      setSnack({ open: true, message: 'Gagal menyimpan draft. Coba lagi.', severity: 'error' });
    } finally {
      setSavingDraft(false);
    }
  }

  // ── Submit ─────────────────────────────────────────────────────────────────
  async function handleSubmit() {
    if (!vendorId || !user) return;
    const items = toItems();
    if (items.length === 0) {
      setSnack({ open: true, message: 'Tambahkan minimal 1 sumber dana.', severity: 'error' });
      return;
    }

    setSubmitting(true);
    try {
      // 1. Ensure we have a draft ID
      let adjId = draftIdRef.current;
      if (!adjId) {
        adjId = await createAdjustmentDraft(
          vendorId,
          items,
          user.uid,
          user.displayName ?? user.email ?? null
        );
        draftIdRef.current = adjId;
      }

      // 2. Submit (atomic Firestore transaction)
      const { selisih, balanceAtSubmit } = await submitAdjustment(
        adjId,
        vendorId,
        submitYear,
        submitMonth,
        items,
        user.uid,
        user.displayName ?? user.email ?? null
      );

      // 3. Show result dialog
      setResultDialog({
        open: true,
        selisih,
        balanceAtSubmit,
        totalSources: items.reduce((s, i) => s + i.amount, 0),
      });

      // 4. Push notification (fire-and-forget)
      const userName = user.displayName ?? user.email ?? 'Pengguna';
      getVendorMemberFcmTokens(vendorId, user.uid)
        .then((tokens) =>
          sendVendorNotification({
            tokens,
            title: 'Penyesuaian Saldo 🏦',
            body: `${userName} melakukan penyesuaian saldo`,
            url: '/balance-adjustment',
          })
        )
        .catch(() => {/* ignore */});
    } catch (err) {
      console.error('[AddAdjustment] submit error:', err);
      setSnack({ open: true, message: 'Gagal submit. Coba lagi.', severity: 'error' });
    } finally {
      setSubmitting(false);
    }
  }

  function handleResultOk() {
    setResultDialog(null);
    router.push('/balance-adjustment');
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <Box sx={{ px: { xs: 2, sm: 3 }, py: 3, maxWidth: 600, mx: 'auto', pb: '100px' }}>

      {/* ── Header ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <IconButton
          onClick={() => router.back()}
          size="small"
          sx={{ color: 'text.secondary', mr: 0.5 }}
        >
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
            Tambah Penyesuaian Saldo
          </Typography>
        </Box>
      </Box>

      {/* ── Period Picker (for submit) ── */}
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ pb: '16px !important' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <AccountBalanceWalletRoundedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography
              variant="caption"
              sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.06em' }}
            >
              Periode Saldo (untuk Simpan)
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <FormControl size="small" sx={{ flex: 1 }}>
              <InputLabel id="adj-month-label">Bulan</InputLabel>
              <Select
                labelId="adj-month-label"
                id="adj-month"
                value={submitMonth}
                label="Bulan"
                onChange={(e) => setSubmitMonth(e.target.value as number)}
              >
                {MONTHS.map((m) => (
                  <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ width: 100 }}>
              <InputLabel id="adj-year-label">Tahun</InputLabel>
              <Select
                labelId="adj-year-label"
                id="adj-year"
                value={submitYear}
                label="Tahun"
                onChange={(e) => setSubmitYear(e.target.value as number)}
              >
                {YEAR_OPTIONS.map((y) => (
                  <MenuItem key={y} value={y}>{y}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          <Typography variant="caption" sx={{ color: 'text.disabled', mt: 1, display: 'block' }}>
            Saldo akhir periode ini akan digunakan sebagai acuan penyesuaian.
          </Typography>
        </CardContent>
      </Card>

      {/* ── Source Table ── */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <TuneRoundedIcon sx={{ fontSize: 18, color: '#A78BFA' }} />
            <Typography variant="subtitle1" fontWeight={600}>
              Daftar Sumber Dana
            </Typography>
          </Box>

          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small" sx={{ minWidth: 340 }}>
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
                    }}
                  >
                    Saldo
                  </TableCell>
                  <TableCell
                    sx={{
                      width: 36,
                      borderBottom: '1px solid rgba(139,92,246,0.12)',
                    }}
                  />
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row, idx) => (
                  <TableRow key={row.localId}>
                    {/* # */}
                    <TableCell
                      sx={{
                        color: 'text.disabled',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        borderBottom: '1px solid rgba(139,92,246,0.06)',
                        pl: 0,
                        verticalAlign: 'middle',
                      }}
                    >
                      {idx + 1}
                    </TableCell>

                    {/* Sumber Dana */}
                    <TableCell sx={{ borderBottom: '1px solid rgba(139,92,246,0.06)', py: 0.75 }}>
                      <TextField
                        variant="standard"
                        placeholder="mis. Rekening BCA"
                        value={row.sourceName}
                        onChange={(e) => updateRow(row.localId, 'sourceName', e.target.value)}
                        size="small"
                        fullWidth
                        slotProps={{ input: { disableUnderline: false } }}
                        sx={{
                          '& .MuiInput-root:before': { borderColor: 'rgba(139,92,246,0.2)' },
                          '& .MuiInput-root:hover:before': { borderColor: 'rgba(139,92,246,0.5) !important' },
                        }}
                      />
                    </TableCell>

                    {/* Saldo */}
                    <TableCell
                      align="right"
                      sx={{ borderBottom: '1px solid rgba(139,92,246,0.06)', py: 0.75 }}
                    >
                      <TextField
                        variant="standard"
                        placeholder="0"
                        value={row.amount}
                        onChange={(e) => {
                          // Allow only digits
                          const val = e.target.value.replace(/[^\d]/g, '');
                          updateRow(row.localId, 'amount', val);
                        }}
                        size="small"
                        type="text"
                        inputMode="numeric"
                        sx={{
                          width: 120,
                          '& input': { textAlign: 'right' },
                          '& .MuiInput-root:before': { borderColor: 'rgba(139,92,246,0.2)' },
                          '& .MuiInput-root:hover:before': { borderColor: 'rgba(139,92,246,0.5) !important' },
                        }}
                        slotProps={{ input: { disableUnderline: false } }}
                      />
                    </TableCell>

                    {/* Delete */}
                    <TableCell
                      sx={{
                        borderBottom: '1px solid rgba(139,92,246,0.06)',
                        py: 0.75,
                        pr: 0,
                      }}
                    >
                      <IconButton
                        size="small"
                        onClick={() => removeRow(row.localId)}
                        disabled={rows.length <= 1}
                        sx={{ color: 'text.disabled', '&:hover': { color: '#F87171' } }}
                      >
                        <DeleteOutlineRoundedIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>

          {/* Add row button */}
          <Button
            size="small"
            startIcon={<AddRoundedIcon />}
            onClick={addRow}
            sx={{
              mt: 1.5,
              color: '#A78BFA',
              '&:hover': { background: 'rgba(139,92,246,0.08)' },
            }}
          >
            Tambah Baris
          </Button>

          <Divider sx={{ my: 2, borderColor: 'rgba(139,92,246,0.12)' }} />

          {/* Footer: total + actions */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 1.5,
            }}
          >
            {/* Total */}
            <Box>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                Total Semua Sumber Dana
              </Typography>
              <Typography variant="h6" fontWeight={700} sx={{ color: '#A78BFA' }}>
                {formatRupiah(totalSources)}
              </Typography>
            </Box>

            {/* Action buttons */}
            <Box sx={{ display: 'flex', gap: 1 }}>
              {/* Simpan Draft */}
              <Button
                id="btn-save-draft-adjustment"
                variant="outlined"
                size="small"
                startIcon={
                  savingDraft
                    ? <CircularProgress size={14} color="inherit" />
                    : <SaveOutlinedIcon />
                }
                onClick={handleSaveDraft}
                disabled={savingDraft || submitting}
                sx={{
                  borderColor: 'rgba(167,139,250,0.4)',
                  color: '#A78BFA',
                  '&:hover': {
                    borderColor: '#A78BFA',
                    background: 'rgba(139,92,246,0.08)',
                  },
                }}
              >
                {savingDraft ? 'Menyimpan...' : 'Simpan Draft'}
              </Button>

              {/* Simpan */}
              <Button
                id="btn-submit-adjustment"
                variant="contained"
                size="small"
                startIcon={
                  submitting
                    ? <CircularProgress size={14} color="inherit" />
                    : <CheckCircleOutlineRoundedIcon />
                }
                onClick={handleSubmit}
                disabled={savingDraft || submitting}
                sx={{
                  background: 'linear-gradient(135deg, #7C3AED, #6D28D9)',
                  '&:hover': { background: 'linear-gradient(135deg, #6D28D9, #5B21B6)' },
                  fontWeight: 700,
                }}
              >
                {submitting ? 'Memproses...' : 'Simpan'}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* ── Result Dialog ── */}
      {resultDialog && (
        <Dialog
          open={resultDialog.open}
          PaperProps={{
            sx: {
              borderRadius: 3,
              background: '#13131F',
              border: '1px solid rgba(139,92,246,0.2)',
              maxWidth: 340,
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
                <CheckCircleOutlineRoundedIcon sx={{ fontSize: 18 }} />
              </Box>
              <Typography variant="subtitle1" fontWeight={700}>
                Penyesuaian Berhasil
              </Typography>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <ResultRow
                label="Saldo Kas"
                value={formatRupiah(resultDialog.balanceAtSubmit)}
                color="text.primary"
              />
              <ResultRow
                label="Total Sumber Dana"
                value={formatRupiah(resultDialog.totalSources)}
                color="#A78BFA"
              />
              <Divider sx={{ borderColor: 'rgba(139,92,246,0.12)' }} />
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Selisih
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip
                    size="small"
                    label={resultDialog.selisih >= 0 ? 'Dana Keluar' : 'Dana Masuk'}
                    sx={{
                      height: 18,
                      fontSize: '0.65rem',
                      fontWeight: 600,
                      background: resultDialog.selisih >= 0
                        ? 'rgba(248,113,113,0.12)'
                        : 'rgba(52,211,153,0.12)',
                      color: resultDialog.selisih >= 0 ? '#F87171' : '#34D399',
                    }}
                  />
                  <Typography
                    variant="body2"
                    fontWeight={700}
                    sx={{ color: resultDialog.selisih >= 0 ? '#F87171' : '#34D399' }}
                  >
                    {formatRupiah(Math.abs(resultDialog.selisih))}
                  </Typography>
                </Box>
              </Box>
              {resultDialog.selisih === 0 && (
                <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                  Saldo kas sudah sesuai dengan sumber dana. Tidak ada transaksi yang dibuat.
                </Typography>
              )}
              {resultDialog.selisih !== 0 && (
                <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                  Transaksi {resultDialog.selisih >= 0 ? 'pengeluaran' : 'pemasukan'} sebesar{' '}
                  {formatRupiah(Math.abs(resultDialog.selisih))} telah dicatat otomatis.
                </Typography>
              )}
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <Button
              id="btn-result-ok"
              variant="contained"
              fullWidth
              onClick={handleResultOk}
              sx={{
                background: 'linear-gradient(135deg, #7C3AED, #6D28D9)',
                '&:hover': { background: 'linear-gradient(135deg, #6D28D9, #5B21B6)' },
                fontWeight: 700,
              }}
            >
              OK
            </Button>
          </DialogActions>
        </Dialog>
      )}

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

// ─── Helper sub-component ─────────────────────────────────────────────────────

interface ResultRowProps {
  label: string;
  value: string;
  color: string;
}

function ResultRow({ label, value, color }: ResultRowProps) {
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
