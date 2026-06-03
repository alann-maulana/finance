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
import {
  getUserVendor,
  createOrUpdateUserProfile,
  getUserVerifiedStatus,
} from '@/lib/firebase/firestore';
import { requestNotificationPermission } from '@/lib/firebase/messaging';

// ─── Cookie helpers (client-side) ────────────────────────────────────────────

const AUTH_COOKIE = 'finance_auth';
const VENDOR_COOKIE = 'finance_vendor';
const VERIFIED_COOKIE = 'finance_verified';

function setCookie(name: string, value: string, days = 30) {
  if (typeof document === 'undefined') return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function deleteCookie(name: string) {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

/**
 * Sends the Firebase client config to the firebase-messaging-sw.js service worker
 * so it can initialise the FCM background handler without hardcoded config.
 */
function sendFirebaseConfigToSW() {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };
  navigator.serviceWorker.ready
    .then((reg) => {
      reg.active?.postMessage({ type: 'FIREBASE_CONFIG', config });
    })
    .catch(() => {
      /* SW not available — ignore */
    });
}

// ─── Context types ────────────────────────────────────────────────────────────

interface AppContextValue {
  user: User | null;
  loading: boolean;
  vendorId: string | null;
  vendorRole: 'admin' | 'member' | null;
  vendorCode: string | null;
  vendorName: string | null;
  /** `null` means not yet resolved; `true/false` after check */
  isVerified: boolean | null;
  /** Call after vendor create / join to update state + cookie without re-fetching */
  setVendorInfo: (id: string, role: 'admin' | 'member', code: string, name: string, verified?: boolean) => void;
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
  const [isVerified, setIsVerified] = useState<boolean | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      // Always reset to loading so downstream effects never see a partial state
      // (e.g. user set but vendorId/isVerified not yet fetched)
      setLoading(true);
      setUser(firebaseUser);

      if (firebaseUser) {
        setCookie(AUTH_COOKIE, 'true');
        try {
          // 1. Upsert user profile (creates doc with verified=false on first login)
          await createOrUpdateUserProfile(
            firebaseUser.uid,
            firebaseUser.email ?? '',
            firebaseUser.displayName ?? ''
          );

          // 2. Fetch vendor membership
          const vendor = await getUserVendor(firebaseUser.uid);
          if (vendor) {
            setVendorId(vendor.vendorId);
            setVendorRole(vendor.role);
            setVendorCode(vendor.vendorCode);
            setVendorName(vendor.vendorName);
            setCookie(VENDOR_COOKIE, vendor.vendorId);

            // 3. Check verified status only after user has a vendor
            const verified = await getUserVerifiedStatus(firebaseUser.uid);
            setIsVerified(verified);
            if (verified) {
              setCookie(VERIFIED_COOKIE, 'true');
              // 4. Request FCM notification permission (fire-and-forget, background)
              sendFirebaseConfigToSW();
              requestNotificationPermission(firebaseUser.uid).catch(() => {
                /* ignore — user may have denied permission */
              });
            } else {
              deleteCookie(VERIFIED_COOKIE);
            }
          } else {
            setVendorId(null);
            setVendorRole(null);
            setVendorCode(null);
            setVendorName(null);
            setIsVerified(null);
            deleteCookie(VENDOR_COOKIE);
            deleteCookie(VERIFIED_COOKIE);
          }
        } catch (err) {
          console.error('[AppContext] Error during auth setup:', err);
          setVendorId(null);
          setIsVerified(null);
        }
      } else {
        // Signed out – clear everything
        deleteCookie(AUTH_COOKIE);
        deleteCookie(VENDOR_COOKIE);
        deleteCookie(VERIFIED_COOKIE);
        setVendorId(null);
        setVendorRole(null);
        setVendorCode(null);
        setVendorName(null);
        setIsVerified(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const setVendorInfo = useCallback(
    (id: string, role: 'admin' | 'member', code: string, name: string, verified?: boolean) => {
      setVendorId(id);
      setVendorRole(role);
      setVendorCode(code);
      setVendorName(name);
      setCookie(VENDOR_COOKIE, id);
      // If verified flag is passed explicitly (e.g. from connect-vendor page), use it.
      // Otherwise leave isVerified as-is so the connect-vendor page can do a fresh check.
      if (verified !== undefined) {
        setIsVerified(verified);
        if (verified) {
          setCookie(VERIFIED_COOKIE, 'true');
        } else {
          deleteCookie(VERIFIED_COOKIE);
        }
      }
    },
    []
  );

  const logout = useCallback(async () => {
    await signOut();
    deleteCookie(AUTH_COOKIE);
    deleteCookie(VENDOR_COOKIE);
    deleteCookie(VERIFIED_COOKIE);
    setUser(null);
    setVendorId(null);
    setVendorRole(null);
    setVendorCode(null);
    setVendorName(null);
    setIsVerified(null);
  }, []);

  return (
    <AppContext.Provider
      value={{ user, loading, vendorId, vendorRole, vendorCode, vendorName, isVerified, setVendorInfo, logout }}
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
