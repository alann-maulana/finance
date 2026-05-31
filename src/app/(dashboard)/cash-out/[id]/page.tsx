'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import IconButton from '@mui/material/IconButton';
import Fab from '@mui/material/Fab';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Skeleton from '@mui/material/Skeleton';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import CircularProgress from '@mui/material/CircularProgress';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import InputAdornment from '@mui/material/InputAdornment';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import TrendingDownRoundedIcon from '@mui/icons-material/TrendingDownRounded';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import NotesRoundedIcon from '@mui/icons-material/NotesRounded';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import AccountBalanceWalletRoundedIcon from '@mui/icons-material/AccountBalanceWalletRounded';

import { useAppContext } from '@/lib/context/AppContext';
import {
  getTransaction,
  updateCashOutTransaction,
  deleteCashOutTransaction,
} from '@/lib/firebase/firestore';
import type { Transaction } from '@/types';
import { formatRupiah, formatDateTime } from '@/lib/formatters';
import { monthLabel } from '@/lib/helpers';

// ─── Detail Row component ─────────────────────────────────────────────────────

interface DetailRowProps {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}

function DetailRow({ icon, label, value }: DetailRowProps) {
  return (
    <Box sx={{ display: 'flex', gap: 2, py: 1.5, alignItems: 'flex-start' }}>
      <Box
        sx={{
          width: 36,
          height: 36,
          borderRadius: 2,
          background: 'rgba(248,113,113,0.10)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          color: '#F87171',
        }}
      >
        {icon}
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          variant="caption"
          sx={{ color: 'text.disabled', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block' }}
        >
          {label}
        </Typography>
        <Box sx={{ mt: 0.25 }}>{value}</Box>
      </Box>
    </Box>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CashOutDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { vendorId } = useAppContext();

  const transactionId = typeof params.id === 'string' ? params.id : '';

  // ── Data state ───────────────────────────────────────────────────────────
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // ── Edit state ───────────────────────────────────────────────────────────
  const [editMode, setEditMode] = useState(false);
  const [editAmount, setEditAmount] = useState('');
  const [editNote, setEditNote] = useState('');
  const [editError, setEditError] = useState('');
  const [saving, setSaving] = useState(false);

  // ── Delete state ─────────────────────────────────────────────────────────
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deletedSuccess, setDeletedSuccess] = useState(false);

  // ── Snackbar ─────────────────────────────────────────────────────────────
  const [snack, setSnack] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  // ── Fetch transaction ────────────────────────────────────────────────────
  const fetchTransaction = useCallback(async () => {
    if (!transactionId) return;
    setLoading(true);
    try {
      const tx = await getTransaction(transactionId);
      if (!tx) {
        setNotFound(true);
      } else {
        setTransaction(tx);
      }
    } catch (err) {
      console.error('[CashOutDetail] fetch error:', err);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [transactionId]);

  useEffect(() => {
    fetchTransaction();
  }, [fetchTransaction]);

  // ── Enter edit mode ──────────────────────────────────────────────────────
  function enterEdit() {
    if (!transaction) return;
    setEditAmount(String(transaction.amount));
    setEditNote(transaction.note ?? '');
    setEditError('');
    setEditMode(true);
  }

  // ── Cancel edit ──────────────────────────────────────────────────────────
  function cancelEdit() {
    setEditMode(false);
    setEditError('');
  }

  // ── Save edit ────────────────────────────────────────────────────────────
  async function handleSave() {
    if (!transaction || !vendorId) return;

    const newAmount = parseFloat(editAmount.replace(/[^\d]/g, ''));
    if (!newAmount || newAmount <= 0) {
      setEditError('Jumlah harus lebih dari 0.');
      return;
    }

    setSaving(true);
    setEditError('');
    try {
      await updateCashOutTransaction(
        transaction.id,
        vendorId,
        transaction.year,
        transaction.month,
        transaction.amount,
        newAmount,
        editNote
      );

      // Update local state optimistically
      setTransaction((prev) =>
        prev ? { ...prev, amount: newAmount, note: editNote } : prev
      );
      setEditMode(false);
      setSnack({ open: true, message: 'Perubahan berhasil disimpan!', severity: 'success' });
    } catch (err) {
      console.error('[CashOutDetail] save error:', err);
      setSnack({ open: true, message: 'Gagal menyimpan perubahan. Coba lagi.', severity: 'error' });
    } finally {
      setSaving(false);
    }
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  async function handleDelete() {
    if (!transaction || !vendorId) return;

    setDeleting(true);
    setConfirmDeleteOpen(false);
    try {
      await deleteCashOutTransaction(
        transaction.id,
        vendorId,
        transaction.year,
        transaction.month,
        transaction.amount
      );
      setDeletedSuccess(true);
    } catch (err) {
      console.error('[CashOutDetail] delete error:', err);
      setDeleting(false);
      setSnack({ open: true, message: 'Gagal menghapus data. Coba lagi.', severity: 'error' });
    }
  }

  // ─── Loading skeleton ─────────────────────────────────────────────────────
  if (loading) {
    return (
      <Box sx={{ px: { xs: 2, sm: 3 }, py: 3, maxWidth: 600, mx: 'auto', pb: '80px' }}>
        {/* Back + title skeleton */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
          <Skeleton variant="circular" width={40} height={40} />
          <Box>
            <Skeleton variant="text" width={80} height={16} />
            <Skeleton variant="text" width={160} height={28} />
          </Box>
        </Box>

        {/* Amount hero */}
        <Skeleton variant="rounded" height={120} sx={{ mb: 3, borderRadius: 3 }} />

        {/* Detail rows */}
        <Skeleton variant="rounded" height={240} sx={{ borderRadius: 3 }} />
      </Box>
    );
  }

  // ─── Not found ────────────────────────────────────────────────────────────
  if (notFound) {
    return (
      <Box
        sx={{
          px: { xs: 2, sm: 3 },
          py: 3,
          maxWidth: 600,
          mx: 'auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          pt: 10,
          gap: 2,
        }}
      >
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: 4,
            background: 'rgba(248,113,113,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <TrendingDownRoundedIcon sx={{ fontSize: 40, color: 'rgba(248,113,113,0.4)' }} />
        </Box>
        <Typography variant="h6" fontWeight={700}>
          Data tidak ditemukan
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center' }}>
          Transaksi ini mungkin sudah dihapus atau tidak ada.
        </Typography>
        <Button
          variant="outlined"
          startIcon={<ArrowBackRoundedIcon />}
          onClick={() => router.push('/cash-out')}
          sx={{ borderColor: 'rgba(248,113,113,0.4)', color: '#F87171', mt: 1 }}
        >
          Kembali ke Daftar
        </Button>
      </Box>
    );
  }

  if (!transaction) return null;

  const initials = (transaction.createdByName ?? transaction.createdBy)
    .split(' ')
    .slice(0, 2)
    .map((n: string) => n[0])
    .join('')
    .toUpperCase();

  const periodLabel = `${monthLabel(transaction.month)} ${transaction.year}`;

  // ─── Deleted success screen ───────────────────────────────────────────────
  if (deletedSuccess) {
    return (
      <Box
        sx={{
          px: { xs: 2, sm: 3 },
          py: 3,
          maxWidth: 600,
          mx: 'auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          pt: 10,
          gap: 2,
        }}
      >
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: 'rgba(34,197,94,0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <DeleteRoundedIcon sx={{ fontSize: 40, color: '#4ADE80' }} />
        </Box>
        <Typography variant="h6" fontWeight={700}>
          Data berhasil dihapus
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center' }}>
          Transaksi dana keluar sebesar{' '}
          <strong style={{ color: '#F87171' }}>{formatRupiah(transaction.amount)}</strong>{' '}
          telah dihapus dan saldo periode telah dipulihkan.
        </Typography>
        <Button
          id="btn-deleted-ok"
          variant="contained"
          onClick={() => router.push('/cash-out')}
          sx={{
            mt: 1,
            background: 'linear-gradient(135deg, #DC2626, #EF4444)',
            '&:hover': { background: 'linear-gradient(135deg, #B91C1C, #DC2626)' },
            fontWeight: 700,
            px: 4,
          }}
        >
          OK
        </Button>
      </Box>
    );
  }

  // ─── Deleting loading overlay ─────────────────────────────────────────────
  if (deleting) {
    return (
      <Box
        sx={{
          px: { xs: 2, sm: 3 },
          py: 3,
          maxWidth: 600,
          mx: 'auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          pt: 12,
          gap: 2,
        }}
      >
        <CircularProgress size={48} sx={{ color: '#F87171' }} />
        <Typography variant="body1" sx={{ color: 'text.secondary' }}>
          Menghapus data...
        </Typography>
      </Box>
    );
  }

  // ─── Main detail view ─────────────────────────────────────────────────────
  return (
    <Box sx={{ px: { xs: 2, sm: 3 }, py: 3, maxWidth: 600, mx: 'auto', pb: '100px' }}>

      {/* ── Top bar ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <IconButton
            id="btn-back-cash-out-detail"
            onClick={() => router.push('/cash-out')}
            size="small"
            sx={{
              background: 'rgba(248,113,113,0.10)',
              color: '#F87171',
              '&:hover': { background: 'rgba(248,113,113,0.20)' },
            }}
          >
            <ArrowBackRoundedIcon fontSize="small" />
          </IconButton>
          <Box>
            <Typography
              variant="caption"
              sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.08em' }}
            >
              Dana Keluar
            </Typography>
            <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1.2 }}>
              Detail Transaksi
            </Typography>
          </Box>
        </Box>

        {/* More options button */}
        <IconButton
          id="btn-more-cash-out-detail"
          onClick={(e) => setMenuAnchor(e.currentTarget)}
          sx={{
            color: 'text.secondary',
            '&:hover': { color: '#F87171', background: 'rgba(248,113,113,0.08)' },
          }}
        >
          <MoreVertRoundedIcon />
        </IconButton>

        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={() => setMenuAnchor(null)}
          PaperProps={{
            sx: {
              background: '#1A1A2E',
              border: '1px solid rgba(248,113,113,0.15)',
              borderRadius: 2,
              minWidth: 160,
            },
          }}
        >
          <MenuItem
            id="menu-delete-cash-out"
            onClick={() => {
              setMenuAnchor(null);
              setConfirmDeleteOpen(true);
            }}
            sx={{ color: '#F87171', gap: 1.5 }}
          >
            <DeleteRoundedIcon fontSize="small" />
            Hapus
          </MenuItem>
        </Menu>
      </Box>

      {/* ── Amount hero card ── (always read-only display) */}
      <Card
        sx={{
          mb: 3,
          background: 'linear-gradient(135deg, rgba(220,38,38,0.18), rgba(248,113,113,0.10))',
          border: '1px solid rgba(248,113,113,0.20)',
          borderRadius: 3,
          overflow: 'visible',
        }}
      >
        <CardContent sx={{ pb: '16px !important', pt: 3, textAlign: 'center' }}>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: 3,
              background: 'rgba(248,113,113,0.18)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 1.5,
            }}
          >
            <TrendingDownRoundedIcon sx={{ fontSize: 28, color: '#F87171' }} />
          </Box>

          <Typography
            variant="h4"
            fontWeight={800}
            sx={{ color: '#F87171', letterSpacing: '-0.02em' }}
          >
            -{formatRupiah(editMode ? (parseFloat(editAmount) || transaction.amount) : transaction.amount)}
          </Typography>
          <Chip
            size="small"
            label={editMode ? 'Mode Edit' : 'Dana Keluar'}
            sx={{
              mt: 1,
              background: editMode ? 'rgba(251,191,36,0.15)' : 'rgba(248,113,113,0.15)',
              color: editMode ? '#FCD34D' : '#F87171',
              fontWeight: 600,
              border: `1px solid ${editMode ? 'rgba(251,191,36,0.30)' : 'rgba(248,113,113,0.25)'}`,
              fontSize: '0.7rem',
            }}
          />
        </CardContent>
      </Card>

      {/* ── Detail rows card ── */}
      <Card sx={{ borderRadius: 3 }}>
        <CardContent>

          {/* Periode */}
          <DetailRow
            icon={<CalendarMonthRoundedIcon sx={{ fontSize: 18 }} />}
            label="Periode"
            value={
              <Typography variant="body2" fontWeight={600}>
                {periodLabel}
              </Typography>
            }
          />
          <Divider sx={{ borderColor: 'rgba(248,113,113,0.08)', ml: 7 }} />

          {/* Saldo Keluar */}
          <DetailRow
            icon={<AccountBalanceWalletRoundedIcon sx={{ fontSize: 18 }} />}
            label="Saldo Keluar"
            value={
              editMode ? (
                <TextField
                  id="edit-amount"
                  fullWidth
                  size="small"
                  type="number"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  error={!!editError}
                  helperText={editError}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <Typography variant="body2" sx={{ color: 'text.secondary' }}>Rp</Typography>
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              ) : (
                <Typography variant="body2" fontWeight={600} sx={{ color: '#F87171' }}>
                  {formatRupiah(transaction.amount)}
                </Typography>
              )
            }
          />
          <Divider sx={{ borderColor: 'rgba(248,113,113,0.08)', ml: 7 }} />

          {/* Catatan */}
          <DetailRow
            icon={<NotesRoundedIcon sx={{ fontSize: 18 }} />}
            label="Catatan"
            value={
              editMode ? (
                <TextField
                  id="edit-note"
                  fullWidth
                  size="small"
                  multiline
                  rows={3}
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  placeholder="Catatan (opsional)"
                />
              ) : (
                <Typography variant="body2" sx={{ color: transaction.note ? 'text.primary' : 'text.disabled' }}>
                  {transaction.note || '—'}
                </Typography>
              )
            }
          />
          <Divider sx={{ borderColor: 'rgba(248,113,113,0.08)', ml: 7 }} />

          {/* User */}
          <DetailRow
            icon={<PersonRoundedIcon sx={{ fontSize: 18 }} />}
            label="Diinput oleh"
            value={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar
                  sx={{
                    width: 24,
                    height: 24,
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, rgba(248,113,113,0.25), rgba(239,68,68,0.4))',
                    color: '#F87171',
                    border: '1px solid rgba(248,113,113,0.25)',
                  }}
                >
                  {initials || <PersonRoundedIcon sx={{ fontSize: 14 }} />}
                </Avatar>
                <Typography variant="body2" fontWeight={600}>
                  {transaction.createdByName ?? transaction.createdBy}
                </Typography>
              </Box>
            }
          />
          <Divider sx={{ borderColor: 'rgba(248,113,113,0.08)', ml: 7 }} />

          {/* Waktu */}
          <DetailRow
            icon={<AccessTimeRoundedIcon sx={{ fontSize: 18 }} />}
            label="Waktu Input"
            value={
              <Typography variant="body2" fontWeight={600}>
                {formatDateTime(transaction.createdAt)}
              </Typography>
            }
          />

          {/* Edit mode action buttons */}
          {editMode && (
            <Box sx={{ display: 'flex', gap: 1.5, mt: 2.5 }}>
              <Button
                id="btn-cancel-edit-cash-out"
                variant="outlined"
                startIcon={<CloseRoundedIcon />}
                onClick={cancelEdit}
                disabled={saving}
                sx={{ flex: 1, borderColor: 'rgba(255,255,255,0.12)', color: 'text.secondary' }}
              >
                Batal
              </Button>
              <Button
                id="btn-save-cash-out"
                variant="contained"
                startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveRoundedIcon />}
                onClick={handleSave}
                disabled={saving}
                sx={{
                  flex: 1,
                  background: 'linear-gradient(135deg, #DC2626, #EF4444)',
                  '&:hover': { background: 'linear-gradient(135deg, #B91C1C, #DC2626)' },
                  fontWeight: 700,
                }}
              >
                {saving ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* ── Floating Edit FAB ── */}
      {!editMode && (
        <Fab
          id="fab-edit-cash-out"
          aria-label="Edit transaksi"
          onClick={enterEdit}
          size="medium"
          sx={{
            position: 'fixed',
            bottom: 80,
            right: 20,
            background: 'linear-gradient(135deg, #DC2626, #EF4444)',
            color: '#fff',
            boxShadow: '0 4px 24px rgba(248,113,113,0.4)',
            '&:hover': {
              background: 'linear-gradient(135deg, #B91C1C, #DC2626)',
              boxShadow: '0 6px 28px rgba(248,113,113,0.5)',
            },
          }}
        >
          <EditRoundedIcon />
        </Fab>
      )}

      {/* ── Confirm Delete Dialog ── */}
      <Dialog
        open={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        fullWidth
        maxWidth="xs"
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: '#13131F',
            border: '1px solid rgba(248,113,113,0.15)',
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
                background: 'rgba(248,113,113,0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#F87171',
              }}
            >
              <DeleteRoundedIcon sx={{ fontSize: 18 }} />
            </Box>
            <Typography variant="subtitle1" fontWeight={700}>
              Hapus Transaksi
            </Typography>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ pt: '8px !important' }}>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Apakah Anda yakin ingin menghapus transaksi dana keluar sebesar{' '}
            <strong style={{ color: '#F87171' }}>{formatRupiah(transaction.amount)}</strong>{' '}
            untuk periode <strong>{periodLabel}</strong>?
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block', mt: 1 }}>
            Saldo periode akan dipulihkan secara otomatis. Tindakan ini tidak dapat dibatalkan.
          </Typography>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button
            id="btn-cancel-delete-cash-out"
            variant="outlined"
            onClick={() => setConfirmDeleteOpen(false)}
            sx={{ flex: 1, borderColor: 'rgba(255,255,255,0.12)', color: 'text.secondary' }}
          >
            Tidak
          </Button>
          <Button
            id="btn-confirm-delete-cash-out"
            variant="contained"
            startIcon={<DeleteRoundedIcon />}
            onClick={handleDelete}
            sx={{
              flex: 1,
              background: 'linear-gradient(135deg, #DC2626, #EF4444)',
              '&:hover': { background: 'linear-gradient(135deg, #B91C1C, #DC2626)' },
              fontWeight: 700,
            }}
          >
            Hapus
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
