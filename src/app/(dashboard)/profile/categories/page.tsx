'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';
import Fab from '@mui/material/Fab';
import Chip from '@mui/material/Chip';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import CategoryRoundedIcon from '@mui/icons-material/CategoryRounded';

import { useAppContext } from '@/lib/context/AppContext';
import {
  getCategories,
  createCategory,
  updateCategory,
} from '@/lib/firebase/firestore';
import type { Category } from '@/types';

// ─── Dialog form ─────────────────────────────────────────────────────────────

interface CategoryDialogProps {
  open: boolean;
  initial: Category | null;
  onClose: () => void;
  onSaved: (msg: string) => void;
  vendorId: string;
  userId: string;
}

function CategoryDialog({ open, initial, onClose, onSaved, vendorId, userId }: CategoryDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [nameError, setNameError] = useState('');

  useEffect(() => {
    if (open) {
      setName(initial?.name ?? '');
      setDescription(initial?.description ?? '');
      setNameError('');
    }
  }, [open, initial]);

  const handleSave = async () => {
    if (!name.trim()) {
      setNameError('Nama kategori wajib diisi');
      return;
    }
    setSaving(true);
    try {
      if (initial) {
        const updatedCount = await updateCategory(
          initial.id,
          vendorId,
          name,
          description,
          initial.name
        );
        const msg =
          updatedCount > 0
            ? `Kategori diperbarui. ${updatedCount} transaksi ikut diperbarui.`
            : 'Kategori berhasil diperbarui.';
        onSaved(msg);
      } else {
        await createCategory(vendorId, name, description, userId);
        onSaved('Kategori baru berhasil ditambahkan.');
      }
      onClose();
    } catch (err) {
      console.error('[CategoryDialog] save error:', err);
      setNameError('Gagal menyimpan. Coba lagi.');
    } finally {
      setSaving(false);
    }
  };

  const isEdit = !!initial;

  return (
    <Dialog
      open={open}
      onClose={() => !saving && onClose()}
      fullWidth
      maxWidth="xs"
      PaperProps={{
        sx: {
          borderRadius: 3,
          background: '#12122A',
          border: '1px solid rgba(124,58,237,0.2)',
          mx: 2,
        },
      }}
    >
      <DialogTitle fontWeight={700} sx={{ pb: 1 }}>
        {isEdit ? 'Edit Kategori' : 'Tambah Kategori'}
      </DialogTitle>

      <DialogContent sx={{ pt: 0.5, pb: 1 }}>
        <TextField
          autoFocus
          fullWidth
          label="Nama Kategori"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (nameError) setNameError('');
          }}
          error={!!nameError}
          helperText={nameError}
          disabled={saving}
          sx={{ mb: 2, mt: 1 }}
          inputProps={{ maxLength: 60 }}
        />
        <TextField
          fullWidth
          label="Deskripsi (opsional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={saving}
          multiline
          minRows={2}
          inputProps={{ maxLength: 200 }}
        />
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button
          onClick={onClose}
          disabled={saving}
          sx={{ textTransform: 'none', color: 'text.secondary' }}
        >
          Batal
        </Button>
        <Button
          onClick={handleSave}
          disabled={saving}
          variant="contained"
          sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2, minWidth: 90 }}
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : undefined}
        >
          {saving ? 'Menyimpan...' : 'Simpan'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Category Row ─────────────────────────────────────────────────────────────

function CategoryRow({
  category,
  onEdit,
}: {
  category: Category;
  onEdit: (cat: Category) => void;
}) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1.25 }}>
      <Box
        sx={{
          width: 36,
          height: 36,
          borderRadius: 2,
          background: 'rgba(124,58,237,0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'primary.light',
          flexShrink: 0,
        }}
      >
        <CategoryRoundedIcon sx={{ fontSize: 18 }} />
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body2" fontWeight={600} noWrap>
          {category.name}
        </Typography>
        {category.description ? (
          <Typography
            variant="caption"
            sx={{ color: 'text.secondary', display: 'block' }}
            noWrap
          >
            {category.description}
          </Typography>
        ) : null}
      </Box>
      <IconButton
        size="small"
        onClick={() => onEdit(category)}
        sx={{ color: 'primary.light', flexShrink: 0 }}
        aria-label={`Edit kategori ${category.name}`}
      >
        <EditRoundedIcon sx={{ fontSize: 18 }} />
      </IconButton>
    </Box>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CategoriesPage() {
  const { vendorId, vendorRole, user } = useAppContext();
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Category | null>(null);

  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string }>({
    open: false,
    message: '',
  });

  // ── Guard: admin only ────────────────────────────────────────────────────
  useEffect(() => {
    if (vendorRole !== null && vendorRole !== 'admin') {
      router.replace('/profile');
    }
  }, [vendorRole, router]);

  // ── Fetch categories ─────────────────────────────────────────────────────
  const fetchCategories = useCallback(async () => {
    if (!vendorId) return;
    setLoading(true);
    try {
      const cats = await getCategories(vendorId);
      setCategories(cats);
    } catch (err) {
      console.error('[CategoriesPage] fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [vendorId]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // ── Dialog handlers ──────────────────────────────────────────────────────
  const handleOpenCreate = () => {
    setEditTarget(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (cat: Category) => {
    setEditTarget(cat);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditTarget(null);
  };

  const handleSaved = (message: string) => {
    fetchCategories();
    setSnackbar({ open: true, message });
  };

  if (vendorRole !== 'admin') return null;

  return (
    <Box sx={{ px: { xs: 2, sm: 3 }, py: 3, maxWidth: 600, mx: 'auto', pb: 10 }}>
      {/* ── Header ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <IconButton
          id="back-btn"
          onClick={() => router.back()}
          sx={{ color: 'text.secondary', ml: -1 }}
          aria-label="Kembali"
        >
          <ArrowBackRoundedIcon />
        </IconButton>
        <Box>
          <Typography
            variant="caption"
            sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.08em' }}
          >
            Profil
          </Typography>
          <Typography variant="h5" fontWeight={700} sx={{ mt: 0.25 }}>
            Manajemen Kategori
          </Typography>
        </Box>
      </Box>

      {/* ── Category List ── */}
      <Card>
        <CardContent sx={{ pb: '12px !important' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
              Daftar Kategori
            </Typography>
            <Chip
              label={`${categories.length} kategori`}
              size="small"
              sx={{
                height: 20,
                fontSize: '0.65rem',
                background: 'rgba(124,58,237,0.15)',
                color: 'primary.light',
                fontWeight: 600,
              }}
            />
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={28} />
            </Box>
          ) : categories.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CategoryRoundedIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Belum ada kategori.
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                Ketuk tombol + untuk menambahkan.
              </Typography>
            </Box>
          ) : (
            <Box>
              {categories.map((cat, idx) => (
                <Box key={cat.id}>
                  <CategoryRow category={cat} onEdit={handleOpenEdit} />
                  {idx < categories.length - 1 && (
                    <Divider sx={{ borderColor: 'rgba(124,58,237,0.08)' }} />
                  )}
                </Box>
              ))}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* ── FAB ── */}
      <Fab
        id="add-category-fab"
        color="primary"
        aria-label="Tambah kategori"
        onClick={handleOpenCreate}
        sx={{
          position: 'fixed',
          bottom: 80,
          right: 20,
          boxShadow: '0 4px 20px rgba(124,58,237,0.5)',
        }}
      >
        <AddRoundedIcon />
      </Fab>

      {/* ── Create / Edit Dialog ── */}
      <CategoryDialog
        open={dialogOpen}
        initial={editTarget}
        onClose={handleDialogClose}
        onSaved={handleSaved}
        vendorId={vendorId ?? ''}
        userId={user?.uid ?? ''}
      />

      {/* ── Snackbar ── */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{ bottom: { xs: 72, sm: 24 } }}
      >
        <Alert
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          severity="success"
          variant="filled"
          sx={{ borderRadius: 2, fontWeight: 500 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
