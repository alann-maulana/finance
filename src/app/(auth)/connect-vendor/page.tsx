'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import AddBusinessRoundedIcon from '@mui/icons-material/AddBusinessRounded';
import GroupAddRoundedIcon from '@mui/icons-material/GroupAddRounded';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';

import { useAppContext } from '@/lib/context/AppContext';
import { createVendor, getVendorByCode, joinVendor, getUserVerifiedStatus } from '@/lib/firebase/firestore';
import { getVendorMemberFcmTokens } from '@/lib/firebase/firestore';
import { sendVendorNotification } from '@/lib/firebase/messaging';
import LoadingScreen from '@/components/common/LoadingScreen';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <Box
      role="tabpanel"
      hidden={value !== index}
      id={`vendor-tabpanel-${index}`}
      aria-labelledby={`vendor-tab-${index}`}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </Box>
  );
}

export default function ConnectVendorPage() {
  const router = useRouter();
  const { user, loading, setVendorInfo } = useAppContext();
  const [tab, setTab] = useState(0);

  // Create vendor state
  const [vendorName, setVendorName] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Join vendor state
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  // Navigating state — true while awaiting getUserVerifiedStatus before redirect
  const [navigating, setNavigating] = useState(false);

  if (loading || navigating) return <LoadingScreen />;

  const handleLogout = async () => {
    router.replace('/login');
  };

  const handleCopy = async () => {
    if (!createdCode) return;
    await navigator.clipboard.writeText(createdCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Create vendor ──────────────────────────────────────────────────────────

  const handleCreateVendor = async () => {
    if (!user) return;
    if (!vendorName.trim()) {
      setCreateError('Nama vendor tidak boleh kosong.');
      return;
    }
    setCreateError(null);
    setCreating(true);
    try {
      const { vendorId, code } = await createVendor(vendorName.trim(), user.uid);
      setCreatedCode(code);
      setVendorInfo(vendorId, 'admin', code, vendorName.trim());
    } catch (err) {
      console.error(err);
      setCreateError('Gagal membuat vendor. Coba lagi.');
    } finally {
      setCreating(false);
    }
  };

  const handleGoDashboard = async () => {
    if (!user) return;
    setNavigating(true);
    try {
      const verified = await getUserVerifiedStatus(user.uid);
      if (!verified) {
        router.replace('/not-verified');
      } else {
        router.replace('/dashboard');
      }
    } catch {
      router.replace('/dashboard');
    }
  };

  // ── Join vendor ────────────────────────────────────────────────────────────

  const handleJoinVendor = async () => {
    if (!user) return;
    if (!joinCode.trim()) {
      setJoinError('Masukkan kode vendor.');
      return;
    }
    setJoinError(null);
    setJoining(true);
    try {
      const vendor = await getVendorByCode(joinCode.trim());
      if (!vendor) {
        setJoinError('Kode vendor tidak ditemukan. Periksa kembali kode Anda.');
        setJoining(false);
        return;
      }
      await joinVendor(vendor.id, user.uid);
      const verified = await getUserVerifiedStatus(user.uid);
      setVendorInfo(vendor.id, 'member', vendor.code, vendor.name, verified);

      // ── Push notification to existing members (fire-and-forget) ───────────
      const joinerName = user.displayName ?? user.email ?? 'Pengguna baru';
      getVendorMemberFcmTokens(vendor.id, user.uid)
        .then((tokens) =>
          sendVendorNotification({
            tokens,
            title: 'Anggota Baru 👋',
            body: `${joinerName} baru saja bergabung ke vendor ${vendor.name}`,
            url: '/dashboard',
          })
        )
        .catch(() => {/* ignore — notification is optional */});

      if (!verified) {
        router.replace('/not-verified');
      } else {
        router.replace('/dashboard');
      }
    } catch (err) {
      console.error(err);
      setJoinError('Gagal bergabung ke vendor. Coba lagi.');
    } finally {
      setJoining(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #0A0A15 0%, #1A0A3A 55%, #0A1530 100%)',
        px: 2,
        py: 4,
      }}
    >
      {/* Background blobs */}
      <Box
        className="animate-float-slow"
        sx={{
          position: 'absolute', top: '-20%', right: '-10%',
          width: 450, height: 450, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124,58,237,0.2) 0%, transparent 70%)',
          filter: 'blur(50px)', pointerEvents: 'none',
        }}
      />
      <Box
        className="animate-float-medium"
        sx={{
          position: 'absolute', bottom: '-15%', left: '-8%',
          width: 350, height: 350, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(6,182,212,0.18) 0%, transparent 70%)',
          filter: 'blur(40px)', pointerEvents: 'none',
        }}
      />

      {/* Card */}
      <Box
        className="animate-fade-in-up glass"
        sx={{ width: '100%', maxWidth: 460, borderRadius: '24px', p: { xs: 3, sm: 4 }, zIndex: 1 }}
      >
        {/* Back button */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
          <Tooltip title="Kembali ke Login">
            <IconButton size="small" onClick={handleLogout} sx={{ color: 'text.secondary' }}>
              <ArrowBackRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {user?.email}
          </Typography>
        </Box>

        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" fontWeight={700} sx={{ mb: 0.5 }}>
            Hubungkan Vendor
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Buat vendor baru atau gabung ke vendor yang sudah ada.
          </Typography>
        </Box>

        <Divider sx={{ mb: 0, borderColor: 'rgba(124,58,237,0.15)' }} />

        {/* Tabs */}
        <Tabs
          value={tab}
          onChange={(_, v) => { setTab(v); setCreateError(null); setJoinError(null); }}
          aria-label="vendor tabs"
          sx={{ mb: 0 }}
        >
          <Tab
            id="vendor-tab-0"
            icon={<AddBusinessRoundedIcon fontSize="small" />}
            iconPosition="start"
            label="Buat Baru"
            value={0}
          />
          <Tab
            id="vendor-tab-1"
            icon={<GroupAddRoundedIcon fontSize="small" />}
            iconPosition="start"
            label="Gabung"
            value={1}
          />
        </Tabs>

        {/* ── Tab 0: Create ── */}
        <TabPanel value={tab} index={0}>
          {createdCode ? (
            /* Success state */
            <Box sx={{ textAlign: 'center' }}>
              <Box sx={{ fontSize: 48, mb: 2 }}>🎉</Box>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
                Vendor Berhasil Dibuat!
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
                Bagikan kode berikut agar anggota tim bisa bergabung.
              </Typography>

              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 1.5,
                  background: 'rgba(124,58,237,0.1)',
                  border: '1px solid rgba(124,58,237,0.3)',
                  borderRadius: '12px',
                  px: 3,
                  py: 1.5,
                  mb: 3,
                }}
              >
                <Typography
                  variant="h4"
                  fontWeight={800}
                  sx={{ letterSpacing: '0.15em', color: 'primary.light', fontFamily: 'monospace' }}
                >
                  {createdCode}
                </Typography>
                <Tooltip title={copied ? 'Disalin!' : 'Salin kode'}>
                  <IconButton
                    size="small"
                    onClick={handleCopy}
                    sx={{ color: copied ? 'success.main' : 'primary.light' }}
                  >
                    {copied ? <CheckIcon fontSize="small" /> : <ContentCopyIcon fontSize="small" />}
                  </IconButton>
                </Tooltip>
              </Box>

              <Button
                id="go-dashboard-btn"
                variant="contained"
                fullWidth
                size="large"
                onClick={handleGoDashboard}
              >
                Ke Dashboard →
              </Button>
            </Box>
          ) : (
            /* Create form */
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                id="vendor-name-input"
                label="Nama Vendor / Usaha"
                placeholder="mis. Warung Makan Bu Sari"
                value={vendorName}
                onChange={(e) => { setVendorName(e.target.value); setCreateError(null); }}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateVendor()}
                fullWidth
                autoFocus
                inputProps={{ maxLength: 60 }}
                helperText={`${vendorName.length}/60`}
              />

              {createError && (
                <Alert severity="error" sx={{ borderRadius: '12px' }} onClose={() => setCreateError(null)}>
                  {createError}
                </Alert>
              )}

              <Button
                id="create-vendor-btn"
                variant="contained"
                size="large"
                fullWidth
                onClick={handleCreateVendor}
                disabled={creating || !vendorName.trim()}
                startIcon={creating ? <CircularProgress size={18} color="inherit" /> : null}
              >
                {creating ? 'Membuat…' : 'Buat Vendor'}
              </Button>
            </Box>
          )}
        </TabPanel>

        {/* ── Tab 1: Join ── */}
        <TabPanel value={tab} index={1}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              id="vendor-code-input"
              label="Kode Vendor (6 karakter)"
              placeholder="mis. AB12CD"
              value={joinCode}
              onChange={(e) => { setJoinCode(e.target.value.toUpperCase()); setJoinError(null); }}
              onKeyDown={(e) => e.key === 'Enter' && handleJoinVendor()}
              fullWidth
              autoFocus
              inputProps={{ maxLength: 6, style: { letterSpacing: '0.2em', fontFamily: 'monospace', fontWeight: 700 } }}
            />

            {joinError && (
              <Alert severity="error" sx={{ borderRadius: '12px' }} onClose={() => setJoinError(null)}>
                {joinError}
              </Alert>
            )}

            <Button
              id="join-vendor-btn"
              variant="contained"
              size="large"
              fullWidth
              onClick={handleJoinVendor}
              disabled={joining || joinCode.trim().length < 6}
              startIcon={joining ? <CircularProgress size={18} color="inherit" /> : null}
            >
              {joining ? 'Bergabung…' : 'Gabung ke Vendor'}
            </Button>

            <Typography variant="caption" sx={{ color: 'text.secondary', textAlign: 'center' }}>
              Minta kode dari admin vendor Anda.
            </Typography>
          </Box>
        </TabPanel>
      </Box>
    </Box>
  );
}
