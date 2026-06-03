/**
 * POST /api/notify
 *
 * Server-side endpoint that sends FCM push notifications to a list of tokens
 * using the Firebase Admin SDK. The client provides the list of recipient FCM
 * tokens; this route performs the actual delivery via Google's FCM servers.
 *
 * Request body:
 *   { tokens: string[], title: string, body: string, url?: string }
 *
 * Environment variable required (server-only):
 *   FIREBASE_SERVICE_ACCOUNT_JSON — minified JSON of the service account key
 *     (Firebase Console → Project Settings → Service Accounts → Generate new private key)
 */

import { NextRequest, NextResponse } from 'next/server';
import admin from 'firebase-admin';

// ─── Initialise Admin SDK once (singleton) ────────────────────────────────────

function getAdminApp(): admin.app.App {
  if (admin.apps.length > 0) {
    return admin.apps[0]!;
  }

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!serviceAccountJson) {
    throw new Error(
      'FIREBASE_SERVICE_ACCOUNT_JSON env var is not set. ' +
        'Download the service account key from Firebase Console → Project Settings → Service Accounts.'
    );
  }

  const serviceAccount = JSON.parse(serviceAccountJson) as admin.ServiceAccount;

  return admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

// ─── Request / response types ─────────────────────────────────────────────────

interface NotifyRequest {
  tokens: string[];
  title: string;
  body: string;
  url?: string;
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest): Promise<NextResponse> {
  let payload: NotifyRequest;

  try {
    payload = (await request.json()) as NotifyRequest;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { tokens, title, body, url } = payload;

  // Basic validation
  if (!Array.isArray(tokens) || tokens.length === 0) {
    return NextResponse.json({ error: 'tokens must be a non-empty array' }, { status: 400 });
  }
  if (typeof title !== 'string' || !title.trim()) {
    return NextResponse.json({ error: 'title is required' }, { status: 400 });
  }
  if (typeof body !== 'string' || !body.trim()) {
    return NextResponse.json({ error: 'body is required' }, { status: 400 });
  }

  // De-duplicate tokens
  const uniqueTokens = [...new Set(tokens)].filter(Boolean);
  if (uniqueTokens.length === 0) {
    return NextResponse.json({ sent: 0, failed: 0 });
  }

  try {
    const app = getAdminApp();
    const messaging = app.messaging();

    const message: admin.messaging.MulticastMessage = {
      tokens: uniqueTokens,
      notification: {
        title: title.trim(),
        body: body.trim(),
      },
      webpush: {
        fcmOptions: {
          link: url ?? '/dashboard',
        },
        notification: {
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-192x192.png',
          vibrate: [100, 50, 100],
        },
      },
    };

    const response = await messaging.sendEachForMulticast(message);

    const sent = response.successCount;
    const failed = response.failureCount;

    // Log invalid / expired tokens (no throw — best-effort delivery)
    if (failed > 0) {
      response.responses.forEach((r, i) => {
        if (!r.success) {
          console.warn(`[notify] Token ${i} failed:`, r.error?.message);
        }
      });
    }

    return NextResponse.json({ sent, failed });
  } catch (err) {
    console.error('[notify] FCM send error:', err);
    return NextResponse.json(
      { error: 'Failed to send notification', detail: String(err) },
      { status: 500 }
    );
  }
}
