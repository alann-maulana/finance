/**
 * Firebase Cloud Messaging — client-side helpers.
 *
 * - requestNotificationPermission: asks the browser for permission, retrieves
 *   the FCM token and persists it to Firestore users/{uid}.fcmToken.
 * - sendVendorNotification: fires-and-forgets a POST to /api/notify so other
 *   vendor members receive a push notification.
 */

import { getToken } from 'firebase/messaging';
import { getFirebaseMessaging } from './config';
import { saveFcmToken } from './firestore';

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

/**
 * Requests notification permission from the browser.
 * If granted, obtains the FCM registration token and saves it to Firestore.
 *
 * Safe to call multiple times — no-ops if permission is already granted and
 * the token is unchanged.
 *
 * @param uid - Firebase Auth UID of the current user.
 * @returns The FCM token string, or null if permission was denied / unavailable.
 */
export async function requestNotificationPermission(uid: string): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  if (!('Notification' in window)) return null;

  // If already denied, do not prompt again
  if (Notification.permission === 'denied') return null;

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return null;

    const messaging = getFirebaseMessaging();
    if (!messaging) return null;

    // Ensure the service worker is registered (for background push)
    let swReg: ServiceWorkerRegistration | undefined;
    if ('serviceWorker' in navigator) {
      try {
        swReg = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
          scope: '/',
          updateViaCache: 'none',
        });
      } catch {
        // SW registration failure should not block token retrieval
      }
    }

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: swReg,
    });

    if (token) {
      await saveFcmToken(uid, token);
    }

    return token || null;
  } catch (err) {
    console.error('[FCM] Failed to get notification permission:', err);
    return null;
  }
}

// ─── Notification payload shape ───────────────────────────────────────────────

export interface NotificationPayload {
  /** FCM tokens of recipients */
  tokens: string[];
  /** Notification title */
  title: string;
  /** Notification body text */
  body: string;
  /** URL to open when the notification is clicked */
  url?: string;
}

/**
 * Sends push notifications to all specified FCM tokens via the /api/notify route.
 * This is fire-and-forget — failures are logged but never surfaced to the user.
 *
 * @param payload - Notification content and recipient tokens.
 */
export async function sendVendorNotification(payload: NotificationPayload): Promise<void> {
  if (!payload.tokens.length) return;

  try {
    await fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error('[FCM] Failed to send vendor notification:', err);
  }
}
