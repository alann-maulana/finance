import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#7C3AED',
      light: '#9F67FF',
      dark: '#5B21B6',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#06B6D4',
      light: '#22D3EE',
      dark: '#0891B2',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#0A0A15',
      paper: '#13132B',
    },
    text: {
      primary: '#E2E8F0',
      secondary: '#94A3B8',
    },
    divider: 'rgba(124, 58, 237, 0.15)',
    error: { main: '#F87171' },
    success: { main: '#34D399' },
    warning: { main: '#FBBF24' },
    info: { main: '#60A5FA' },
  },
  typography: {
    fontFamily: 'var(--font-inter), Inter, system-ui, sans-serif',
    h1: { fontWeight: 800, letterSpacing: '-0.025em' },
    h2: { fontWeight: 700, letterSpacing: '-0.015em' },
    h3: { fontWeight: 700, letterSpacing: '-0.01em' },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    subtitle1: { fontWeight: 500, lineHeight: 1.5 },
    subtitle2: { fontWeight: 500 },
    body1: { lineHeight: 1.6 },
    body2: { lineHeight: 1.6 },
    button: { fontWeight: 600, textTransform: 'none' as const, letterSpacing: '0.01em' },
    caption: { letterSpacing: '0.02em' },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        '*': { boxSizing: 'border-box' },
        'html, body': { height: '100%' },
        body: { WebkitFontSmoothing: 'antialiased', MozOsxFontSmoothing: 'grayscale' },
        '::-webkit-scrollbar': { width: 6 },
        '::-webkit-scrollbar-track': { background: 'transparent' },
        '::-webkit-scrollbar-thumb': {
          background: 'rgba(124, 58, 237, 0.4)',
          borderRadius: 3,
        },
        '::-webkit-scrollbar-thumb:hover': { background: 'rgba(124, 58, 237, 0.7)' },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          fontSize: '0.9375rem',
          padding: '10px 24px',
          transition: 'all 0.2s ease',
        },
        contained: {
          boxShadow: '0 4px 14px rgba(124, 58, 237, 0.35)',
          '&:hover': { boxShadow: '0 6px 20px rgba(124, 58, 237, 0.5)', transform: 'translateY(-1px)' },
          '&:active': { transform: 'translateY(0)' },
        },
        outlined: {
          borderColor: 'rgba(124, 58, 237, 0.4)',
          '&:hover': { borderColor: '#7C3AED', background: 'rgba(124, 58, 237, 0.08)' },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          backgroundImage: 'none',
          border: '1px solid rgba(124, 58, 237, 0.12)',
          backdropFilter: 'blur(8px)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
      },
    },
    MuiTextField: {
      defaultProps: { variant: 'outlined' as const },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            '& fieldset': { borderColor: 'rgba(124, 58, 237, 0.2)' },
            '&:hover fieldset': { borderColor: 'rgba(124, 58, 237, 0.5)' },
            '&.Mui-focused fieldset': { borderColor: '#7C3AED' },
          },
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 600, fontSize: '0.9375rem' },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: { height: 3, borderRadius: 2 },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 8, fontWeight: 600 },
      },
    },
    MuiBottomNavigation: {
      styleOverrides: {
        root: {
          height: 64,
          backgroundColor: 'rgba(10, 10, 21, 0.95)',
          backdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(124, 58, 237, 0.15)',
        },
      },
    },
    MuiBottomNavigationAction: {
      styleOverrides: {
        root: {
          minWidth: 0,
          padding: '6px 0',
          color: '#64748B',
          transition: 'color 0.2s ease',
          '&.Mui-selected': { color: '#7C3AED' },
          '& .MuiBottomNavigationAction-label': {
            fontSize: '0.65rem',
            fontWeight: 600,
            marginTop: 2,
            '&.Mui-selected': { fontSize: '0.65rem' },
          },
        },
      },
    },
    MuiSnackbar: {
      defaultProps: { anchorOrigin: { vertical: 'bottom', horizontal: 'center' } },
    },
    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: 12 },
      },
    },
  },
});
