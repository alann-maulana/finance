'use client';

import * as React from 'react';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v16-appRouter';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { theme } from './theme';

interface ThemeRegistryProps {
  children: React.ReactNode;
}

/**
 * Wraps the app with MUI's AppRouterCacheProvider (SSR Emotion cache)
 * and ThemeProvider. `enableCssLayer: true` puts MUI styles inside
 * @layer mui so Tailwind utilities can override them.
 */
export default function ThemeRegistry({ children }: ThemeRegistryProps) {
  return (
    <AppRouterCacheProvider options={{ enableCssLayer: true }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
