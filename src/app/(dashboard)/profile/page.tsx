'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import EmailRoundedIcon from '@mui/icons-material/EmailRounded';
import StoreRoundedIcon from '@mui/icons-material/StoreRounded';
import VpnKeyRoundedIcon from '@mui/icons-material/VpnKeyRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import useSWR from 'swr';

import { useAppContext } from '@/lib/context/AppContext';
import { APP_VERSION } from '@/lib/version';
import { getVendorMembers, type VendorMemberWithUser } from '@/lib/firebase/firestore';

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, py: 1.5 }}>
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
          mt: 0.25,
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
          {label}
        </Typography>
        <Typography variant="body2" fontWeight={600} sx={{ wordBreak: 'break-all' }}>
          {value}
        </Typography>
      </Box>
    </Box>
  );
}

export default function ProfilePage() {
  const { user, vendorId, vendorCode, vendorName, vendorRole, logout } = useAppContext();
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const { data: vendorMembers = [], isLoading: loadingMembers } = useSWR<VendorMemberWithUser[]>(
    vendorId ? ['vendorMembers', vendorId] : null,
    ([, id]) => getVendorMembers(id as string)
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

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      router.replace('/login');
    } finally {
      setLoggingOut(false);
      setLogoutDialogOpen(false);
    }
  };

  return (
    <Box sx={{ px: { xs: 2, sm: 3 }, py: 3, maxWidth: 600, mx: 'auto' }}>

      {/* ── Header ── */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Profil
        </Typography>
        <Typography variant="h5" fontWeight={700} sx={{ mt: 0.25 }}>
          Akun Saya
        </Typography>
      </Box>

      {/* ── Avatar Card ── */}
      <Card
        sx={{
          mb: 3,
          background: 'linear-gradient(135deg, #7C3AED 0%, #5B21B6 60%, #0891B2 100%)',
          border: 'none',
        }}
      >
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar
              src={user?.photoURL ?? undefined}
              alt={displayName}
              sx={{
                width: 64,
                height: 64,
                background: 'rgba(255,255,255,0.2)',
                fontWeight: 700,
                fontSize: '1.5rem',
                border: '3px solid rgba(255,255,255,0.3)',
              }}
            >
              {!user?.photoURL && initials}
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight={700} sx={{ color: '#fff' }}>
                {displayName}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.75)' }}>
                {user?.email ?? '—'}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* ── User Info ── */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 0.5 }}>
            Informasi Akun
          </Typography>
          <InfoRow
            icon={<PersonRoundedIcon sx={{ fontSize: 18 }} />}
            label="Nama Lengkap"
            value={displayName}
          />
          <Divider sx={{ borderColor: 'rgba(124,58,237,0.08)' }} />
          <InfoRow
            icon={<EmailRoundedIcon sx={{ fontSize: 18 }} />}
            label="Email"
            value={user?.email ?? '—'}
          />
        </CardContent>
      </Card>

      {/* ── Vendor Info ── */}
      {vendorId && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 0.5 }}>
              Informasi Vendor
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, py: 1.5 }}>
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
                  mt: 0.25,
                }}
              >
                <StoreRoundedIcon sx={{ fontSize: 18 }} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                  Nama Vendor
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.25 }}>
                  <Typography variant="body2" fontWeight={600}>
                    {vendorName ?? '—'}
                  </Typography>
                  <Chip
                    label={vendorRole === 'admin' ? '👑 Admin' : '👤 Member'}
                    size="small"
                    sx={{
                      height: 20,
                      fontSize: '0.65rem',
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
              </Box>
            </Box>

            <Divider sx={{ borderColor: 'rgba(124,58,237,0.08)' }} />

            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, py: 1.5 }}>
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
                  mt: 0.25,
                }}
              >
                <VpnKeyRoundedIcon sx={{ fontSize: 18 }} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                  Kode Vendor
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography
                    variant="body2"
                    fontWeight={700}
                    sx={{ fontFamily: 'monospace', letterSpacing: '0.15em', color: 'primary.light' }}
                  >
                    {vendorCode ?? '—'}
                  </Typography>
                  <Tooltip title={copied ? 'Disalin!' : 'Salin kode'}>
                    <IconButton
                      id="copy-vendor-code-btn"
                      size="small"
                      onClick={handleCopyCode}
                      sx={{ color: copied ? 'success.main' : 'text.secondary' }}
                    >
                      {copied
                        ? <CheckRoundedIcon sx={{ fontSize: 14 }} />
                        : <ContentCopyIcon sx={{ fontSize: 14 }} />}
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* ── Anggota Vendor ── */}
      {vendorId && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 1.5 }}>
              Anggota Vendor
            </Typography>

            {loadingMembers ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                <CircularProgress size={24} />
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {vendorMembers.map((member) => (
                  <Box key={member.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar
                      sx={{
                        width: 36,
                        height: 36,
                        background: 'rgba(124,58,237,0.12)',
                        color: 'primary.light',
                        fontSize: '1rem',
                        fontWeight: 600,
                      }}
                    >
                      {member.name.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" fontWeight={600}>
                        {member.name}
                        {member.userId === user?.uid && ' (Anda)'}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {member.email}
                      </Typography>
                    </Box>
                    <Chip
                      label={member.role === 'admin' ? 'Admin' : 'Member'}
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: '0.65rem',
                        background: member.role === 'admin'
                          ? 'rgba(124,58,237,0.15)'
                          : 'rgba(6,182,212,0.15)',
                        color: member.role === 'admin' ? 'primary.light' : 'secondary.light',
                        fontWeight: 600,
                      }}
                    />
                  </Box>
                ))}
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Tentang Aplikasi ── */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 1.5 }}>
            Tentang Aplikasi
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Versi
              </Typography>
              <Typography variant="caption" fontWeight={600} sx={{ fontFamily: 'monospace', color: 'primary.light' }}>
                v{APP_VERSION}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Platform
              </Typography>
              <Typography variant="caption" fontWeight={600}>
                Progressive Web App
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Status
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Box
                  sx={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: '#22C55E',
                    boxShadow: '0 0 6px rgba(34,197,94,0.7)',
                  }}
                />
                <Typography variant="caption" fontWeight={600} sx={{ color: '#22C55E' }}>
                  Aktif
                </Typography>
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* ── Logout Button ── */}
      <Button
        id="logout-btn"
        fullWidth
        variant="outlined"
        color="error"
        size="large"
        startIcon={<LogoutRoundedIcon />}
        onClick={() => setLogoutDialogOpen(true)}
        sx={{
          borderRadius: 2,
          textTransform: 'none',
          fontWeight: 600,
          borderColor: 'rgba(248,113,113,0.4)',
          color: '#F87171',
          '&:hover': {
            background: 'rgba(248,113,113,0.08)',
            borderColor: '#F87171',
          },
        }}
      >
        Keluar dari Akun
      </Button>

      {/* ── Logout Confirm Dialog ── */}
      <Dialog
        open={logoutDialogOpen}
        onClose={() => !loggingOut && setLogoutDialogOpen(false)}
        PaperProps={{
          sx: { borderRadius: 3, background: '#12122A', border: '1px solid rgba(124,58,237,0.2)' },
        }}
      >
        <DialogTitle fontWeight={700}>Keluar dari Akun?</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: 'text.secondary' }}>
            Anda akan keluar dari akun Google dan diarahkan ke halaman login.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setLogoutDialogOpen(false)}
            disabled={loggingOut}
            sx={{ textTransform: 'none', color: 'text.secondary' }}
          >
            Batal
          </Button>
          <Button
            id="confirm-logout-btn"
            onClick={handleLogout}
            disabled={loggingOut}
            color="error"
            variant="contained"
            sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2 }}
            startIcon={loggingOut ? <CircularProgress size={16} color="inherit" /> : <LogoutRoundedIcon />}
          >
            {loggingOut ? 'Keluar...' : 'Ya, Keluar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
