import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './config';

export interface VendorInfo {
  vendorId: string;
  role: 'admin' | 'member';
  vendorCode: string;
  vendorName: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function generateCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length: 6 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join('');
}

async function isCodeUnique(code: string): Promise<boolean> {
  const q = query(collection(db, 'vendors'), where('code', '==', code));
  const snap = await getDocs(q);
  return snap.empty;
}

async function generateUniqueCode(): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const code = generateCode();
    if (await isCodeUnique(code)) return code;
  }
  throw new Error('Gagal membuat kode unik. Coba lagi.');
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Returns the vendor info for a given user UID, or null if none.
 */
export async function getUserVendor(userId: string): Promise<VendorInfo | null> {
  const q = query(
    collection(db, 'vendorMembers'),
    where('userId', '==', userId)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;

  const memberData = snap.docs[0].data();
  const vendorSnap = await getDoc(doc(db, 'vendors', memberData.vendorId));
  if (!vendorSnap.exists()) return null;

  const vendorData = vendorSnap.data();
  return {
    vendorId: memberData.vendorId,
    role: memberData.role as 'admin' | 'member',
    vendorCode: vendorData.code ?? '',
    vendorName: vendorData.name ?? '',
  };
}

/**
 * Finds a vendor by its 6-character join code.
 */
export async function getVendorByCode(
  code: string
): Promise<{ id: string; name: string; code: string } | null> {
  const q = query(
    collection(db, 'vendors'),
    where('code', '==', code.trim().toUpperCase())
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, name: d.data().name, code: d.data().code };
}

/**
 * Creates a new vendor and adds the creator as admin.
 * Returns the new vendorId and generated code.
 */
export async function createVendor(
  name: string,
  userId: string
): Promise<{ vendorId: string; code: string }> {
  const code = await generateUniqueCode();

  const vendorRef = doc(collection(db, 'vendors'));
  await setDoc(vendorRef, {
    name: name.trim(),
    code,
    createdAt: serverTimestamp(),
    createdBy: userId,
  });

  const memberRef = doc(collection(db, 'vendorMembers'));
  await setDoc(memberRef, {
    vendorId: vendorRef.id,
    userId,
    role: 'admin',
    joinedAt: serverTimestamp(),
  });

  return { vendorId: vendorRef.id, code };
}

/**
 * Joins an existing vendor as a member.
 * No-op if user is already a member.
 */
export async function joinVendor(
  vendorId: string,
  userId: string
): Promise<void> {
  const existing = await query(
    collection(db, 'vendorMembers'),
    where('userId', '==', userId),
    where('vendorId', '==', vendorId)
  );
  const existingSnap = await getDocs(existing);
  if (!existingSnap.empty) return;

  const memberRef = doc(collection(db, 'vendorMembers'));
  await setDoc(memberRef, {
    vendorId,
    userId,
    role: 'member',
    joinedAt: serverTimestamp(),
  });
}
