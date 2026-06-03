/**
 * POST /api/log-push
 *
 * Debugging endpoint: saves the raw push notification payload received by
 * the service worker to Firestore collection `pushNotificationLogs`.
 *
 * Called from sw.js / firebase-messaging-sw.js via fetch() before
 * self.registration.showNotification() so we can inspect the exact payload
 * shape delivered by FCM / Firebase campaigns.
 *
 * Uses Firebase Admin SDK to bypass Firestore security rules.
 */

import { NextRequest, NextResponse } from 'next/server';
import admin from 'firebase-admin';

// ─── Initialise Admin SDK once (singleton) ────────────────────────────────────

function getAdminApp(): admin.app.App {
  if (admin.apps.length > 0) return admin.apps[0]!;

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!serviceAccountJson) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON env var is not set.');
  }

  return admin.initializeApp({
    credential: admin.credential.cert(
      JSON.parse(serviceAccountJson) as admin.ServiceAccount
    ),
  });
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: Record<string, unknown>;

  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  try {
    const db = getAdminApp().firestore();

    await db.collection('pushNotificationLogs').add({
      // Raw payload stringified so nested objects survive Firestore's type constraints
      rawPayload: JSON.stringify(body.payload ?? body),
      // Parsed copy for easier reading in Firestore Console
      parsedPayload: body.payload ?? body,
      source: typeof body.source === 'string' ? body.source : 'unknown',
      receivedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[log-push] Firestore write error:', err);
    return NextResponse.json(
      { error: 'Failed to log payload', detail: String(err) },
      { status: 500 }
    );
  }
}
