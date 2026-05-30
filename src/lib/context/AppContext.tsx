'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { signOut } from '@/lib/firebase/auth';
import { getUserVendor } from '@/lib/firebase/firestore';

// ─── Cookie helpers (client-side) ────────────────────────────────────────────

const AUTH_COOKIE = 'finance_auth';
const VENDOR_COOKIE = 'finance_vendor';

function setCookie(name: string, value: string, days = 30) {
  if (typeof document === 'undefined') return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function deleteCookie(name: string) {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

// ─── Context types ────────────────────────────────────────────────────────────

interface AppContextValue {
  user: User | null;
  loading: boolean;
  vendorId: string | null;
  vendorRole: 'admin' | 'member' | null;
  vendorCode: string | null;
  vendorName: string | null;
  /** Call after vendor create / join to update state + cookie without re-fetching */
  setVendorInfo: (id: string, role: 'admin' | 'member', code: string, name: string) => void;
  logout: () => Promise<void>;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [vendorRole, setVendorRole] = useState<'admin' | 'member' | null>(null);
  const [vendorCode, setVendorCode] = useState<string | null>(null);
  const [vendorName, setVendorName] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        setCookie(AUTH_COOKIE, 'true');
        try {
          const vendor = await getUserVendor(firebaseUser.uid);
          if (vendor) {
            setVendorId(vendor.vendorId);
            setVendorRole(vendor.role);
            setVendorCode(vendor.vendorCode);
            setVendorName(vendor.vendorName);
            setCookie(VENDOR_COOKIE, vendor.vendorId);
          } else {
            setVendorId(null);
            setVendorRole(null);
            setVendorCode(null);
            setVendorName(null);
            deleteCookie(VENDOR_COOKIE);
          }
        } catch (err) {
          console.error('[AppContext] Error fetching vendor:', err);
          setVendorId(null);
        }
      } else {
        // Signed out – clear everything
        deleteCookie(AUTH_COOKIE);
        deleteCookie(VENDOR_COOKIE);
        setVendorId(null);
        setVendorRole(null);
        setVendorCode(null);
        setVendorName(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const setVendorInfo = useCallback(
    (id: string, role: 'admin' | 'member', code: string, name: string) => {
      setVendorId(id);
      setVendorRole(role);
      setVendorCode(code);
      setVendorName(name);
      setCookie(VENDOR_COOKIE, id);
    },
    []
  );

  const logout = useCallback(async () => {
    await signOut();
    deleteCookie(AUTH_COOKIE);
    deleteCookie(VENDOR_COOKIE);
    setUser(null);
    setVendorId(null);
    setVendorRole(null);
    setVendorCode(null);
    setVendorName(null);
  }, []);

  return (
    <AppContext.Provider
      value={{ user, loading, vendorId, vendorRole, vendorCode, vendorName, setVendorInfo, logout }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within <AppProvider>');
  return ctx;
}
